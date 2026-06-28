import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Must match backend/src/modules/auth/constants.js → AdminRoles exactly.
// SUPER_ADMIN is intentionally omitted — a SUPER_ADMIN can never be a "normal user"
// so there's no valid UX reason to redirect them away from admin routes.
const ADMIN_ROLES = ['MANAGER', 'SUPPORT', 'FINANCE', 'INVENTORY_STAFF', 'MARKETING'];

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center py-20 text-gray-400">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (adminOnly && !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}
