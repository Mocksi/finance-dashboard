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
      // Validate form data
      if (!formData.clientName?.trim()) {
        throw new Error('Client name is required');
      }
      if (!formData.dueDate) {
        throw new Error('Due date is required');
      }
      if (!formData.items?.length) {
        throw new Error('At least one item is required');
      }
      
      // Validate items
      formData.items.forEach((item, index) => {
        if (!item.description?.trim()) {
          throw new Error(`Description is required for item ${index + 1}`);
        }
        if (!item.quantity || item.quantity < 1) {
          throw new Error(`Valid quantity is required for item ${index + 1}`);
        }
        if (!item.rate || item.rate < 0) {
          throw new Error(`Valid rate is required for item ${index + 1}`);
        }
      });

      // Calculate amounts for each item
      const itemsWithAmounts = formData.items.map(item => ({
        ...item,
        amount: Number(item.quantity) * Number(item.rate)
      }));

      const submitData = {
        ...formData,
        items: itemsWithAmounts,
        status: formData.status || 'draft'
      };

      console.log('Submitting invoice:', submitData);
      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Error in form submission:', error);
      // Add error state and display to user
      setError(error.message);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="relative w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              {/* Header */}
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium">{invoice?.id ? 'Edit Invoice' : 'New Invoice'}</h3>
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Client Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Client Name</label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Line Items */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Items</h3>
                    
                    {/* Column Headers */}
                    <div className="grid grid-cols-12 gap-4 mb-2">
                      <div className="col-span-5">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Rate ($)</label>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                      </div>
                    </div>

                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={item.amount}
                            className="block w-full rounded-md border-gray-300 bg-gray-50"
                            readOnly
                          />
                        </div>
                        <div className="col-span-1 text-center">
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
                </form>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
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
  );
};

export default InvoiceSlideout; 