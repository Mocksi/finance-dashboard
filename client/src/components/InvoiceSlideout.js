import React, { useState, useEffect } from 'react';
import { X, Plus, Trash } from 'lucide-react';

const InvoiceSlideout = ({ invoice, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: null,
    clientName: '',
    dueDate: '',
    status: 'draft',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        id: invoice.id,
        clientName: invoice.clientName || '',
        dueDate: invoice.dueDate || '',
        status: invoice.status || 'draft',
        items: invoice.items?.length > 0 ? invoice.items : [{ description: '', quantity: 1, rate: 0, amount: 0 }]
      });
    }
  }, [invoice]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate amount if quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = Number(newItems[index].quantity) * Number(newItems[index].rate);
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + Number(item.amount), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (calculateTotal() <= 0) {
        throw new Error('Invoice total must be greater than 0');
      }
      await onSave({
        ...formData,
        amount: calculateTotal()
      });
      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
      // You might want to add state for error handling
      // setError(error.message);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-md">
            <form className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl" onSubmit={handleSubmit}>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-scroll">
                <div className="bg-blue-700 px-4 py-6 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-white">
                      {formData.id ? 'Edit Invoice' : 'New Invoice'}
                    </h2>
                    <div className="ml-3 flex h-7 items-center">
                      <button type="button" onClick={onClose}>
                        <X className="h-6 w-6 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 divide-y divide-gray-200 overflow-y-auto">
                  <div className="space-y-6 p-6">
                    {/* Client Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client Name</label>
                      <input
                        type="text"
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Items */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">Items</label>
                      {formData.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 mb-4">
                          <div className="col-span-5">
                            <input
                              type="text"
                              placeholder="Description"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                              required
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                              required
                              min="1"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              placeholder="Rate"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                              required
                              min="0"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              value={item.amount}
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm bg-gray-50"
                              readOnly
                            />
                          </div>
                          <div className="col-span-1">
                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-shrink-0 justify-end px-4 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ml-4 inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSlideout; 