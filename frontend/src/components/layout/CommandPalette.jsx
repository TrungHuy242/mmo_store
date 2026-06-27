import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore, useAuthStore } from '../../store';
import { searchProducts } from '../../api/product.api';

const NAVIGATION_ITEMS = [
  { id: 'nav-home', label: 'Trang chủ', icon: '🏠', path: '/', group: 'Điều hướng nhanh' },
  { id: 'nav-products', label: 'Cửa hàng', icon: '🛍️', path: '/products', group: 'Điều hướng nhanh' },
  { id: 'nav-dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard', group: 'Điều hướng nhanh', requireAuth: true },
  { id: 'nav-licenses', label: 'Licenses', icon: '🔑', path: '/licenses', group: 'Điều hướng nhanh', requireAuth: true },
  { id: 'nav-support', label: 'Hỗ trợ', icon: '🎫', path: '/support', group: 'Điều hướng nhanh' },
  { id: 'nav-wishlist', label: 'Yêu thích', icon: '❤️', path: '/wishlist', group: 'Điều hướng nhanh' },
  { id: 'nav-cart', label: 'Giỏ hàng', icon: '🛒', path: '/cart', group: 'Điều hướng nhanh' },
  { id: 'nav-profile', label: 'Hồ sơ', icon: '👤', path: '/profile', group: 'Điều hướng nhanh', requireAuth: true },
];

const ACTION_ITEMS = [
  { id: 'action-theme', label: 'Đổi giao diện (Dark/Light)', icon: '🎨', action: 'toggleTheme', group: 'Hành động' },
  { id: 'action-logout', label: 'Đăng xuất', icon: '🚪', action: 'logout', group: 'Hành động', requireAuth: true },
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen, toggleTheme } = useUIStore();
  const { isAuthenticated, logout } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Filter base on query
  const getBaseItems = useCallback(() => {
    const filteredNav = NAVIGATION_ITEMS.filter(item => {
      if (item.requireAuth && !isAuthenticated) return false;
      return item.label.toLowerCase().includes(query.toLowerCase());
    });

    const filteredActions = ACTION_ITEMS.filter(item => {
      if (item.requireAuth && !isAuthenticated) return false;
      return item.label.toLowerCase().includes(query.toLowerCase());
    });

    return { nav: filteredNav, actions: filteredActions };
  }, [query, isAuthenticated]);

  // Search products with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchProducts(query);
        const products = response?.data?.products || response?.data || [];
        setResults(products.slice(0, 5).map(p => ({
          id: `product-${p.id}`,
          label: p.name,
          icon: '📦',
          path: `/products/${p.id}`,
          group: 'Tìm kiếm sản phẩm',
          price: p.price,
        })));
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Get all flattened items for keyboard navigation
  const getAllItems = useCallback(() => {
    const { nav, actions } = getBaseItems();
    const allItems = [];
    const groups = {};

    if (nav.length > 0) {
      groups['Điều hướng nhanh'] = nav;
    }
    if (results.length > 0) {
      groups['Tìm kiếm sản phẩm'] = results;
    }
    if (actions.length > 0) {
      groups['Hành động'] = actions;
    }

    Object.values(groups).forEach(group => {
      allItems.push(...group);
    });

    return allItems;
  }, [getBaseItems, results]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [commandPaletteOpen]);

  // Handle item selection
  const handleSelect = (item) => {
    if (item.action) {
      if (item.action === 'toggleTheme') {
        toggleTheme();
      } else if (item.action === 'logout') {
        logout();
        navigate('/');
      }
    } else if (item.path) {
      navigate(item.path);
    }
    setCommandPaletteOpen(false);
  };

  // Keyboard navigation
  const handleKeyNav = (e) => {
    const allItems = getAllItems();
    if (allItems.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (allItems[selectedIndex]) {
          handleSelect(allItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setCommandPaletteOpen(false);
        break;
    }
  };

  // Group items by category
  const { nav, actions } = getBaseItems();
  const groups = [];

  if (nav.length > 0) groups.push({ title: 'Điều hướng nhanh', items: nav });
  if (results.length > 0) groups.push({ title: 'Tìm kiếm sản phẩm', items: results });
  if (actions.length > 0) groups.push({ title: 'Hành động', items: actions });

  // Calculate selected global index
  let globalIndex = 0;

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />

          {/* Palette Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-4 top-[15%] mx-auto max-w-2xl z-50"
          >
            <div className="bg-[#12121A] border border-[#2A2A3A] rounded-2xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-[#2A2A3A]">
                <svg className="w-5 h-5 text-[#A1A1AA] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyNav}
                  placeholder="Tìm kiếm..."
                  className="flex-1 bg-transparent text-white placeholder-[#71717A] outline-none text-base"
                />
                {loading && (
                  <div className="w-4 h-4 border-2 border-[#22d3ee] border-t-transparent rounded-full animate-spin" />
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-[#71717A] bg-[#1A1A25] rounded-lg border border-[#2A2A3A]">
                  <span>ESC</span>
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto">
                {groups.length === 0 && query && !loading ? (
                  <div className="px-4 py-8 text-center text-[#71717A]">
                    Không tìm thấy kết quả
                  </div>
                ) : (
                  groups.map((group, groupIndex) => (
                    <div key={group.title} className="py-2">
                      <div className="px-4 py-1.5 text-xs font-semibold text-[#71717A] uppercase tracking-wider">
                        {group.title}
                      </div>
                      {group.items.map((item) => {
                        const isSelected = globalIndex === selectedIndex;
                        const itemIndex = globalIndex;
                        globalIndex++;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className={`
                              w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                              ${isSelected
                                ? 'bg-[#22d3ee]/10 border-l-2 border-[#22d3ee]'
                                : 'hover:bg-[#1A1A25] border-l-2 border-transparent'
                              }
                            `}
                            onMouseEnter={() => setSelectedIndex(itemIndex)}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate">{item.label}</div>
                              {item.price && (
                                <div className="text-xs text-[#22d3ee]">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <span className="text-xs text-[#71717A] hidden sm:inline">
                                ⏎ enter
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="flex items-center gap-4 px-4 py-3 border-t border-[#2A2A3A] text-xs text-[#52525B]">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-[#1A1A25] rounded border border-[#2A2A3A]">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-[#1A1A25] rounded border border-[#2A2A3A]">↓</kbd>
                  <span className="ml-1">điều hướng</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-[#1A1A25] rounded border border-[#2A2A3A]">⏎</kbd>
                  <span className="ml-1">chọn</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-[#1A1A25] rounded border border-[#2A2A3A]">esc</kbd>
                  <span className="ml-1">đóng</span>
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
