import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext);
  const credentials = localStorage.getItem('credentials');

  // Show nothing while checking authentication
  if (loading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!credentials) {
    return <Navigate to="/login" replace />;
  }

  // Wait for user data to load
  if (!user) {
    return null;
  }

  // Render the protected content
  return children;
};

export default ProtectedRoute; 