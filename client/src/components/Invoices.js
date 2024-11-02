import React, { useState, useEffect } from 'react';
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
        setInvoices(data.invoices);
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
      const isNewInvoice = !formData.id || formData.id === Date.now();
      const url = `https://finance-dashboard-tfn6.onrender.com/api/invoices${isNewInvoice ? '' : `/${formData.id}`}`;
      
      console.log('Saving invoice:', {
        url,
        method: isNewInvoice ? 'POST' : 'PUT',
        data: {
          clientName: formData.clientName,
          amount: formData.items.reduce((sum, item) => sum + Number(item.amount), 0),
          dueDate: formData.dueDate,
          status: formData.status,
          items: formData.items
        }
      });

      const response = await fetch(url, {
        method: isNewInvoice ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientName: formData.clientName,
          amount: formData.items.reduce((sum, item) => sum + Number(item.amount), 0),
          dueDate: formData.dueDate,
          status: formData.status,
          items: formData.items
        })
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
    }
  };

  // Update invoice status
  const handleStatusUpdate = async (invoiceId, newStatus) => {
    try {
      const credentials = localStorage.getItem('credentials');
      
      const response = await fetch(`https://finance-dashboard-tfn6.onrender.com/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedInvoice = await response.json();
      
      setInvoices(prevInvoices =>
        prevInvoices.map(inv =>
          inv.id === updatedInvoice.id ? updatedInvoice : inv
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update invoice status');
    }
  };

  // Quick actions menu
  const renderActionMenu = (invoice) => (
    <div className="relative">
      <select
        value={invoice.status}
        onChange={(e) => handleStatusUpdate(invoice.id, e.target.value)}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        <option value="draft">Draft</option>
        <option value="sent">Mark as Sent</option>
        <option value="paid">Mark as Paid</option>
        <option value="overdue">Mark as Overdue</option>
        <option value="cancelled">Cancel</option>
      </select>
    </div>
  );

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
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr 
                key={invoice.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedInvoice(invoice);
                  setIsSlideoutOpen(true);
                }}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  #{invoice.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {invoice.clientName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${invoice.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[invoice.status]}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
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

      {/* Add the slideout component */}
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