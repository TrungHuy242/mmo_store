import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT', 'FINANCE'];

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center py-20 text-gray-400">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (adminOnly && !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}
