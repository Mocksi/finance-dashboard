import React, { useState, useEffect, useRef } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import * as d3 from 'd3';
import { UserCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
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

  const fetchData = async () => {
    try {
      const credentials = localStorage.getItem('credentials');
      const headers = {
        'Authorization': `Basic ${credentials}`
      };

      const dashboardResponse = await fetch('/api/dashboard-data', { headers });
      const dashboardResult = await dashboardResponse.json();
      setDashboardData(dashboardResult);

      const transactionsResponse = await fetch('/api/transactions', { headers });
      const transactionsResult = await transactionsResponse.json();
      setTransactions(transactionsResult.transactions);

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const renderChart = () => {
      if (dashboardData?.departmentRevenue && d3Container.current) {
        setTimeout(() => {
          createD3Chart(dashboardData.departmentRevenue);
        }, 100);
      }
    };

    renderChart();
    window.addEventListener('resize', renderChart);
    return () => window.removeEventListener('resize', renderChart);
  }, [dashboardData]);

  const createD3Chart = (departmentData) => {
    if (!departmentData || !departmentData.length || !d3Container.current) return;

    d3.select(d3Container.current).selectAll("*").remove();

    const containerWidth = d3Container.current.clientWidth;
    const margin = { top: 30, right: 30, bottom: 60, left: 80 };
    const width = Math.max(containerWidth - margin.left - margin.right, 300);
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(d3Container.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const validData = departmentData
      .filter(d => Number(d.revenue) > 0)
      .sort((a, b) => Number(b.revenue) - Number(a.revenue));

    const x = d3.scaleBand()
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .range([height, 0]);

    x.domain(validData.map(d => d.department));
    y.domain([0, d3.max(validData, d => Number(d.revenue) * 1.1)]);

    // Add gradient definition
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "bar-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3182CE");

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#4299E1");

    // Add bars
    const bars = svg.selectAll('.bar')
      .data(validData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.department))
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', 'url(#bar-gradient)');

    // Add animation
    bars.transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => y(Number(d.revenue)))
      .attr('height', d => height - y(Number(d.revenue)));

    // Add hover effects
    bars.on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('fill', '#2C5282');

      svg.append('text')
        .attr('class', 'value-label')
        .attr('x', x(d.department) + x.bandwidth() / 2)
        .attr('y', y(Number(d.revenue)) - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', '#2D3748')
        .text(`$${Number(d.revenue).toLocaleString()}`);
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('fill', 'url(#bar-gradient)');
      
      svg.selectAll('.value-label').remove();
    });

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.8em')
      .attr('dy', '0.15em')
      .style('font-size', '12px');

    svg.append('g')
      .call(d3.axisLeft(y)
        .tickFormat(d => `$${d/1000}K`)
        .ticks(5))
      .style('font-size', '12px');

    // Add Y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Revenue ($)');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading dashboard data...</div>
      </div>
    );
  }

  const monthlyData = {
    labels: dashboardData?.monthlyMetrics.map(item => 
      new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ).reverse() || [],
    datasets: [
      {
        label: 'Revenue',
        data: dashboardData?.monthlyMetrics.map(item => Number(item.revenue)).reverse() || [],
        borderColor: '#4299E1',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Expenses',
        data: dashboardData?.monthlyMetrics.map(item => Number(item.expenses)).reverse() || [],
        borderColor: '#F56565',
        tension: 0.1,
        fill: false
      }
    ]
  };

  const expenseData = {
    labels: dashboardData?.categoryExpenses?.map(item => item.category) || [],
    datasets: [{
      data: dashboardData?.categoryExpenses?.map(item => Number(item.total)) || [],
      backgroundColor: [
        '#F56565',
        '#4299E1',
        '#F6AD55',
        '#48BB78',
        '#9F7AEA'
      ]
    }]
  };

  const kpis = dashboardData?.kpis || {};
  const revenueGrowth = kpis.current_month_revenue && kpis.last_month_revenue
    ? (kpis.last_month_revenue > 0 
        ? ((kpis.current_month_revenue - kpis.last_month_revenue) / kpis.last_month_revenue * 100)
        : 0)
    : 0;

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500">Current Month Revenue</h3>
              <DollarSign className="text-green-500" />
            </div>
            <p className="text-2xl font-bold">
              ${Number(kpis.current_month_revenue || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500">Revenue Growth</h3>
              {revenueGrowth >= 0 ? 
                <TrendingUp className="text-green-500" /> : 
                <TrendingDown className="text-red-500" />
              }
            </div>
            <p className="text-2xl font-bold">
              {!isNaN(revenueGrowth) ? `${revenueGrowth.toFixed(1)}%` : '0%'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500">Current Month Expenses</h3>
              <DollarSign className="text-red-500" />
            </div>
            <p className="text-2xl font-bold">
              ${Number(kpis.current_month_expenses || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500">Active Departments</h3>
              <DollarSign className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{kpis.active_departments || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg mb-2">Revenue by Department</h3>
            <div ref={d3Container} className="min-h-[300px]" />
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg mb-2">Revenue vs Expenses</h3>
            <Line 
              data={monthlyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: value => `$${value/1000}K`
                    }
                  }
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => `$${context.raw.toLocaleString()}`
                    }
                  }
                }
              }}
            />
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg mb-2">Expense Categories</h3>
            <Pie 
              data={expenseData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => `$${context.raw.toLocaleString()}`
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h3 className="text-lg p-4 border-b">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
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
                    <td className="px-6 py-4">
                      <span className={transaction.credit > 0 ? 'text-green-600' : 'text-red-600'}>
                        ${(Number(transaction.credit) || Number(transaction.debit)).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.credit > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.credit > 0 ? 'Income' : 'Expense'}
                      </span>
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