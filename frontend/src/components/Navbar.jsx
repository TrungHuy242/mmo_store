import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar({ onCartClick, cartCount }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="sticky top-0 z-50 glass mx-3 mt-3 px-4 sm:px-6 py-3"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold hidden sm:block">
            <span className="text-neon-cyan group-hover:neon-text-cyan transition">MMO</span>
            <span className="text-neon-magenta group-hover:neon-text-magenta transition">Store</span>
          </span>
        </Link>

        {/* Desktop Navigation - Centered */}
        <div className="hidden lg:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
          <NavLink to="/" icon="home">Trang chủ</NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" icon="user">Tài khoản</NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin" icon="shield" highlight>Quản trị</NavLink>
              )}
            </>
          )}
        </div>

        {/* Desktop Auth + Cart */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Cart button */}
          <button 
            onClick={onCartClick}
            className="relative p-2 rounded-xl hover:bg-white/10 transition"
          >
            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon-magenta text-white text-xs rounded-full flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="glass px-4 py-2 flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Xin chào</p>
                  <p className="text-sm font-semibold">{user.name || user.email?.split('@')[0]}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center text-white font-bold">
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
              </div>
              <button onClick={handleLogout} className="btn-outline py-2">
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="btn-outline py-2">Đăng nhập</Link>
              <Link to="/register" className="btn-neon py-2">Đăng ký</Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden mt-4 pt-4 border-t border-white/10"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-2">
                <button 
                  onClick={() => { onCartClick?.(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Giỏ hàng {cartCount > 0 && `(${cartCount})`}
                </button>
              </div>
              <MobileNavLink to="/" onClick={() => setMobileMenuOpen(false)}>Trang chủ</MobileNavLink>
              {user && (
                <>
                  <MobileNavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Tài khoản</MobileNavLink>
                  {user.role === 'admin' && (
                    <MobileNavLink to="/admin" onClick={() => setMobileMenuOpen(false)} highlight>Quản trị</MobileNavLink>
                  )}
                  <button onClick={handleLogout} className="btn-magenta w-full mt-2">Đăng xuất</button>
                </>
              )}
              {!user && (
                <div className="flex flex-col gap-2 mt-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-outline w-full text-center">Đăng nhập</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-neon w-full text-center">Đăng ký</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function NavLink({ to, icon, children, highlight }) {
  const icons = {
    home: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    user: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    shield: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  };

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        highlight 
          ? 'text-neon-gold hover:bg-neon-gold/10' 
          : 'text-gray-300 hover:text-white hover:bg-white/5'
      }`}
    >
      {icons[icon]}
      {children}
    </Link>
  );
}

function MobileNavLink({ to, onClick, children, highlight }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        highlight 
          ? 'text-neon-gold bg-neon-gold/10' 
          : 'text-gray-300 hover:bg-white/5'
      }`}
    >
      {children}
    </Link>
  );
}
