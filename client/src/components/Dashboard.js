import React, { useState, useEffect, useRef } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import * as d3 from 'd3';
import { UserCircle, TrendingUp, TrendingDown, DollarSign, X, LogOut } from 'lucide-react';
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

const Dashboard = ({ onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const d3Container = useRef(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isSlideoutOpen, setIsSlideoutOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(100);

  const fetchData = async () => {
    try {
      const credentials = localStorage.getItem('credentials');
      const headers = {
        'Authorization': `Basic ${credentials}`
      };

      const dashboardResponse = await fetch('/api/dashboard-data', { headers });
      const dashboardResult = await dashboardResponse.json();
      setDashboardData(dashboardResult);

      const transactionsResponse = await fetch(
        `/api/transactions?page=${currentPage}&pageSize=${pageSize}&sortKey=${sortConfig.key}&sortDir=${sortConfig.direction}`, 
        { headers }
      );
      const transactionsResult = await transactionsResponse.json();
      setTransactions(transactionsResult.transactions);
      setTotalPages(transactionsResult.totalPages);

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, sortConfig]);

  useEffect(() => {
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const renderChart = () => {
      if (dashboardData?.departmentRevenue && 
          d3Container.current && 
          d3Container.current.clientWidth > 0) {
        createD3Chart(dashboardData.departmentRevenue);
      } else if (dashboardData?.departmentRevenue) {
        setTimeout(renderChart, 100);
      }
    };

    renderChart();
    
    const resizeObserver = new ResizeObserver(renderChart);
    if (d3Container.current) {
      resizeObserver.observe(d3Container.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
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

    // Gradient for bars
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

    // Add bars with animation
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

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setIsSlideoutOpen(true);
  };

  const validateTransaction = (transaction) => {
    const errors = {};
    
    if (!transaction.date) errors.date = 'Date is required';
    if (!transaction.description?.trim()) errors.description = 'Description is required';
    if (!transaction.category?.trim()) errors.category = 'Category is required';
    if (!transaction.department?.trim()) errors.department = 'Department is required';
    
    const amount = transaction.credit || transaction.debit;
    if (!amount || amount <= 0) errors.amount = 'Amount must be greater than 0';

    return errors;
  };

  const handleSaveTransaction = async () => {
    const errors = validateTransaction(selectedTransaction);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      const credentials = localStorage.getItem('credentials');
      const isNewTransaction = !selectedTransaction.id;
      const method = isNewTransaction ? 'POST' : 'PUT';
      const url = isNewTransaction 
        ? '/api/transactions' 
        : `/api/transactions/${selectedTransaction.id}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedTransaction),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isNewTransaction ? 'create' : 'update'} transaction`);
      }

      setIsSlideoutOpen(false);
      await fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert(`Failed to ${isNewTransaction ? 'create' : 'update'} transaction. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const requestSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: 
        prevConfig.key === key && prevConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc',
    }));
    setCurrentPage(1);
  };

  const PaginationControls = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
        <div className="flex items-center">
          <p className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border`}
          >
            ←
          </button>
          
          {startPage > 1 && (
            <>
              <button
                onClick={() => setCurrentPage(1)}
                className="px-3 py-1 border rounded-md hover:bg-gray-50"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2">...</span>}
            </>
          )}

          {pages.map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2">...</span>}
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="px-3 py-1 border rounded-md hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border`}
          >
            →
          </button>
        </div>
      </div>
    );
  };

  const handleNewTransaction = () => {
    setSelectedTransaction({
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: '',
      department: '',
      credit: null,
      debit: null,
      type: 'expense'
    });
    setIsSlideoutOpen(true);
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
            <button 
              onClick={onLogout}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <LogOut size={20} className="mr-1" />
              Logout
            </button>
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
            <div ref={d3Container} className="min-h-[300px] w-full" />
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg mb-2">Revenue vs Expenses</h3>
            <div className="h-[300px]">
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
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg mb-2">Expense Categories</h3>
            <div className="h-[300px]">
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
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg">Recent Transactions</h3>
            <button
              onClick={handleNewTransaction}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              New Transaction
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { key: 'date', label: 'Date' },
                    { key: 'description', label: 'Description' },
                    { key: 'category', label: 'Category' },
                    { key: 'department', label: 'Department' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'type', label: 'Type' }
                  ].map(({ key, label }) => (
                    <th 
                      key={key}
                      onClick={() => requestSort(key)}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {sortConfig.key === key && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction, index) => (
                    <tr 
                      key={transaction.id || index} 
                      onClick={() => handleTransactionClick(transaction)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform ${
        isSlideoutOpen ? 'translate-x-0' : 'translate-x-full'
      } transition-transform duration-300 ease-in-out`}>
        {selectedTransaction && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Edit Transaction</h3>
              <button 
                onClick={() => setIsSlideoutOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        const currentAmount = Number(selectedTransaction.credit) || Number(selectedTransaction.debit) || 0;
                        setSelectedTransaction({
                          ...selectedTransaction,
                          type: 'expense',
                          credit: null,
                          debit: currentAmount || null
                        });
                      }}
                      className={`px-4 py-2 rounded-l-md border ${
                        (!selectedTransaction.credit && selectedTransaction.type === 'expense')
                          ? 'bg-red-100 text-red-800 border-red-300' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentAmount = Number(selectedTransaction.credit) || Number(selectedTransaction.debit) || 0;
                        setSelectedTransaction({
                          ...selectedTransaction,
                          type: 'income',
                          credit: currentAmount || null,
                          debit: null
                        });
                      }}
                      className={`px-4 py-2 rounded-r-md border-t border-r border-b -ml-px ${
                        (selectedTransaction.credit || selectedTransaction.type === 'income')
                          ? 'bg-green-100 text-green-800 border-green-300' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Income
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={selectedTransaction.date.split('T')[0]}
                    onChange={(e) => {
                      setSelectedTransaction({
                        ...selectedTransaction,
                        date: e.target.value
                      });
                      setFormErrors({ ...formErrors, date: '' });
                    }}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                      ${formErrors.date ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {formErrors.date && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    value={selectedTransaction.description}
                    onChange={(e) => {
                      setSelectedTransaction({
                        ...selectedTransaction,
                        description: e.target.value
                      });
                      setFormErrors({ ...formErrors, description: '' });
                    }}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                      ${formErrors.description ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    value={selectedTransaction.category}
                    onChange={(e) => {
                      setSelectedTransaction({
                        ...selectedTransaction,
                        category: e.target.value
                      });
                      setFormErrors({ ...formErrors, category: '' });
                    }}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                      ${formErrors.category ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {formErrors.category && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    value={selectedTransaction.department}
                    onChange={(e) => {
                      setSelectedTransaction({
                        ...selectedTransaction,
                        department: e.target.value
                      });
                      setFormErrors({ ...formErrors, department: '' });
                    }}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                      ${formErrors.department ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {formErrors.department && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.department}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={(Number(selectedTransaction.credit) || Number(selectedTransaction.debit) || '').toString()}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setSelectedTransaction({
                        ...selectedTransaction,
                        credit: selectedTransaction.type === 'income' ? value : null,
                        debit: selectedTransaction.type === 'expense' ? value : null
                      });
                      setFormErrors({ ...formErrors, amount: '' });
                    }}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                      ${formErrors.amount ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {formErrors.amount && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t">
              <button
                className={`w-full px-4 py-2 rounded-md text-white ${
                  isSaving 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={handleSaveTransaction}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
      <PaginationControls />
    </div>
  );
};

export default Dashboard;