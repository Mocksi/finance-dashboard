import React, { useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { Save } from 'lucide-react';

const Settings = () => {
  const { user, fetchUserProfile } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [companyForm, setCompanyForm] = useState({
    name: user?.company_name || '',
    domain: user?.company_domain || '',
    logo_url: user?.company_logo || ''
  });
  const [userForm, setUserForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    role: user?.role || '',
    avatar_url: user?.avatar_url || ''
  });

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/account/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${localStorage.getItem('credentials')}`
        },
        body: JSON.stringify(companyForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Company settings updated successfully' });
        fetchUserProfile(); // Refresh user data
      } else {
        throw new Error('Failed to update company settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${localStorage.getItem('credentials')}`
        },
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        fetchUserProfile(); // Refresh user data
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      </div>

      {message.text && (
        <div className={`mb-4 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Company Settings */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Company Settings</h2>
          <form onSubmit={handleCompanySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Domain</label>
              <input
                type="text"
                value={companyForm.domain}
                onChange={(e) => setCompanyForm({...companyForm, domain: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Logo URL</label>
              <input
                type="text"
                value={companyForm.logo_url}
                onChange={(e) => setCompanyForm({...companyForm, logo_url: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Company Settings
            </button>
          </form>
        </div>
      </div>

      {/* User Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Settings</h2>
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={userForm.first_name}
                  onChange={(e) => setUserForm({...userForm, first_name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={userForm.last_name}
                  onChange={(e) => setUserForm({...userForm, last_name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Role</option>
                <option value="Admin">Admin</option>
                <option value="Finance Manager">Finance Manager</option>
                <option value="Accountant">Accountant</option>
                <option value="Analyst">Analyst</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Profile Photo URL</label>
              <input
                type="text"
                value={userForm.avatar_url}
                onChange={(e) => setUserForm({...userForm, avatar_url: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Personal Settings
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings; 