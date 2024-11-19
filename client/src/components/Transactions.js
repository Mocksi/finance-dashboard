import React, { useState, useEffect, useMemo, useContext } from 'react';
import { X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';

const Transactions = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isSlideoutOpen, setIsSlideoutOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState(null);

  const newTransaction = {
    id: Date.now(), // Temporary ID for new transactions
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    department: '',
    type: 'expense',
    credit: 0,
    debit: 0
  };

  const addNewTransaction = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedTransaction({
      id: Date.now(),
      type: 'expense', // Default to expense
      date: today,
      description: '',
      category: '',
      department: '',
      credit: 0,
      debit: 0
    });
    setIsSlideoutOpen(true);
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const authHeader = localStorage.getItem('authHeader');
        if (!authHeader) {
          navigate('/login', { replace: true });
          return;
        }

        const response = await fetch('https://finance-dashboard-tfn6.onrender.com/api/transactions', {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('authHeader');
          navigate('/login', { replace: true });
          return;
        }

        const data = await response.json();
        setTransactions(data.transactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTransactions();
    }
  }, [navigate, user]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    sortTransactions(key, direction);
  };

  const sortTransactions = (key, direction) => {
    const sorted = [...transactions].sort((a, b) => {
      if (key === 'amount') {
        return direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else {
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
      }
    });
    setTransactions(sorted);
  };

  const openSlideout = (transaction) => {
    // Determine transaction type based on credit/debit
    const type = transaction.credit > 0 ? 'income' : 'expense';
    
    // Format the date to YYYY-MM-DD for the date input
    const formattedDate = transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '';
    
    setSelectedTransaction({
      ...transaction,
      type,
      date: formattedDate
    });
    setIsSlideoutOpen(true);
  };

  const closeSlideout = () => {
    setIsSlideoutOpen(false);
    setSelectedTransaction(null);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      // When type changes, reset the credit/debit values
      setSelectedTransaction({
        ...selectedTransaction,
        type: value,
        credit: 0,
        debit: 0
      });
    } else {
      setSelectedTransaction({
        ...selectedTransaction,
        [name]: value
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!selectedTransaction.date) errors.date = 'Date is required';
    if (!selectedTransaction.description) errors.description = 'Description is required';
    if (!selectedTransaction.category) errors.category = 'Category is required';
    if (!selectedTransaction.department) errors.department = 'Department is required';
    if ((selectedTransaction.credit === 0 && selectedTransaction.debit === 0) ||
        (selectedTransaction.credit > 0 && selectedTransaction.debit > 0)) {
      errors.amount = 'Either credit or debit must be set, not both';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveTransaction = async () => {
    if (!validateForm()) return;

    try {
      const authHeader = localStorage.getItem('authHeader');
      if (!authHeader) {
        navigate('/login', { replace: true });
        return;
      }

      const payload = {
        ...selectedTransaction,
        credit: selectedTransaction.type === 'income' ? Number(selectedTransaction.credit) : 0,
        debit: selectedTransaction.type === 'expense' ? Number(selectedTransaction.debit) : 0
      };

      const response = await fetch('https://finance-dashboard-tfn6.onrender.com/api/transactions', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        localStorage.removeItem('authHeader');
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to save transaction');
      }

      const updatedTransaction = await response.json();
      setTransactions(transactions.map(tx => 
        tx.id === updatedTransaction.id ? updatedTransaction : tx
      ));
      closeSlideout();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError(error.message);
    }
  };

  const sortedTransactions = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return [];
    }

    return [...transactions].sort((a, b) => {
      if (sortConfig.key === 'amount') {
        const aAmount = Number(a.credit || 0) - Number(a.debit || 0);
        const bAmount = Number(b.credit || 0) - Number(b.debit || 0);
        return sortConfig.direction === 'asc' ? aAmount - bAmount : bAmount - aAmount;
      } else {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
    });
  }, [transactions, sortConfig]);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            className="underline ml-2"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={addNewTransaction}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Transaction
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500">No transactions found</p>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => requestSort('date')}
              >
                Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => requestSort('description')}
              >
                Description {sortConfig.key === 'description' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => requestSort('category')}
              >
                Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => requestSort('department')}
              >
                Department {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => requestSort('amount')}
              >
                Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((transaction) => (
              <tr 
                key={transaction.id} 
                onClick={() => openSlideout(transaction)}
                className="border-t hover:bg-gray-50 cursor-pointer transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {transaction.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {transaction.department}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                  transaction.credit > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${Math.abs(Number(transaction.credit) || Number(transaction.debit)).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Slideout */}
      {isSlideoutOpen && selectedTransaction && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeSlideout} />
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="relative w-screen max-w-md">
                <div className="h-full flex flex-col bg-white shadow-xl">
                  {/* Header */}
                  <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-medium">Edit Transaction</h3>
                    <button 
                      onClick={closeSlideout}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="p-6 flex-1 overflow-y-auto">
                    <form className="space-y-4">
                      {/* Transaction Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTransaction({
                                ...selectedTransaction,
                                type: 'expense'
                              });
                            }}
                            className={`px-4 py-2 rounded-l-md border ${
                              selectedTransaction.type === 'expense'
                                ? 'bg-red-100 text-red-800 border-red-300' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Expense
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTransaction({
                                ...selectedTransaction,
                                type: 'income'
                              });
                            }}
                            className={`px-4 py-2 rounded-r-md border ${
                              selectedTransaction.type === 'income'
                                ? 'bg-green-100 text-green-800 border-green-300' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Income
                          </button>
                        </div>
                      </div>

                      {/* Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                          type="date"
                          name="date"
                          value={selectedTransaction.date}
                          onChange={handleInputChange}
                          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                            ${formErrors.date ? 'border-red-300' : 'border-gray-300'}`}
                        />
                        {formErrors.date && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input
                          type="text"
                          name="description"
                          value={selectedTransaction.description}
                          onChange={handleInputChange}
                          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                            ${formErrors.description ? 'border-red-300' : 'border-gray-300'}`}
                        />
                        {formErrors.description && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                        )}
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <input
                          type="text"
                          name="category"
                          value={selectedTransaction.category}
                          onChange={handleInputChange}
                          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                            ${formErrors.category ? 'border-red-300' : 'border-gray-300'}`}
                        />
                        {formErrors.category && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
                        )}
                      </div>

                      {/* Department */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Department</label>
                        <input
                          type="text"
                          name="department"
                          value={selectedTransaction.department}
                          onChange={handleInputChange}
                          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                            ${formErrors.department ? 'border-red-300' : 'border-gray-300'}`}
                        />
                        {formErrors.department && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.department}</p>
                        )}
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        {selectedTransaction.type === 'income' ? (
                          <input
                            type="number"
                            name="credit"
                            value={selectedTransaction.credit}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                              ${formErrors.amount ? 'border-red-300' : 'border-gray-300'}`}
                          />
                        ) : (
                          <input
                            type="number"
                            name="debit"
                            value={selectedTransaction.debit}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
                              ${formErrors.amount ? 'border-red-300' : 'border-gray-300'}`}
                          />
                        )}
                        {formErrors.amount && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t flex justify-end">
                    <button
                      onClick={closeSlideout}
                      className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveTransaction}
                      className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;