import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import InvoiceSlideout from './InvoiceSlideout';
import PaymentModal from './PaymentModal';
import { UserContext } from '../contexts/UserContext';

const Invoices = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSlideoutOpen, setIsSlideoutOpen] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'desc' });
  const [paymentModal, setPaymentModal] = useState({ open: false, invoiceId: null, paymentDetails: null });

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
        const authHeader = localStorage.getItem('authHeader');
        if (!authHeader) {
          navigate('/login', { replace: true });
          return;
        }

        const response = await fetch('https://finance-dashboard-tfn6.onrender.com/api/invoices', {
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
        const formattedInvoices = data.invoices.map(invoice => ({
          id: invoice.id,
          clientName: invoice.client_name || invoice.clientName,
          dueDate: invoice.due_date || invoice.dueDate,
          amount: invoice.amount || 0,
          status: invoice.status || 'draft',
          items: invoice.items || []
        }));
        
        setInvoices(formattedInvoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setError('Failed to load invoices');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchInvoices();
    }
  }, [navigate, user]);

  // Save invoice (create or update)
  const handleSaveInvoice = async (formData) => {
    try {
      const authHeader = localStorage.getItem('authHeader');
      if (!authHeader) {
        navigate('/login', { replace: true });
        return;
      }

      const isNewInvoice = !formData.id || typeof formData.id === 'number';
      const url = `https://finance-dashboard-tfn6.onrender.com/api/invoices${isNewInvoice ? '' : `/${formData.id}`}`;
      
      const response = await fetch(url, {
        method: isNewInvoice ? 'POST' : 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to save invoice');
      }

      const savedInvoice = await response.json();
      setInvoices(prev => isNewInvoice ? [...prev, savedInvoice] : prev.map(inv => 
        inv.id === savedInvoice.id ? savedInvoice : inv
      ));
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
      const authHeader = localStorage.getItem('authHeader');
      if (!authHeader) {
        navigate('/login', { replace: true });
        return;
      }

      const response = await fetch(`https://finance-dashboard-tfn6.onrender.com/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setInvoices(prev =>
        prev.map(inv =>
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
    return (
      <div className="p-6 ml-64 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 ml-64">
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

  return (
    <div className="p-6">
      {/* Header section */}
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={addNewInvoice}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Table section */}
      {invoices.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500">No invoices found</p>
        </div>
      ) : (
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
                  {header.label} {sortConfig?.key === header.key && (
                    sortConfig.direction === 'asc' ? '↑' : '↓'
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedInvoices.map((invoice) => (
              <tr
                key={invoice.id}
                onClick={() => {
                  const formattedInvoice = {
                    ...invoice,
                    items: Array.isArray(invoice.items) ? invoice.items : JSON.parse(invoice.items || '[]'),
                    clientName: invoice.client_name || invoice.clientName,
                    dueDate: invoice.due_date || invoice.dueDate,
                    status: invoice.status || 'draft',
                    amount: Number(invoice.amount) || 0
                  };
                  setSelectedInvoice(formattedInvoice);
                  setIsSlideoutOpen(true);
                }}
                className="border-t hover:bg-gray-50 cursor-pointer transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  #{typeof invoice.id === 'string' ? invoice.id.slice(0, 8) : invoice.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {invoice.clientName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  ${Number(invoice.amount).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[invoice.status]}`}>
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
      )}

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

      {paymentModal.open && (
        <PaymentModal
          isOpen={paymentModal.open}
          onClose={() => setPaymentModal({ open: false, invoiceId: null, paymentDetails: null })}
          onSubmit={handlePaymentSubmit}
          initialDetails={paymentModal.paymentDetails}
        />
      )}
    </div>
  );
};

export default Invoices; 