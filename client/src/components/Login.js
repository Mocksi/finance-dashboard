import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, fetchUserProfile } = useContext(UserContext);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const VALID_EMAIL = 'sarah.chen@techflow.io';
  const VALID_PASSWORD = 'testpass123';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoggingIn) return; // Prevent multiple submissions
    setIsLoggingIn(true);
    
    if (credentials.email === VALID_EMAIL && credentials.password === VALID_PASSWORD) {
      const base64Credentials = btoa(VALID_EMAIL + ':' + VALID_PASSWORD);
      const authHeader = `Basic ${base64Credentials}`;
      
      try {
        localStorage.setItem('authHeader', authHeader);
        const userData = await fetchUserProfile();
        if (userData) {
          // Use replace instead of push to prevent back button issues
          navigate('/techflow.io', { replace: true });
        }
      } catch (error) {
        console.error('Login error:', error);
        setError('Failed to login. Please try again.');
        localStorage.removeItem('authHeader');
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      setError('Invalid credentials. Try sarah.chen@techflow.io / testpass123');
      setIsLoggingIn(false);
    }
  };

  // Single redirect check on mount or when user changes
  useEffect(() => {
    if (user && location.pathname === '/login') {
      navigate('/techflow.io', { replace: true });
    }
  }, [user, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // If already logged in, show loading state
  if (user) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use sarah.chen@techflow.io / testpass123
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={credentials.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={credentials.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoggingIn ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isLoggingIn ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;