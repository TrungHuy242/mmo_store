import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingCart, Package, FolderTree, Users, 
  FileText, Key, Boxes, CreditCard, BarChart3, Ticket, 
  Megaphone, UserPlus, Tag, FileBarChart, Clock, Settings,
  Shield, ChevronLeft, ChevronRight, Search, Bell, Plus,
  Menu, X, LogOut, User, TrendingUp, Zap, Globe, Star
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/index.js';

const menuItems = [
  { id: 'dashboard', labelKey: 'admin.dashboard', icon: LayoutDashboard, path: '/admin' },
  { id: 'orders', labelKey: 'admin.orders', icon: ShoppingCart, path: '/admin/orders', badge: 12 },
  { id: 'products', labelKey: 'admin.products', icon: Package, path: '/admin/products' },
  { id: 'categories', labelKey: 'admin.categories', icon: FolderTree, path: '/admin/categories' },
  { id: 'customers', labelKey: 'admin.customers', icon: Users, path: '/admin/customers', badge: 3 },
  { id: 'transactions', labelKey: 'admin.transactions', icon: CreditCard, path: '/admin/transactions' },
  { id: 'revenue', labelKey: 'admin.revenue', icon: TrendingUp, path: '/admin/revenue' },
  { id: 'inventory', labelKey: 'admin.inventory', icon: Boxes, path: '/admin/inventory', warning: true },
  { id: 'licenses', labelKey: 'admin.licenseKeys', icon: Key, path: '/admin/licenses' },
  { id: 'assets', labelKey: 'admin.digitalAssets', icon: FileText, path: '/admin/assets' },
  { id: 'support', labelKey: 'admin.support', icon: Ticket, path: '/admin/support', badge: 5 },
  { id: 'reviews', labelKey: 'admin.reviews', icon: Star, path: '/admin/reviews' },
  { id: 'affiliates', labelKey: 'admin.affiliates', icon: UserPlus, path: '/admin/affiliates' },
  { id: 'coupons', labelKey: 'admin.coupons', icon: Tag, path: '/admin/coupons' },
  { id: 'reports', labelKey: 'admin.reports', icon: FileBarChart, path: '/admin/reports' },
  { id: 'activity', labelKey: 'admin.activityLogs', icon: Clock, path: '/admin/activity' },
  { id: 'settings', labelKey: 'admin.adminSettings', icon: Settings, path: '/admin/settings' },
];

export default function AdminLayout({ children }) {
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);

  const currentPath = location.pathname.replace('/admin', '') || '/';

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lng', lng);
    setLanguageOpen(false);
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setNotificationsOpen(false);
      setLanguageOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-[#111827] border-r border-white/5 transition-all duration-300 z-40 ${collapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">MMO Store</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
            aria-label={collapsed ? t('admin.expand_sidebar', 'Mở rộng thanh bên') : t('admin.collapse_sidebar', 'Thu gọn thanh bên')}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label={t('admin.primary_navigation', 'Điều hướng chính')}>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = currentPath === item.path || (item.path !== '/admin' && currentPath.startsWith(item.path));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                    isActive 
                      ? 'bg-blue-500/10 text-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">{t(item.labelKey)}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {item.warning && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                          !
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[#111827] rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-50">
                      {t(item.labelKey)}
                      {item.badge && <span className="ml-2 text-blue-400">{item.badge}</span>}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Collapse indicator */}
        {collapsed && (
          <div className="p-4 border-t border-white/5">
            <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#111827] border-b border-white/5 z-40 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          aria-label={t('admin.open_menu', 'Mở menu')}
          aria-expanded={mobileOpen}
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">MMO Store</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label={t('admin.open_search', 'Mở tìm kiếm')}
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setNotificationsOpen(true)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors relative"
            aria-label={t('admin.open_notifications', 'Mở thông báo')}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-[#111827] border-r border-white/5 z-50"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-lg">MMO Store</span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  aria-label={t('admin.close_menu', 'Đóng menu')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-3">
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const isActive = currentPath === item.path;
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isActive 
                            ? 'bg-blue-500/10 text-blue-400' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="flex-1 text-sm font-medium">{t(item.labelKey)}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`flex-1 min-h-screen pt-16 lg:pt-0 transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
        aria-label={t('admin.main_content', 'Nội dung chính')}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:border-white/20 transition-colors"
              aria-label={t('admin.open_search', 'Mở tìm kiếm')}
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">{t('admin.search')}</span>
              <kbd className="ml-8 px-1.5 py-0.5 text-xs bg-white/10 rounded" aria-hidden="true">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors text-sm font-medium">
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{t('admin.quickAdd')}</span>
            </button>

            {/* Language Switcher */}
            <div className="relative group">
              <button
                onClick={() => setLanguageOpen(!languageOpen)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5 text-gray-400 hover:text-white"
                aria-label={t('admin.change_language', 'Đổi ngôn ngữ')}
                aria-haspopup="menu"
                aria-expanded={languageOpen}
              >
                <Globe className="w-5 h-5" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase">{i18n.language}</span>
              </button>
              <div className={`absolute right-0 top-full mt-2 w-36 bg-[#111827] rounded-xl border border-white/10 shadow-xl transition-all py-1 z-50 ${languageOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
                <button
                  onClick={() => changeLanguage('vi')}
                  className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-white/5 transition-colors ${i18n.language === 'vi' ? 'text-blue-400' : 'text-gray-400'}`}
                >
                  Tiếng Việt (VI)
                </button>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-white/5 transition-colors ${i18n.language === 'en' ? 'text-blue-400' : 'text-gray-400'}`}
                >
                  English (EN)
                </button>
              </div>
            </div>

            {/* Notifications */}
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors relative"
              aria-label={t('admin.open_notifications', 'Mở thông báo')}
              aria-haspopup="dialog"
              aria-expanded={notificationsOpen}
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true" />
            </button>

            {/* User Menu */}
            <div className="relative group">
              <button
                className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                aria-label={t('admin.user_menu', 'Menu người dùng')}
                aria-haspopup="menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold" aria-hidden="true">
                  A
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-gray-300">admin@mmostore.com</p>
                </div>
              </button>
              <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-[#111827] rounded-xl border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="px-4 py-2 border-b border-white/5">
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-gray-500">admin@mmostore.com</p>
                </div>
                <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  <User className="w-4 h-4" />
                  <span>{t('common.myAccount')}</span>
                </Link>
                <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>{t('admin.adminSettings')}</span>
                </Link>
                <div className="border-t border-white/5 mt-2 pt-2">
                  <button 
                    onClick={() => { logout(); navigate('/login'); }}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('admin.logout')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Command Palette */}
      <AnimatePresence>
        {searchOpen && (
          <CommandPalette onClose={() => setSearchOpen(false)} />
        )}
      </AnimatePresence>

      {/* Notifications Panel */}
      <AnimatePresence>
        {notificationsOpen && (
          <NotificationsPanel onClose={() => setNotificationsOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CommandPalette({ onClose }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const location = useLocation();

  const commands = [
    { id: 'dashboard', labelKey: 'admin.goToDashboard', icon: LayoutDashboard },
    { id: 'orders', labelKey: 'admin.viewOrders', icon: ShoppingCart, shortcut: '⌘O' },
    { id: 'products', labelKey: 'admin.manageProducts', icon: Package, shortcut: '⌘P' },
    { id: 'customers', labelKey: 'admin.viewCustomers', icon: Users, shortcut: '⌘C' },
    { id: 'revenue', labelKey: 'admin.checkRevenue', icon: TrendingUp, shortcut: '⌘R' },
    { id: 'settings', labelKey: 'admin.openSettings', icon: Settings, shortcut: '⌘,' },
    { id: 'new-product', labelKey: 'admin.createNewProduct', icon: Plus, shortcut: '⌘N' },
    { id: 'export', labelKey: 'admin.exportData', icon: FileBarChart, shortcut: '⌘E' },
  ];

  const filteredCommands = query 
    ? commands.filter(c => t(c.labelKey).toLowerCase().includes(query.toLowerCase()))
    : commands;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-[#111827] rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
      >
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder={t('admin.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs bg-white/10 rounded text-gray-400">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
                <span className="flex-1 text-sm">{t(cmd.labelKey)}</span>
                {cmd.shortcut && (
                  <kbd className="px-2 py-1 text-xs bg-white/10 rounded text-gray-500">{cmd.shortcut}</kbd>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

function NotificationsPanel({ onClose }) {
  const { t } = useTranslation();
  const notifications = [
    { id: 1, titleKey: 'admin.newOrder', desc: 'Order #MMO8F3A2B', time: '2 min ago', unread: true },
    { id: 2, titleKey: 'admin.lowStock', desc: 'Proxy US Datacenter: 3 remaining', time: '15 min ago', unread: true },
    { id: 3, titleKey: 'admin.newCustomer', desc: 'customer@email.com', time: '1 hour ago', unread: false },
    { id: 4, titleKey: 'admin.withdrawalRequest', desc: 'Affiliate: 500,000 VND', time: '2 hours ago', unread: false },
    { id: 5, titleKey: 'admin.telegramStatus', desc: 'Connected and running', time: '3 hours ago', unread: false },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute right-4 top-full mt-2 w-80 bg-[#111827] rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="font-semibold">{t('admin.notifications')}</h3>
          <button className="text-xs text-blue-400 hover:text-blue-300">{t('admin.markAllRead')}</button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                notif.unread ? 'bg-blue-500/5' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {notif.unread && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t(notif.titleKey)}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.desc}</p>
                  <p className="text-xs text-gray-600 mt-1">{notif.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/5">
          <button className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            {t('admin.viewAllNotifications')}
          </button>
        </div>
      </motion.div>
    </>
  );
}
