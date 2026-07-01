import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCartStore } from '../../store';
import { useCartDrawer } from '../../context/CartContext';
import { Button } from '../ui';
import { productApi } from '../../api/product.api';
import api from '../../api/client.js';

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const items = useCartStore((s) => s.items);
  const { openCart } = useCartDrawer();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  // Announcement banner state
  const [announcement, setAnnouncement] = useState(null);
  const [bannerVisible, setBannerVisible] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Debounced search
  const performSearch = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await productApi.getAll({ q: query, limit: 5, status: 'ACTIVE' });
      const products = res.data?.data || res.data || [];
      setSearchResults(products);
      setShowSearchDropdown(products.length > 0);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  // Handle product click
  const handleProductClick = (product) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    if (product.slug) {
      navigate(`/product/${product.slug}`);
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Fetch announcement banner
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await api.get('/settings/announcement');
        const data = res.data?.data || res.data;
        if (data && data.enabled && data.content) {
          setAnnouncement(data);
          setBannerVisible(true);
        } else {
          setAnnouncement(null);
        }
      } catch (err) {
        // Silently fail - announcement is optional
        setAnnouncement(null);
      }
    };
    fetchAnnouncement();
  }, []);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lng', lng);
  };

  return (
    <>
      {/* Announcement Marquee Banner */}
      {announcement && bannerVisible && (
        <div className="bg-gradient-to-r from-neon-magenta via-neon-pink to-neon-magenta text-white text-sm py-2 overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-bg-primary to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-bg-primary to-transparent z-10" />
          <div
            className="marquee-container"
            style={{
              display: 'flex',
              animation: 'marquee 30s linear infinite',
            }}
          >
            <span className="px-8 whitespace-nowrap flex items-center gap-4">
              <span className="flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-semibold animate-pulse">NEW</span>
                {announcement.content}
              </span>
              <span className="text-white/30 mx-4">|</span>
              <span className="flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-semibold animate-pulse">NEW</span>
                {announcement.content}
              </span>
            </span>
          </div>
          {/* Close button */}
          <button
            onClick={() => setBannerVisible(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close announcement"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <header
        className={`
          fixed top-0 left-0 right-0 z-40 transition-all duration-300
          ${announcement && bannerVisible ? 'lg:top-10' : 'top-0'}
          ${scrolled ? 'bg-bg-primary/95 backdrop-blur-xl border-b border-border shadow-soft' : 'bg-transparent'}
        `}
      >
        <div className="container-lg">
          <nav className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-text-primary">MMO</span>
                <span className="text-xl font-bold text-primary">Store</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              <NavLink to="/">{t('common.home')}</NavLink>
              <NavLink to="/products">{t('common.products')}</NavLink>
              <NavLink to="/products?type=account">{t('common.accounts')}</NavLink>
              <NavLink to="/products?type=source_code">{t('common.source_code')}</NavLink>
              {user && (
                <>
                  <NavLink to="/wishlist">{t('common.wishlist')}</NavLink>
                  <NavLink to="/licenses">{t('common.licenses')}</NavLink>
                  <NavLink to="/locket-gold" className="flex items-center gap-1.5">
                    <span className="text-amber-400">★</span> Locket Gold
                  </NavLink>
                </>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Search with Autocomplete */}
              <div className="relative" ref={searchRef}>
                <div className="relative flex items-center">
                  <svg className="absolute left-3 w-4 h-4 text-text-tertiary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                    placeholder={t('common.search') + '...'}
                    className="w-48 lg:w-64 pl-10 pr-4 py-2 rounded-xl bg-bg-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary/50 transition-all"
                  />
                  {searchLoading && (
                    <div className="absolute right-3">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Search Autocomplete Dropdown */}
                <AnimatePresence>
                  {showSearchDropdown && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary/95 backdrop-blur-xl border border-border rounded-xl shadow-soft-xl overflow-hidden z-50"
                    >
                      <div className="p-2">
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-tertiary transition-colors text-left"
                          >
                            {product.thumbnail ? (
                              <img
                                src={product.thumbnail}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover bg-bg-tertiary"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-bg-tertiary flex items-center justify-center">
                                <svg className="w-6 h-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">{product.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm font-semibold text-neon-cyan">
                                  ${typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
                                </span>
                                {product.stock !== undefined && (
                                  <span className={`text-xs ${product.stock > 0 ? 'text-success' : 'text-danger'}`}>
                                    {product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="p-2 border-t border-border">
                        <button
                          onClick={() => {
                            setShowSearchDropdown(false);
                            if (searchQuery.trim()) {
                              navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
                            }
                          }}
                          className="w-full text-center text-sm text-primary hover:underline py-1"
                        >
                          Xem tất cả kết quả cho "{searchQuery}"
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Language Toggle */}
              <div className="flex items-center gap-1.5 border border-border rounded-lg p-1 bg-bg-secondary">
                <button
                  onClick={() => changeLanguage('vi')}
                  className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${i18n.language === 'vi' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  VI
                </button>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${i18n.language === 'en' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  EN
                </button>
              </div>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* User */}
              {user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center text-white font-semibold text-sm">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                    <svg className="w-4 h-4 text-text-tertiary hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-bg-secondary border border-border rounded-xl shadow-soft-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 border-b border-border mb-2">
                      <p className="text-sm font-medium text-text-primary truncate">{user.name || 'User'}</p>
                      <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                    </div>
                    <DropdownLink to="/dashboard" icon="home">{t('common.dashboard')}</DropdownLink>
                    <DropdownLink to="/licenses" icon="download">{t('common.licenses')}</DropdownLink>
                    <DropdownLink to="/locket-gold" icon="star" className="text-amber-400">Locket Gold</DropdownLink>
                    <DropdownLink to="/orders" icon="receipt">{t('common.myOrders')}</DropdownLink>
                    <DropdownLink to="/wishlist" icon="heart">{t('common.wishlist')}</DropdownLink>
                    <DropdownLink to="/support" icon="chat">{t('common.support')}</DropdownLink>
                    <DropdownLink to="/profile" icon="settings">{t('common.settings')}</DropdownLink>
                    {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') && (
                      <>
                        <div className="border-t border-border my-2" />
                        <DropdownLink to="/admin" icon="shield">{t('common.adminPanel')}</DropdownLink>
                      </>
                    )}
                    <div className="border-t border-border mt-2 pt-2">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t('common.logout')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">{t('common.signin')}</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">{t('common.getStarted')}</Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border bg-bg-primary"
            >
              <div className="container-lg py-4 space-y-1">
                <MobileNavLink to="/" icon="home">{t('common.home')}</MobileNavLink>
                <MobileNavLink to="/products" icon="grid">{t('common.products')}</MobileNavLink>
                <MobileNavLink to="/products?type=account" icon="user">{t('common.accounts')}</MobileNavLink>
                <MobileNavLink to="/products?type=source_code" icon="code">{t('common.source_code')}</MobileNavLink>
                {user && (
                  <>
                    <MobileNavLink to="/wishlist" icon="heart">{t('common.wishlist')}</MobileNavLink>
                    <MobileNavLink to="/licenses" icon="key">{t('common.licenses')}</MobileNavLink>
                    <MobileNavLink to="/locket-gold" icon="star" className="text-amber-400">Locket Gold</MobileNavLink>
                    <MobileNavLink to="/orders" icon="receipt">{t('common.myOrders')}</MobileNavLink>
                    <MobileNavLink to="/support" icon="chat">{t('common.support')}</MobileNavLink>
                    <MobileNavLink to="/dashboard" icon="user">{t('common.dashboard')}</MobileNavLink>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-colors
        ${isActive
          ? 'bg-bg-tertiary text-text-primary'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
        }
      `}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, icon, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  const icons = {
    home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    grid: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    code: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />,
    heart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
    key: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />,
    receipt: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    chat: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-1.069A9 9 0 0121 12z" />,
    settings: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
  };

  return (
    <Link
      to={to}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
        ${isActive
          ? 'bg-primary/10 text-primary'
          : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
        }
      `}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icons[icon]}
      </svg>
      {children}
    </Link>
  );
}

function DropdownLink({ to, icon, children }) {
  const icons = {
    home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    download: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
    receipt: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    heart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
    chat: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-1.069A9 9 0 0121 12z" />,
    settings: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
    shield: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  };

  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icons[icon]}
      </svg>
      {children}
    </Link>
  );
}
