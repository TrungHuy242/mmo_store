import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_ROLES = ['SUPER_ADMIN', 'MANAGER', 'SUPPORT', 'FINANCE', 'INVENTORY_STAFF', 'MARKETING'];

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return null; // Let AuthContext finish verifying the session first

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
