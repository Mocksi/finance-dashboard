import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import * as d3 from 'd3';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
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
      console.log('Dashboard API Response:', dashboardResult);
      setDashboardData(dashboardResult);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('Dashboard Data:', dashboardData);
    if (dashboardData?.monthlyMetrics) {
      console.log('Monthly Metrics:', dashboardData.monthlyMetrics);
      const totals = calculateTotals(dashboardData);
      console.log('Calculated Totals:', totals);
    }
  }, [dashboardData]);

  // Line Chart Data (Revenue vs Expenses)
  const monthlyData = {
    labels: dashboardData?.monthlyMetrics?.map(item => 
      new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ).reverse() || [],
    datasets: [
      {
        label: 'Revenue',
        data: dashboardData?.monthlyMetrics?.map(item => Number(item.revenue)).reverse() || [],
        borderColor: '#4299E1',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Expenses',
        data: dashboardData?.monthlyMetrics?.map(item => Number(item.expenses)).reverse() || [],
        borderColor: '#F56565',
        tension: 0.1,
        fill: false
      }
    ]
  };

  // Pie Chart Data (Expense Categories)
  const expenseData = {
    labels: dashboardData?.categoryExpenses?.map(d => d.category) || [],
    datasets: [{
      data: dashboardData?.categoryExpenses?.map(d => Number(d.total)) || [],
      backgroundColor: [
        '#4299E1', // blue
        '#48BB78', // green
        '#F6AD55', // orange
        '#F56565', // red
        '#9F7AEA', // purple
        '#ED64A6', // pink
      ],
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  };

  // D3 Bar Chart is handled in the useEffect
  useEffect(() => {
    if (d3Container.current && dashboardData?.departmentRevenue) {
      // Clear existing chart
      d3.select(d3Container.current).selectAll('*').remove();

      const margin = { top: 30, right: 30, bottom: 70, left: 80 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const svg = d3.select(d3Container.current)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand()
        .range([0, width])
        .padding(0.3);

      const y = d3.scaleLinear()
        .range([height, 0]);

      // Process data
      const data = dashboardData.departmentRevenue;

      x.domain(data.map(d => d.department));
      y.domain([0, d3.max(data, d => Number(d.revenue))]);

      // Add X axis
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'translate(-10,5)rotate(-45)')
        .style('text-anchor', 'end');

      // Add Y axis
      svg.append('g')
        .call(d3.axisLeft(y)
          .ticks(5)
          .tickFormat(d => `$${d3.format(',.0f')(d)}`));

      // Add bars
      svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.department))
        .attr('width', x.bandwidth())
        .attr('y', d => y(Number(d.revenue)))
        .attr('height', d => height - y(Number(d.revenue)))
        .attr('fill', '#4299E1');
    }
  }, [dashboardData?.departmentRevenue]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'category',
        display: true,
        title: {
          display: true,
          text: 'Month'
        }
      },
      y: {
        type: 'linear',
        display: true,
        title: {
          display: true,
          text: 'Amount ($)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Monthly Revenue vs Expenses'
      }
    }
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  const calculateTotals = (data) => {
    if (!data?.monthlyMetrics) return { revenue: 0, expenses: 0, net: 0 };

    return data.monthlyMetrics.reduce((acc, month) => ({
      revenue: acc.revenue + Number(month.revenue || 0),
      expenses: acc.expenses + Number(month.expenses || 0),
      net: acc.revenue + Number(month.revenue || 0) - (acc.expenses + Number(month.expenses || 0))
    }), { revenue: 0, expenses: 0, net: 0 });
  };

  const totals = calculateTotals(dashboardData);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Financial Overview</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${totals.revenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${totals.expenses.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Income</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${totals.net.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Department - D3 Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue by Department</h2>
          <div ref={d3Container} className="w-full flex justify-center" />
        </div>

        {/* Revenue vs Expenses - Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue vs Expenses</h2>
          <Line data={monthlyData} options={chartOptions} />
        </div>

        {/* Expense Categories - Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Expense Categories</h2>
          <Pie data={expenseData} options={pieOptions} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;