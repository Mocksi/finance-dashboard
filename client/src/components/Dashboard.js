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

  // Pie Chart Data (Department Revenue)
  const departmentData = {
    labels: dashboardData?.departmentMetrics?.map(d => d.department) || [],
    datasets: [
      {
        data: dashboardData?.departmentMetrics?.map(d => d.revenue) || [],
        backgroundColor: [
          '#4299E1', '#48BB78', '#F6AD55', '#F56565', 
          '#9F7AEA', '#ED64A6', '#4FD1C5', '#667EEA'
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };

  // D3 Bar Chart is handled in the useEffect
  useEffect(() => {
    if (d3Container.current && dashboardData?.departmentMetrics) {
      // Clear any existing SVG
      d3.select(d3Container.current).selectAll("*").remove();

      const margin = { top: 20, right: 20, bottom: 40, left: 60 };
      const width = d3Container.current.clientWidth - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;

      // Create SVG
      const svg = d3.select(d3Container.current)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Process data
      const data = dashboardData.departmentMetrics;

      // Create scales
      const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);

      const y = d3.scaleLinear()
        .range([height, 0]);

      // Set domains
      x.domain(data.map(d => d.department));
      y.domain([0, d3.max(data, d => d.revenue)]);

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
          .tickFormat(d => `$${d3.format(',')(d)}`));

      // Add bars
      svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.department))
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.revenue))
        .attr('height', d => height - y(d.revenue))
        .attr('fill', '#4299E1')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill', '#3182CE');

          svg.append('text')
            .attr('class', 'value-label')
            .attr('x', x(d.department) + x.bandwidth() / 2)
            .attr('y', y(d.revenue) - 5)
            .attr('text-anchor', 'middle')
            .text(`$${d3.format(',')(d.revenue)}`);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill', '#4299E1');
          
          svg.selectAll('.value-label').remove();
        });

      // Add X axis label
      svg.append('text')
        .attr('transform', `translate(${width/2},${height + margin.top + 20})`)
        .style('text-anchor', 'middle')
        .text('Department');

      // Add Y axis label
      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Revenue ($)');

      // Handle window resize
      const handleResize = () => {
        const newWidth = d3Container.current.clientWidth - margin.left - margin.right;
        
        svg.attr('width', newWidth + margin.left + margin.right);
        
        x.range([0, newWidth]);
        
        svg.selectAll('.bar')
          .attr('x', d => x(d.department))
          .attr('width', x.bandwidth());
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [dashboardData?.departmentMetrics]);

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
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Department Revenue'
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
        {/* Revenue vs Expenses - Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue vs Expenses</h2>
          <Line data={monthlyData} options={chartOptions} />
        </div>

        {/* Department Revenue - Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Department Revenue</h2>
          <Pie data={departmentData} options={pieOptions} />
        </div>

        {/* Revenue by Department - D3 Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue by Department</h2>
          <div ref={d3Container} className="w-full h-[300px]" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;