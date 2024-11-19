import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import Login from './components/Login';
import CompanyRoutes from './components/CompanyRoutes';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* Base routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          
          {/* Company-specific routes */}
          <Route path="/:domain/*" element={<CompanyRoutes />} />
          
          {/* Catch all other routes */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;