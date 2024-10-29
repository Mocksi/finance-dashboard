import React, { useState } from 'react';
import { ChartJS } from 'chart.js/auto';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleLogin = async (email, password) => {
    try {
      // Store credentials for future API calls
      const credentials = btoa(`${email}:${password}`);
      localStorage.setItem('credentials', credentials);
      
      // Test credentials with API
      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setAuthError('');
      } else {
        setAuthError('Invalid credentials');
      }
    } catch (error) {
      setAuthError('Server error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} error={authError} />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

export default App;