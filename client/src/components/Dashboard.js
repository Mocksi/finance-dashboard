import React, { useState, useEffect, useRef } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import * as d3 from 'd3';
import { UserCircle } from 'lucide-react';

// Register ChartJS components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const d3Container = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const credentials = localStorage.getItem('credentials');
        console.log('Credentials found:', !!credentials);

        const headers = {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json'
        };
        console.log('Request headers:', headers);

        // Fetch dashboard data
        const dashboardResponse = await fetch('/api/dashboard-data', { headers });
        console.log('Dashboard response status:', dashboardResponse.status);
        
        // Log the raw response with clear markers
        const rawResponse = await dashboardResponse.text();
        console.log('=================== START OF RAW RESPONSE ===================');
        console.log(rawResponse);
        console.log('=================== END OF RAW RESPONSE ===================');

        // Only try to parse if it's not HTML
        if (!rawResponse.includes('<!DOCTYPE')) {
          const dashboardResult = JSON.parse(rawResponse);
          setDashboardData(dashboardResult);
        } else {
          console.error('Received HTML instead of JSON response');
          console.log('Full HTML response:', rawResponse);
        }

        // Fetch transactions
        const transactionsResponse = await fetch('/api/transactions', { headers });
        console.log('Transactions response status:', transactionsResponse.status);
        
        const rawTransactions = await transactionsResponse.text();
        console.log('Raw Transactions Response:', rawTransactions);

        if (!rawTransactions.includes('<!DOCTYPE')) {
          const transactionsResult = JSON.parse(rawTransactions);
          setTransactions(transactionsResult.transactions);
        } else {
          console.error('Received HTML instead of JSON response for transactions');
          console.log('Full HTML transactions response:', rawTransactions);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name
        });
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (dashboardData?.departmentRevenue && d3Container.current) {
      createD3Chart(dashboardData.departmentRevenue);
    }
  }, [dashboardData]);

  const createD3Chart = (departmentData) => {
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Clear existing chart
    d3.select(d3Container.current).selectAll("*").remove();

    const svg = d3.select(d3Container.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .range([height, 0]);

    x.domain(departmentData.map(d => d.department));
    y.domain([0, d3.max(departmentData, d => d.revenue)]);

    // Add bars
    svg.selectAll('.bar')
      .data(departmentData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.department))
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.revenue))
      .attr('height', d => height - y(d.revenue))
      .attr('fill', 'steelblue');

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append('g')
      .call(d3.axisLeft(y));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const revenueData = {
    labels: dashboardData?.monthlyRevenue.map(item => new Date(item.month).toLocaleDateString('en-US', { month: 'short' })) || [],
    datasets: [{
      label: 'Monthly Revenue',
      data: dashboardData?.monthlyRevenue.map(item => item.revenue) || [],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const expenseData = {
    labels: dashboardData?.categoryExpenses.map(item => item.category) || [],
    datasets: [{
      data: dashboardData?.categoryExpenses.map(item => item.total) || [],
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ]
    }]
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <img src="/api/placeholder/120/40" alt="Company Logo" className="h-10" />
          <div className="flex items-center gap-3">
            <span className="text-gray-700">admin@company.com</span>
            <UserCircle size={40} className="text-gray-400" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg mb-2">Revenue by Department (D3)</h3>
            <div ref={d3Container}></div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg mb-2">Revenue Trend</h3>
            <Line data={revenueData} />
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg mb-2">Expenses by Category</h3>
            <Pie data={expenseData} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h3 className="text-lg p-4 border-b">General Ledger</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Debit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction, index) => (
                  <tr key={transaction.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{transaction.description}</td>
                    <td className="px-6 py-4">{transaction.category}</td>
                    <td className="px-6 py-4">{transaction.department}</td>
                    <td className="px-6 py-4">${transaction.debit.toLocaleString()}</td>
                    <td className="px-6 py-4">${transaction.credit.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      ${(transaction.credit - transaction.debit).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;