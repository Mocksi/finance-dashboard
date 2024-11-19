import React from 'react';
import Navigation from './Navigation';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('credentials');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation onLogout={handleLogout} />
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
};

export default Layout; 