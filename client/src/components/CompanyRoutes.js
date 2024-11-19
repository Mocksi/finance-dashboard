import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import Layout from './Layout';
import Dashboard from './Dashboard';
import Transactions from './Transactions';
import Invoices from './Invoices';
import Reports from './Reports';
import Settings from './Settings';
import ProtectedRoute from './ProtectedRoute';

const CompanyRoutes = () => {
  const { domain } = useParams();
  const { user } = useContext(UserContext);

  // Verify the domain matches the logged-in user's company
  if (user && user.company_domain !== domain) {
    return <Navigate to={`/${user.company_domain}`} replace />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="transactions"
        element={
          <ProtectedRoute>
            <Layout>
              <Transactions />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="invoices"
        element={
          <ProtectedRoute>
            <Layout>
              <Invoices />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="reports"
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default CompanyRoutes; 