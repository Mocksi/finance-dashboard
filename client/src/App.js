import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Invoices from './components/Invoices';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Navigation from './components/Navigation';

// Create a protected route wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('credentials') !== null;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Create a layout component that includes navigation
const Layout = ({ children }) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('credentials');
    navigate('/login');
  };

  return (
    <div className="flex">
      <Navigation onLogout={handleLogout} />
      <main className="flex-1 bg-gray-100 min-h-screen">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/:domain/*" element={<CompanyRoutes />} />
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;