import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass px-4 sm:px-6 py-3 flex items-center justify-between m-3"
    >
      <Link to="/" className="text-xl font-bold">
        <span className="text-neon-cyan">MMO</span>
        <span className="text-neon-magenta">Store</span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-4 text-sm">
        <Link to="/" className="hover:text-neon-cyan transition">San pham</Link>
        {user && <Link to="/dashboard" className="hover:text-neon-cyan transition">Tai khoan</Link>}
        {user?.role === 'admin' && <Link to="/admin" className="hover:text-neon-gold transition">Admin</Link>}
        {user ? (
          <button onClick={() => { logout(); navigate('/'); }} className="btn-magenta py-1.5">Thoat</button>
        ) : (
          <>
            <Link to="/login" className="hover:text-neon-cyan transition">Dang nhap</Link>
            <Link to="/register" className="btn-neon py-1.5">Dang ky</Link>
          </>
        )}
      </div>
    </motion.nav>
  );
}
