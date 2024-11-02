import React, { useState, useEffect, useRef, useMemo } from 'react';
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
        const credentials = localStorage.getItem('credentials');
        if (!credentials) {
          navigate('/login');
          return;
        }

        // Update the endpoint URL
        const response = await fetch('/api/dashboard/dashboard-data', {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('credentials');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setDashboardData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

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
    <div className="p-6 ml-64">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Financial Overview</h1>
      
      {/* Rest of your dashboard JSX */}
    </div>
  );
};

export default Dashboard;