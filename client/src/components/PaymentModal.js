import React, { useState } from 'react';
import { X } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, onSubmit, initialDetails, invoice }) => {
  const [paymentDetails, setPaymentDetails] = useState({
    ...initialDetails,
    department: invoice.department || 'sales',
    category: 'invoice_payment',
    type: 'revenue',
    description: `Payment for Invoice #${invoice.id.slice(0, 8)}`,
    reference: invoice.id,
    client_name: invoice.clientName,
    payment_method: initialDetails.paymentMethod || 'bank_transfer',
    status: 'completed',
    notes: initialDetails.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(paymentDetails);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto z-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <form className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                <input
                  type="date"
                  value={paymentDetails.date}
                  onChange={(e) => setPaymentDetails({...paymentDetails, date: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  value={paymentDetails.paymentMethod}
                  onChange={(e) => setPaymentDetails({...paymentDetails, paymentMethod: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={paymentDetails.notes}
                  onChange={(e) => setPaymentDetails({...paymentDetails, notes: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  value={paymentDetails.department}
                  onChange={(e) => setPaymentDetails({...paymentDetails, department: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="sales">Sales</option>
                  <option value="marketing">Marketing</option>
                  <option value="engineering">Engineering</option>
                  <option value="support">Support</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                <input
                  type="text"
                  value={paymentDetails.external_reference || ''}
                  onChange={(e) => setPaymentDetails({...paymentDetails, external_reference: e.target.value})}
                  placeholder="Check number, transaction ID, etc."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                <select
                  value={paymentDetails.status}
                  onChange={(e) => setPaymentDetails({...paymentDetails, status: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </form>
          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Record Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 