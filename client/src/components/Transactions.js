import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isSlideoutOpen, setIsSlideoutOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(100);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch(
        `/api/transactions?page=${currentPage}&pageSize=${pageSize}&sortKey=${sortConfig.key}&sortDir=${sortConfig.direction}`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        }
      );
      const data = await response.json();
      setTransactions(data.transactions);
      setTotalPages(data.totalPages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, sortConfig]);

  // Transaction handlers
  const handleNewTransaction = () => {
    setSelectedTransaction({
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: '',
      department: '',
      amount: '',
      type: 'expense'
    });
    setIsSlideoutOpen(true);
  };

  const handleTransactionClick = (transaction) => {
    const type = transaction.debit ? 'expense' : 'income';
    const amount = transaction.debit || transaction.credit || '';
    
    setSelectedTransaction({
      ...transaction,
      type,
      amount: amount.toString()
    });
    setIsSlideoutOpen(true);
  };

  const validateTransaction = (transaction) => {
    const errors = {};
    
    if (!transaction.date) errors.date = 'Date is required';
    if (!transaction.description?.trim()) errors.description = 'Description is required';
    if (!transaction.category?.trim()) errors.category = 'Category is required';
    if (!transaction.department?.trim()) errors.department = 'Department is required';
    
    const amount = parseFloat(transaction.amount);
    if (!amount || isNaN(amount) || amount <= 0) {
      errors.amount = 'Amount must be a number greater than 0';
    }

    return errors;
  };

  const handleSaveTransaction = async () => {
    const errors = validateTransaction(selectedTransaction);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const amount = parseFloat(selectedTransaction.amount);
    const transactionToSave = {
      ...selectedTransaction,
      credit: selectedTransaction.type === 'income' ? amount : null,
      debit: selectedTransaction.type === 'expense' ? amount : null,
    };

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
        body: JSON.stringify(transactionToSave),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isNewTransaction ? 'create' : 'update'} transaction`);
      }

      setIsSlideoutOpen(false);
      await fetchTransactions();
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
        <button
          onClick={handleNewTransaction}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Transaction
        </button>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('date')}
              >
                Date
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('description')}
              >
                Description
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('category')}
              >
                Category
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('department')}
              >
                Department
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('amount')}
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr 
                key={transaction.id}
                onClick={() => handleTransactionClick(transaction)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${transaction.credit 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {transaction.credit ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {transaction.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.department}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                  transaction.credit ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${(transaction.credit || transaction.debit || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slideout Panel */}
      {isSlideoutOpen && (
        <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 50 }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="relative w-screen max-w-md">
                <div className="h-full flex flex-col bg-white shadow-xl">
                  {/* Header */}
                  <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-medium">Edit Transaction</h3>
                    <button 
                      onClick={() => setIsSlideoutOpen(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
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
                            className={`px-4 py-2 rounded-r-md border-t border-r border-b -ml-px ${
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
                          value={selectedTransaction.date}
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

                      {/* Description */}
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

                      {/* Category */}
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

                      {/* Department */}
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

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                          type="text"
                          value={selectedTransaction.amount}
                          onChange={(e) => {
                            setSelectedTransaction({
                              ...selectedTransaction,
                              amount: e.target.value
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

                  {/* Footer */}
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-center space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          <ChevronLeft size={20} />
        </button>
        
        <span className="px-4 py-1 text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-md ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Transactions;