import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import InvoiceSlideout from './InvoiceSlideout';

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSlideoutOpen, setIsSlideoutOpen] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'desc' });

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  const addNewInvoice = () => {
    const newInvoice = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      clientName: '',
      amount: 0,
      status: 'draft',
      dueDate: '',
      items: []
    };
    setSelectedInvoice(newInvoice);
    setIsSlideoutOpen(true);
  };

  // Fetch invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const credentials = localStorage.getItem('credentials');
        if (!credentials) {
          navigate('/login');
          return;
        }

        const response = await fetch('https://finance-dashboard-tfn6.onrender.com/api/invoices', {
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

        const data = await response.json();
        const formattedInvoices = data.invoices.map(invoice => ({
          id: invoice.id,
          clientName: invoice.client_name || invoice.clientName,
          dueDate: invoice.due_date || invoice.dueDate,
          amount: invoice.amount || 0,
          status: invoice.status || 'draft',
          items: invoice.items || []
        }));
        
        setInvoices(formattedInvoices);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setError('Failed to load invoices');
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [navigate]);

  // Save invoice (create or update)
  const handleSaveInvoice = async (formData) => {
    try {
      const credentials = localStorage.getItem('credentials');
      const isNewInvoice = !formData.id || typeof formData.id === 'number';
      const url = `https://finance-dashboard-tfn6.onrender.com/api/invoices${isNewInvoice ? '' : `/${formData.id}`}`;
      
      const totalAmount = formData.items.reduce((sum, item) => 
        sum + (Number(item.quantity) * Number(item.rate)), 0
      );

      const payload = {
        clientName: formData.clientName,
        amount: totalAmount,
        dueDate: formData.dueDate,
        status: formData.status || 'draft',
        items: formData.items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          amount: Number(item.quantity) * Number(item.rate)
        }))
      };

      console.log('Saving invoice:', {
        url,
        method: isNewInvoice ? 'POST' : 'PUT',
        data: payload
      });

      const response = await fetch(url, {
        method: isNewInvoice ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to save invoice');
      }

      const savedInvoice = await response.json();
      
      setInvoices(prevInvoices => {
        if (isNewInvoice) {
          return [...prevInvoices, savedInvoice];
        }
        return prevInvoices.map(inv => 
          inv.id === savedInvoice.id ? savedInvoice : inv
        );
      });

      setIsSlideoutOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error saving invoice:', error);
      setError(error.message);
      throw error;
    }
  };

  // Update invoice status
  const handleStatusUpdate = async (invoiceId, newStatus) => {
    try {
      const credentials = localStorage.getItem('credentials');
      
      console.log('Updating status:', { invoiceId, newStatus });

      const response = await fetch(`https://finance-dashboard-tfn6.onrender.com/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus,
          id: invoiceId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      const updatedInvoice = await response.json();
      
      setInvoices(prevInvoices =>
        prevInvoices.map(inv =>
          inv.id === invoiceId ? { ...inv, status: newStatus } : inv
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update invoice status');
    }
  };

  // Quick actions menu
  const renderActionMenu = (invoice) => (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <select
        value={invoice.status}
        onChange={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleStatusUpdate(invoice.id, e.target.value);
        }}
        className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
      >
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  );

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedInvoices = useMemo(() => {
    const sorted = [...invoices];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (sortConfig.key === 'amount') {
          return sortConfig.direction === 'asc' 
            ? a.amount - b.amount 
            : b.amount - a.amount;
        }
        if (sortConfig.key === 'dueDate') {
          return sortConfig.direction === 'asc'
            ? new Date(a.dueDate) - new Date(b.dueDate)
            : new Date(b.dueDate) - new Date(a.dueDate);
        }
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sorted;
  }, [invoices, sortConfig]);

  if (isLoading) {
    return <div className="p-6 text-center">Loading invoices...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={addNewInvoice}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {[
                { label: 'Invoice #', key: 'id' },
                { label: 'Client', key: 'clientName' },
                { label: 'Due Date', key: 'dueDate' },
                { label: 'Amount', key: 'amount' },
                { label: 'Status', key: 'status' },
                { label: 'Actions', key: 'actions' }
              ].map((header) => (
                <th
                  key={header.key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => header.key !== 'actions' && requestSort(header.key)}
                >
                  {header.label}
                  {sortConfig?.key === header.key && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedInvoices.map((invoice) => (
              <tr
                key={invoice.id}
                onClick={() => {
                  setSelectedInvoice(invoice);
                  setIsSlideoutOpen(true);
                }}
                className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  #{typeof invoice.id === 'string' ? invoice.id.slice(0, 8) : invoice.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {invoice.client_name || invoice.clientName || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {invoice.due_date || invoice.dueDate ? 
                    new Date(invoice.due_date || invoice.dueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) 
                    : 'N/A'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${(invoice.amount || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[invoice.status]}`}>
                    {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={e => e.stopPropagation()}>
                  {renderActionMenu(invoice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isSlideoutOpen && (
        <InvoiceSlideout
          invoice={selectedInvoice}
          onClose={() => {
            setIsSlideoutOpen(false);
            setSelectedInvoice(null);
          }}
          onSave={handleSaveInvoice}
        />
      )}
    </div>
  );
};

export default Invoices; 