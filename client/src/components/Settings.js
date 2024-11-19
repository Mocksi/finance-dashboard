import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../contexts/UserContext';
import { Save } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, fetchUserProfile } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  
  const [companyForm, setCompanyForm] = useState({
    name: '',
    domain: '',
    logo_url: ''
  });
  
  const [userForm, setUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    avatar_url: ''
  });

  // Initialize forms with user data when it loads
  useEffect(() => {
    if (user) {
      setUserForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role || '',
        avatar_url: user.avatar_url || ''
      });
      
      setCompanyForm({
        name: user.company_name || '',
        domain: user.company_domain || '',
        logo_url: user.company_logo || ''
      });
    }
  }, [user]);

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const authHeader = localStorage.getItem('authHeader');
      if (!authHeader) {
        navigate('/login', { replace: true });
        return;
      }

      const response = await fetch('https://finance-dashboard-tfn6.onrender.com/api/account/company', {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(companyForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update company');
      }

      const data = await response.json();
      setCompanyForm(data);
      setSuccess('Company settings updated successfully');
      await fetchUserProfile(); // Refresh the user data
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const authHeader = localStorage.getItem('authHeader');
      if (!authHeader) {
        navigate('/login', { replace: true });
        return;
      }

      const response = await fetch('https://finance-dashboard-tfn6.onrender.com/api/account/profile', {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const data = await response.json();
      setUserForm(data);
      setSuccess('Profile updated successfully');
      await fetchUserProfile(); // Refresh the user data
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 sm:p-6 ml-64">
        <div className="text-center">
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-md bg-red-50 text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-md bg-green-50 text-green-800">
            {success}
          </div>
        )}

        {/* Company Settings */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-4 sm:p-6">
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
              <ImageUpload
                currentImageUrl={companyForm.logo_url}
                onImageSelected={(url) => setCompanyForm({...companyForm, logo_url: url})}
                label="Company Logo"
                type="company-logo"
              />
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
          <div className="p-4 sm:p-6">
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
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-not-allowed"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Email address cannot be changed as it is used for authentication
                </p>
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
              <ImageUpload
                currentImageUrl={userForm.avatar_url}
                onImageSelected={(url) => setUserForm({...userForm, avatar_url: url})}
                label="Profile Photo"
                type="profile-photo"
              />
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
    </div>
  );
};

export default Settings; 