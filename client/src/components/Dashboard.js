import React, { useState, useEffect, useRef, useMemo } from 'react';
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

  // Fetch Dashboard Data
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
      console.error('Error fetching dashboard data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // D3 Chart Rendering
  useEffect(() => {
    const renderChart = () => {
      if (d3Container.current && dashboardData?.departmentMetrics) {
        // Clear existing chart
        d3.select(d3Container.current).selectAll('*').remove();

        const margin = { top: 30, right: 30, bottom: 100, left: 80 };
        const width = d3Container.current.clientWidth - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

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
        const data = dashboardData.departmentMetrics;

        x.domain(data.map(d => d.department));
        y.domain([0, d3.max(data, d => Number(d.revenue)) * 1.1]); // 10% padding

        // Add X axis
        svg.append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x))
          .selectAll('text')
          .attr('transform', 'translate(-10,10)rotate(-45)')
          .style('text-anchor', 'end')
          .style('font-size', '12px');

        // Add Y axis
        svg.append('g')
          .call(d3.axisLeft(y)
            .ticks(5)
            .tickFormat(d => `$${d3.format(',.0f')(d)}`))
          .selectAll('text')
          .style('font-size', '12px');

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
    };

    renderChart();

    // Add resize listener
    window.addEventListener('resize', renderChart);

    return () => {
      window.removeEventListener('resize', renderChart);
    };
  }, [dashboardData?.departmentMetrics]);

  // Chart.js Data and Options
  const monthlyData = {
    labels: dashboardData?.monthlyMetrics?.map(d => new Date(d.month).toLocaleString('default', { month: 'short' })) || [],
    datasets: [
      {
        label: 'Revenue',
        data: dashboardData?.monthlyMetrics?.map(d => Number(d.revenue)) || [],
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        fill: true,
      },
      {
        label: 'Expenses',
        data: dashboardData?.monthlyMetrics?.map(d => Number(d.expenses)) || [],
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Monthly Revenue vs Expenses'
      }
    },
    scales: {
      x: {
        type: 'category',
        display: true,
        title: {
          display: true,
          text: 'Month'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 12
          }
        }
      },
      y: {
        type: 'linear',
        display: true,
        title: {
          display: true,
          text: 'Amount ($)'
        },
        ticks: {
          beginAtZero: true,
          font: {
            size: 12
          },
          callback: function(value) {
            return `$${value.toLocaleString()}`;
          }
        }
      }
    }
  };

  const expenseData = {
    labels: dashboardData?.expenseCategories?.map(d => d.category) || [],
    datasets: [{
      data: dashboardData?.expenseCategories?.map(d => Number(d.total)) || [],
      backgroundColor: [
        '#4299E1',
        '#48BB78',
        '#F6AD55',
        '#F56565',
        '#9F7AEA',
        '#ED64A6',
      ],
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Expense Categories'
      }
    }
  };

  // Fix the data aggregation for department revenue
  const departmentRevenueData = useMemo(() => {
    if (!transactions?.length) return null;
    
    const aggregated = transactions.reduce((acc, transaction) => {
      // Only include credit transactions (revenue)
      if (!transaction.credit || transaction.credit <= 0) return acc;
      
      const dept = transaction.department || 'Uncategorized';
      acc[dept] = (acc[dept] || 0) + parseFloat(transaction.credit);
      return acc;
    }, {});

    return {
      labels: Object.keys(aggregated),
      datasets: [{
        data: Object.values(aggregated),
        backgroundColor: [
          '#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981',
          '#6366F1', '#8B5CF6', '#F472B6', '#FBBF24', '#34D399'
        ]
      }]
    };
  }, [transactions]);

  // Fix the data aggregation for expense categories
  const expenseCategoriesData = useMemo(() => {
    if (!transactions?.length) return null;
    
    const aggregated = transactions.reduce((acc, transaction) => {
      // Only include debit transactions (expenses)
      if (!transaction.debit || transaction.debit <= 0) return acc;
      
      const category = transaction.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + parseFloat(transaction.debit);
      return acc;
    }, {});

    return {
      labels: Object.keys(aggregated),
      datasets: [{
        data: Object.values(aggregated),
        backgroundColor: [
          '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#14B8A6',
          '#F43F5E', '#FB923C', '#FACC15', '#A3E635', '#2DD4BF'
        ]
      }]
    };
  }, [transactions]);

  if (isLoading) {
    return <div className="text-center mt-10">Loading Dashboard...</div>;
  }

  return (
    <div className="p-6 ml-64"> {/* Added ml-64 to accommodate fixed sidebar */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Financial Overview</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${dashboardData.monthlyMetrics.reduce((acc, curr) => acc + Number(curr.revenue), 0).toLocaleString()}
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
                ${dashboardData.monthlyMetrics.reduce((acc, curr) => acc + Number(curr.expenses), 0).toLocaleString()}
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
                ${(
                  dashboardData.monthlyMetrics.reduce((acc, curr) => acc + Number(curr.revenue), 0) -
                  dashboardData.monthlyMetrics.reduce((acc, curr) => acc + Number(curr.expenses), 0)
                ).toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Department - D3 Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue by Department</h2>
          <div 
            ref={d3Container} 
            className="w-full h-80 flex justify-center overflow-x-auto" 
          />
        </div>

        {/* Revenue vs Expenses - Line Chart */}
        <div className="bg-white rounded-lg shadow p-6 h-80 flex flex-col">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue vs Expenses</h2>
          <div className="flex-1">
            <Line data={monthlyData} options={chartOptions} />
          </div>
        </div>

        {/* Expense Categories - Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6 h-80 flex flex-col">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Expense Categories</h2>
          <div className="flex-1">
            {expenseData.labels.length > 0 && expenseData.datasets[0].data.length > 0 ? (
              <Pie data={expenseData} options={pieOptions} />
            ) : (
              <div className="text-center text-gray-500">No data available for Expense Categories.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;