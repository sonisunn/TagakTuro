import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route so it can only be accessed by users with the specified role.
 * requiredRole: 'ROLE_ADMIN' | 'ROLE_CCED'
 */
export default function RoleRoute({ children, requiredRole }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (role !== requiredRole) {
    // Send each role to their own home
    return <Navigate to={role === 'ROLE_CCED' ? '/cced/dashboard' : '/dashboard'} replace />;
  }
  return children;
}
