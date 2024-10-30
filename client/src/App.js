import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for stored credentials on load
    const storedCredentials = localStorage.getItem('credentials');
    if (storedCredentials) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (email, password) => {
    try {
      // Create and store base64 credentials
      const credentials = btoa(`${email}:${password}`);
      
      // Test the credentials with a fetch request
      const response = await fetch('/api/dashboard-data', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // Store credentials only if the request was successful
        localStorage.setItem('credentials', credentials);
        setIsAuthenticated(true);
        setError('');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('credentials');
    setIsAuthenticated(false);
  };

  return (
    <div>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} error={error} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;