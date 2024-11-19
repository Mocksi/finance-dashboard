import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import * as d3 from 'd3';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { UserContext } from '../contexts/UserContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [dashboardData, setDashboardData] = useState({
    monthlyMetrics: [],
    departmentMetrics: [],
    expenseCategories: [],
    invoiceProjections: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const d3Container = useRef(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const authHeader = localStorage.getItem('authHeader');
        if (!authHeader) {
          navigate('/login');
          return;
        }

        const response = await fetch('https://finance-dashboard-tfn6.onrender.com/api/dashboard/dashboard-data', {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('authHeader');
          navigate('/login');
          return;
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [navigate, user]);

  // Update the monthlyData calculation
  const monthlyData = useMemo(() => {
    if (!dashboardData?.monthlyMetrics?.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    const months = dashboardData.monthlyMetrics.map(m => 
      new Date(m.month).toLocaleString('default', { month: 'short' })
    );

    return {
      labels: months,
      datasets: [
        {
          label: 'Revenue',
          data: dashboardData.monthlyMetrics.map(m => m.revenue || 0),
          borderColor: '#60A5FA',
          backgroundColor: 'transparent',
          borderWidth: 2
        },
        {
          label: 'Projected Revenue',
          data: dashboardData.invoiceProjections?.map(p => p.projected_revenue || 0) || [],
          borderColor: '#93C5FD',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5]
        },
        {
          label: 'Expenses',
          data: dashboardData.monthlyMetrics.map(m => m.expenses || 0),
          borderColor: '#F87171',
          backgroundColor: 'transparent',
          borderWidth: 2
        }
      ]
    };
  }, [dashboardData]);

  // D3 Chart Rendering
  useEffect(() => {
    if (d3Container.current && dashboardData.departmentMetrics.length > 0) {
      const margin = { top: 20, right: 30, bottom: 40, left: 60 };
      const width = d3Container.current.clientWidth - margin.left - margin.right;
      const height = d3Container.current.clientHeight - margin.top - margin.bottom;

      // Clear existing chart
      d3.select(d3Container.current).selectAll('*').remove();

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

      x.domain(dashboardData.departmentMetrics.map(d => d.department));
      y.domain([0, d3.max(dashboardData.departmentMetrics, d => d.revenue)]);

      // Add X axis
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');

      // Add Y axis
      svg.append('g')
        .call(d3.axisLeft(y)
          .ticks(5)
          .tickFormat(d => `$${d/1000}K`));

      // Add bars
      svg.selectAll('rect')
        .data(dashboardData.departmentMetrics)
        .enter()
        .append('rect')
        .attr('x', d => x(d.department))
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.revenue))
        .attr('height', d => height - y(d.revenue))
        .attr('fill', '#3B82F6');
    }
  }, [dashboardData, d3Container]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Financial Overview</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${(dashboardData.monthlyMetrics || [])
                  .reduce((sum, m) => sum + (Number(m.revenue) || 0), 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${(dashboardData.monthlyMetrics || [])
                  .reduce((sum, m) => sum + (Number(m.expenses) || 0), 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Income</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${(dashboardData.monthlyMetrics || [])
                  .reduce((sum, m) => sum + (Number(m.revenue || 0) - Number(m.expenses || 0)), 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Revenue vs Expenses Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses</h2>
          <div className="h-80">
            <Line
              data={monthlyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    align: 'end'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: value => `$${value/1000}K`
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Revenue by Department Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Department</h2>
          <div className="h-80" ref={d3Container}></div>
        </div>

        {/* Expense Categories Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h2>
          <div className="h-80">
            <Pie
              data={{
                labels: dashboardData.expenseCategories.map(c => c.category),
                datasets: [{
                  data: dashboardData.expenseCategories.map(c => Number(c.amount)),
                  backgroundColor: [
                    '#EF4444', // Red
                    '#F59E0B', // Orange
                    '#10B981', // Green
                    '#3B82F6'  // Blue
                  ]
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;