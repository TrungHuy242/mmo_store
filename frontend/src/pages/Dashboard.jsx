import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Badge, Tabs, Skeleton } from '../components/ui';
import api from '../api/client';
import { affiliateApi } from '../api';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    orders: 0,
    totalSpent: 0,
    downloads: 0,
    affiliateEarnings: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [affiliateData, setAffiliateData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch affiliate dashboard data
  const fetchAffiliateData = useCallback(async () => {
    try {
      const affiliateRes = await api.get('/affiliates/dashboard').catch(() => ({ data: null }));
      const data = affiliateRes.data?.data;
      setAffiliateData(data);
      setStats(prev => ({
        ...prev,
        affiliateEarnings: data?.totalEarnings || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch affiliate data:', error);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [ordersRes] = await Promise.all([
          api.get('/orders/my-orders?limit=5'),
        ]);

        const orders = ordersRes.data?.data || ordersRes.data || [];
        setRecentOrders(orders);

        // Calculate stats
        setStats(prev => ({
          ...prev,
          orders: orders.length || 0,
          totalSpent: orders.reduce((sum, o) => sum + (o.total || 0), 0),
          downloads: orders.filter(o => o.status === 'DELIVERED').length,
        }));

        // Fetch affiliate data
        await fetchAffiliateData();
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [fetchAffiliateData]);

  const tabs = [
    { id: 'overview', labelKey: 'dashboard.overview' },
    { id: 'orders', labelKey: 'dashboard.orders' },
    { id: 'affiliate', labelKey: 'dashboard.affiliate' },
    { id: 'settings', labelKey: 'dashboard.settings' },
  ];

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <section className="bg-bg-secondary border-b border-border py-8">
        <div className="container-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">
                {t('dashboard.welcome')} {user?.name || user?.username || 'User'}
              </h1>
              <p className="text-text-secondary">
                {t('dashboard.manage_account')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/support">
                <Button variant="secondary" leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                }>
                  {t('dashboard.support')}
                </Button>
              </Link>
              <Link to="/products">
                <Button leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }>
                  {t('dashboard.shop_now')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container-lg py-8">
        <Tabs tabs={tabs.map(tab => ({ id: tab.id, label: t(tab.labelKey) }))} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

        <div className="mt-8">
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} recentOrders={recentOrders} loading={loading} />
          )}
          {activeTab === 'orders' && <OrdersTab orders={recentOrders} loading={loading} />}
          {activeTab === 'affiliate' && (
            <AffiliateTab
              data={affiliateData}
              loading={loading}
              onWithdrawSuccess={fetchAffiliateData}
            />
          )}
          {activeTab === 'settings' && <SettingsTab user={user} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ stats, recentOrders, loading }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          label={t('dashboard.total_orders')}
          value={stats.orders}
          color="primary"
          loading={loading}
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label={t('dashboard.total_spent')}
          value={`$${stats.totalSpent.toLocaleString()}`}
          color="success"
          loading={loading}
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          }
          label={t('dashboard.downloads')}
          value={stats.downloads}
          color="warning"
          loading={loading}
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          label={t('dashboard.affiliate_balance')}
          value={`$${stats.affiliateEarnings.toLocaleString()}`}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Monthly Spending Chart */}
      <MonthlySpendingChart orders={recentOrders} loading={loading} />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <QuickActionCard
          to="/wishlist"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          title={t('dashboard.wishlist')}
          description={t('dashboard.view_saved_items')}
        />
        <QuickActionCard
          to="/licenses"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          }
          title={t('dashboard.my_licenses_tab')}
          description={t('dashboard.access_licenses')}
        />
        <QuickActionCard
          to="/support"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          title={t('dashboard.support')}
          description={t('dashboard.get_help')}
        />
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">{t('dashboard.recent_orders')}</h2>
          <Link to="/orders" className="text-sm text-primary hover:underline">{t('common.viewAll')}</Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: i * 0.08,
                  duration: 0.4, 
                  ease: [0.22, 1, 0.36, 1]
                }}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-border cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-12 h-12 rounded-lg bg-bg-tertiary flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                  >
                    <svg className="w-6 h-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </motion.div>
                  <div>
                    <p className="font-medium text-text-primary">
                      {t('dashboard.order')} #{order.orderNumber || order.id}
                    </p>
                    <p className="text-sm text-text-tertiary">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-text-primary">
                    ${order.total?.toLocaleString()}
                  </span>
                  <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'PENDING' ? 'warning' : 'default'}>
                    {order.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-bg-secondary rounded-lg border border-border">
            <svg className="w-12 h-12 mx-auto text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-text-secondary mb-4">{t('dashboard.no_orders_yet')}</p>
            <Link to="/products">
              <Button>{t('dashboard.start_shopping')}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, loading }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    purple: 'bg-accent-purple/10 text-accent-purple',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-text-primary">{value}</p>
            )}
          </div>
          <motion.div 
            className={`p-3 rounded-xl ${colors[color]}`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {icon}
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}

// SVG Bar Chart for Monthly Spending
function MonthlySpendingChart({ orders, loading }) {
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Calculate monthly data from orders
  const monthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const data = Array(12).fill(0);

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate.getFullYear() === currentYear && order.status !== 'CANCELLED') {
        const month = orderDate.getMonth();
        data[month] += Number(order.total) || 0;
      }
    });

    return data;
  }, [orders]);

  const maxAmount = Math.max(...monthlyData, 1);
  const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  // Chart dimensions
  const width = 800;
  const height = 280;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = chartWidth / 12 - 8;
  const barGap = 8;

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString('vi-VN');
  };

  const handleMouseMove = (e, monthIndex) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredMonth(monthIndex);
  };

  const totalYearSpent = monthlyData.reduce((a, b) => a + b, 0);
  const currentMonth = new Date().getMonth();

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary">Thống kê chi tiêu năm {new Date().getFullYear()}</h3>
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Thống kê chi tiêu năm {new Date().getFullYear()}</h3>
          <p className="text-sm text-text-secondary mt-1">
            Tổng chi tiêu: <span className="text-neon-cyan font-semibold">{totalYearSpent.toLocaleString('vi-VN')}đ</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <span className="w-3 h-3 rounded bg-neon-cyan"></span>
          <span>Chi tiêu hàng tháng</span>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={padding.top + chartHeight * (1 - ratio)}
                x2={width - padding.right}
                y2={padding.top + chartHeight * (1 - ratio)}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={padding.top + chartHeight * (1 - ratio) + 4}
                textAnchor="end"
                className="fill-text-tertiary text-[10px]"
              >
                {formatCurrency(maxAmount * ratio)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {monthlyData.map((amount, i) => {
            const barHeight = (amount / maxAmount) * chartHeight;
            const x = padding.left + i * (barWidth + barGap) + barGap / 2;
            const y = padding.top + chartHeight - barHeight;
            const isCurrentMonth = i === currentMonth;
            const isHovered = hoveredMonth === i;
            const hasValue = amount > 0;

            return (
              <g key={i}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  rx={4}
                  className={`cursor-pointer transition-all duration-200 ${
                    hasValue 
                      ? isHovered || isCurrentMonth
                        ? 'fill-neon-cyan'
                        : 'fill-neon-cyan/70'
                      : 'fill-bg-tertiary'
                  }`}
                  onMouseMove={(e) => handleMouseMove(e, i)}
                  onMouseLeave={() => setHoveredMonth(null)}
                />
                
                {/* Month label */}
                <text
                  x={x + barWidth / 2}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  className={`text-[11px] ${i === currentMonth ? 'fill-neon-cyan font-bold' : 'fill-text-tertiary'}`}
                >
                  {months[i]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredMonth !== null && monthlyData[hoveredMonth] > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute pointer-events-none z-10 bg-bg-primary border border-border rounded-lg px-3 py-2 shadow-lg"
            style={{
              left: tooltipPos.x + 10,
              top: tooltipPos.y - 50,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-xs text-text-secondary">{monthNames[hoveredMonth]}</p>
            <p className="text-sm font-bold text-neon-cyan">
              {monthlyData[hoveredMonth].toLocaleString('vi-VN')}đ
            </p>
          </motion.div>
        )}
      </div>

      {/* Summary */}
      {totalYearSpent === 0 && (
        <div className="text-center py-6">
          <p className="text-text-secondary">Chưa có chi tiêu trong năm nay</p>
          <Link to="/products" className="text-primary hover:underline text-sm">
            Bắt đầu mua sắm
          </Link>
        </div>
      )}
    </Card>
  );
}

function QuickActionCard({ to, icon, title, description }) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Card hover className="h-full">
          <div className="flex items-center gap-4">
            <motion.div 
              className="p-3 rounded-xl bg-primary/10 text-primary"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {icon}
            </motion.div>
            <div>
              <h3 className="font-medium text-text-primary">{title}</h3>
              <p className="text-sm text-text-secondary">{description}</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}

function OrdersTab({ orders, loading }) {
  const { t } = useTranslation();
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  // Toggle order expansion
  const toggleOrder = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }

    setExpandedOrder(orderId);

    // Fetch full order details if not already loaded
    if (!orderDetails[orderId]) {
      try {
        setLoadingDetails(prev => ({ ...prev, [orderId]: true }));
        const res = await orderApi.getById(orderId);
        const data = res.data?.data || res.data;
        setOrderDetails(prev => ({ ...prev, [orderId]: data }));
      } catch (error) {
        console.error('Failed to fetch order details:', error);
        toast.error(t('toasts.order_detail_load_failed'));
      } finally {
        setLoadingDetails(prev => ({ ...prev, [orderId]: false }));
      }
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text, label = 'Nội dung') => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`);
  };

  // Get delivery info from order item
  const getDeliveryInfo = (item) => {
    // Try different field names for delivery data
    return item.deliveryData || item.licenseKey || item.license || item.accessInfo || null;
  };

  // Format delivery data for display
  const formatDeliveryData = (data) => {
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      // Handle different formats
      if (data.email && data.password) {
        return `${data.email}:${data.password}`;
      }
      if (data.licenseKey) {
        return data.licenseKey;
      }
      // Try to stringify
      return JSON.stringify(data, null, 2);
    }
    return null;
  };

  // Check if order has delivery data
  const hasDeliveryData = (order) => {
    if (order.items) {
      return order.items.some(item => getDeliveryInfo(item));
    }
    return order.deliveryData || order.licenseKey;
  };

  // Check if order is completed/delivered
  const isDelivered = (status) => {
    return ['COMPLETED', 'DELIVERED', 'PAID', 'PROCESSING'].includes(status);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-text-primary">{t('dashboard.order_history')}</h2>
        <Link to="/products" className="text-sm text-neon-cyan hover:underline">
          Mua thêm sản phẩm
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bg-secondary rounded-xl border border-border overflow-hidden"
            >
              {/* Order Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-bg-tertiary/30 transition-colors"
                onClick={() => toggleOrder(order.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-bg-tertiary flex items-center justify-center">
                    <svg className="w-6 h-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary flex items-center gap-2">
                      {t('dashboard.order')} #{order.orderNumber || order.id}
                      {hasDeliveryData(order) && isDelivered(order.status) && (
                        <span className="px-2 py-0.5 text-xs bg-neon-cyan/10 text-neon-cyan rounded-full">
                          Có License
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-text-tertiary">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')} • {order.items?.length || 0} sản phẩm
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-text-primary">
                    {(order.total || 0).toLocaleString('vi-VN')}đ
                  </span>
                  <Badge
                    variant={
                      order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'success' :
                      order.status === 'PAID' || order.status === 'PROCESSING' ? 'success' :
                      order.status === 'PENDING' ? 'warning' :
                      order.status === 'CANCELLED' ? 'error' : 'default'
                    }
                  >
                    {order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'Hoàn thành' :
                     order.status === 'PAID' || order.status === 'PROCESSING' ? 'Đã thanh toán' :
                     order.status === 'PENDING' ? 'Chờ thanh toán' :
                     order.status === 'CANCELLED' ? 'Đã hủy' :
                     order.status}
                  </Badge>
                  <svg
                    className={`w-5 h-5 text-text-tertiary transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Order Details */}
              {expandedOrder === order.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border"
                >
                  {loadingDetails[order.id] ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full mx-auto" />
                      <p className="text-text-secondary mt-3">Đang tải chi tiết...</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {/* Order Items */}
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          Sản phẩm đã mua
                        </h4>
                        <div className="space-y-3">
                          {(orderDetails[order.id]?.items || order.items || []).map((item, idx) => {
                            const deliveryInfo = getDeliveryInfo(item);
                            const isItemDelivered = isDelivered(order.status);

                            return (
                              <div key={item.id || idx} className="bg-bg-tertiary/50 rounded-lg p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <p className="font-medium text-text-primary">{item.name || item.productName}</p>
                                    <p className="text-sm text-text-tertiary">
                                      Số lượng: {item.quantity || 1} • {(item.price || item.effectivePrice || 0).toLocaleString('vi-VN')}đ
                                    </p>
                                  </div>
                                </div>

                                {/* License / Delivery Data */}
                                {deliveryInfo && isItemDelivered && (
                                  <div className="mt-4 p-4 bg-neon-cyan/5 rounded-lg border border-neon-cyan/20">
                                    <div className="flex items-center gap-2 mb-3">
                                      <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                      </svg>
                                      <h5 className="font-semibold text-neon-cyan">Thông tin bàn giao</h5>
                                    </div>

                                    {/* If delivery data is string (license key) */}
                                    {typeof deliveryInfo === 'string' ? (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <code className="flex-1 bg-bg-primary p-3 rounded-lg text-sm font-mono text-neon-cyan break-all">
                                            {deliveryInfo}
                                          </code>
                                          <button
                                            onClick={() => copyToClipboard(deliveryInfo, 'License Key')}
                                            className="p-2 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors flex-shrink-0"
                                            title="Sao chép"
                                          >
                                            <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      /* If delivery data is object (account credentials) */
                                      <div className="space-y-3">
                                        {/* Account format: email:password */}
                                        {deliveryInfo.email && (
                                          <div>
                                            <p className="text-xs text-text-tertiary mb-1">Tài khoản</p>
                                            <div className="flex items-center gap-2">
                                              <code className="flex-1 bg-bg-primary p-3 rounded-lg text-sm font-mono text-text-primary break-all">
                                                {deliveryInfo.email}:{deliveryInfo.password}
                                              </code>
                                              <button
                                                onClick={() => copyToClipboard(`${deliveryInfo.email}:${deliveryInfo.password}`, 'tài khoản')}
                                                className="p-2 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors flex-shrink-0"
                                                title="Sao chép tài khoản"
                                              >
                                                <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* License Key */}
                                        {deliveryInfo.licenseKey && (
                                          <div>
                                            <p className="text-xs text-text-tertiary mb-1">{t('licenses.license_key_label')}</p>
                                            <div className="flex items-center gap-2">
                                              <code className="flex-1 bg-bg-primary p-3 rounded-lg text-sm font-mono text-neon-cyan break-all">
                                                {deliveryInfo.licenseKey}
                                              </code>
                                              <button
                                                onClick={() => copyToClipboard(deliveryInfo.licenseKey, t('licenses.license_key_label'))}
                                                className="p-2 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors flex-shrink-0"
                                                title="Sao chép License"
                                              >
                                                <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Additional info */}
                                        {deliveryInfo.username && !deliveryInfo.email && (
                                          <div>
                                            <p className="text-xs text-text-tertiary mb-1">{t('licenses.username_label')}</p>
                                            <div className="flex items-center gap-2">
                                              <code className="flex-1 bg-bg-primary p-3 rounded-lg text-sm font-mono text-text-primary">
                                                {deliveryInfo.username}
                                              </code>
                                              <button
                                                onClick={() => copyToClipboard(deliveryInfo.username, t('licenses.username_label'))}
                                                className="p-2 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors flex-shrink-0"
                                              >
                                                <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Password */}
                                        {deliveryInfo.password && (
                                          <div>
                                            <p className="text-xs text-text-tertiary mb-1">{t('licenses.password_label')}</p>
                                            <div className="flex items-center gap-2">
                                              <code className="flex-1 bg-bg-primary p-3 rounded-lg text-sm font-mono text-text-primary">
                                                {deliveryInfo.password}
                                              </code>
                                              <button
                                                onClick={() => copyToClipboard(deliveryInfo.password, t('licenses.password_label'))}
                                                className="p-2 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors flex-shrink-0"
                                              >
                                                <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Copy All Button */}
                                        <motion.button
                                          onClick={() => {
                                            const text = formatDeliveryData(deliveryInfo);
                                            copyToClipboard(text, 'toàn bộ thông tin');
                                          }}
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                          className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-neon-cyan to-neon-magenta text-white rounded-lg font-medium flex items-center justify-center gap-2"
                                        >
                                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                          </svg>
                                          Copy nhanh toàn bộ thông tin bàn giao
                                        </motion.button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* No delivery data yet */}
                                {!deliveryInfo && (
                                  <div className="mt-3 p-3 bg-bg-tertiary/50 rounded-lg text-center">
                                    <p className="text-sm text-text-tertiary">
                                      {isItemDelivered
                                        ? 'Không có thông tin bàn giao cho sản phẩm này'
                                        : 'Thông tin bàn giao sẽ hiển thị sau khi đơn hàng hoàn thành'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="pt-4 border-t border-border">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-text-secondary">Tạm tính</span>
                          <span className="text-text-primary">{(order.subtotal || order.total || 0).toLocaleString('vi-VN')}đ</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-success">Giảm giá</span>
                            <span className="text-success">-{order.discount.toLocaleString('vi-VN')}đ</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold">
                          <span className="text-text-primary">Tổng cộng</span>
                          <span className="text-neon-cyan">{(order.total || 0).toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        <Link to={`/order-success/${order.id}`} className="flex-1">
                          <Button variant="secondary" className="w-full">
                            Xem chi tiết đơn hàng
                          </Button>
                        </Link>
                        {!isDelivered(order.status) && (
                          <Link to="/products" className="flex-1">
                            <Button className="w-full">
                              Mua thêm
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-bg-secondary rounded-lg border border-border">
          <svg className="w-16 h-16 mx-auto text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-text-primary mb-2">Chưa có đơn hàng nào</h3>
          <p className="text-text-secondary mb-6">Bắt đầu mua sắm để xem lịch sử đơn hàng của bạn</p>
          <Link to="/products">
            <Button>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Khám phá sản phẩm
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function AffiliateTab({ data, loading, onWithdrawSuccess }) {
  const { t } = useTranslation();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Bank details form
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });

  // Minimum withdrawal amount
  const MIN_WITHDRAWAL = 50000; // 50,000 VND

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    const amount = parseFloat(withdrawAmount);

    if (!withdrawAmount || isNaN(amount)) {
      newErrors.amount = 'Nhập số tiền cần rút';
    } else if (amount < MIN_WITHDRAWAL) {
      newErrors.amount = `Số tiền tối thiểu là ${MIN_WITHDRAWAL.toLocaleString('vi-VN')}đ`;
    } else if (data?.availableBalance !== undefined && amount > data.availableBalance) {
      newErrors.amount = `Số tiền vượt quá số dư khả dụng (${(data.availableBalance || 0).toLocaleString('vi-VN')}đ)`;
    }

    if (!bankDetails.bankName.trim()) {
      newErrors.bankName = 'Nhập tên ngân hàng';
    }
    if (!bankDetails.accountNumber.trim()) {
      newErrors.accountNumber = 'Nhập số tài khoản';
    }
    if (!bankDetails.accountHolder.trim()) {
      newErrors.accountHolder = 'Nhập tên chủ tài khoản';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWithdraw = async () => {
    if (!validateForm()) return;

    const amount = parseFloat(withdrawAmount);

    try {
      setWithdrawLoading(true);
      setSuccess(false);

      const details = JSON.stringify({
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountHolder: bankDetails.accountHolder,
      });

      await affiliateApi.withdraw({
        amount,
        details,
      });

      // Success
      toast.success(t('toasts.withdrawal_submitted'));
      setSuccess(true);
      setWithdrawAmount('');
      setBankDetails({ bankName: '', accountNumber: '', accountHolder: '' });
      setErrors({});

      // Notify parent to refresh data
      onWithdrawSuccess?.();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Không thể gửi yêu cầu rút tiền';
      toast.error(message);
      setErrors({ submit: message });
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Handle amount input change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setWithdrawAmount(value);
    if (errors.amount) setErrors({ ...errors, amount: '' });
  };

  if (loading) {
    return <Skeleton className="h-64 rounded-lg" />;
  }

  if (!data) {
    return (
      <div className="text-center py-16 bg-bg-secondary rounded-lg border border-border">
        <svg className="w-12 h-12 mx-auto text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 className="text-lg font-medium text-text-primary mb-2">{t('dashboard.join_affiliate')}</h3>
        <p className="text-text-secondary mb-4">{t('dashboard.earn_commission')}</p>
        <Button>{t('dashboard.join_now')}</Button>
      </div>
    );
  }

  const availableBalance = data.availableBalance || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-neon-cyan/10 to-neon-cyan/5 border-neon-cyan/20">
          <p className="text-sm text-text-secondary mb-1">{t('dashboard.total_earnings')}</p>
          <p className="text-2xl font-bold text-neon-cyan">
            {(data.totalEarnings || 0).toLocaleString('vi-VN')}đ
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-neon-gold/10 to-neon-gold/5 border-neon-gold/20">
          <p className="text-sm text-text-secondary mb-1">Số dư khả dụng</p>
          <p className="text-2xl font-bold text-neon-gold">
            {availableBalance.toLocaleString('vi-VN')}đ
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary mb-1">{t('dashboard.referral_code')}</p>
          <div className="flex items-center gap-2">
            <code className="text-lg font-mono text-primary">{data.code}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(data.code);
                toast.success('Đã sao chép mã giới thiệu!');
              }}
              className="p-1 rounded hover:bg-bg-tertiary transition-colors"
              title="Sao chép"
            >
              <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary mb-1">{t('dashboard.total_referrals')}</p>
          <p className="text-2xl font-bold text-text-primary">{data.totalReferrals || 0}</p>
        </Card>
      </div>

      {/* Withdrawal Form */}
      <Card className="border-neon-gold/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-neon-gold/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-neon-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{t('dashboard.withdraw_earnings')}</h3>
            <p className="text-sm text-text-secondary">Rút tiền hoa hồng về tài khoản ngân hàng</p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3"
          >
            <svg className="w-6 h-6 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-success font-medium">Yêu cầu rút tiền đã được gửi!</p>
              <p className="text-sm text-success/80">Yêu cầu của bạn đang được duyệt. Thường mất 1-3 ngày làm việc.</p>
            </div>
          </motion.div>
        )}

        {/* Quick amount buttons */}
        <div className="mb-6">
          <p className="text-sm text-text-secondary mb-3">Chọn nhanh số tiền:</p>
          <div className="flex flex-wrap gap-2">
            {[50000, 100000, 200000, 500000].map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  if (amount <= availableBalance) {
                    setWithdrawAmount(amount.toString());
                    if (errors.amount) setErrors({ ...errors, amount: '' });
                  }
                }}
                disabled={amount > availableBalance}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  parseFloat(withdrawAmount) === amount
                    ? 'bg-neon-cyan text-white'
                    : amount > availableBalance
                    ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed'
                    : 'bg-bg-tertiary hover:bg-bg-primary text-text-primary border border-border'
                }`}
              >
                {amount.toLocaleString('vi-VN')}đ
              </button>
            ))}
            <button
              onClick={() => {
                setWithdrawAmount(availableBalance.toString());
                if (errors.amount) setErrors({ ...errors, amount: '' });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                parseFloat(withdrawAmount) === availableBalance
                  ? 'bg-neon-gold text-white'
                  : 'bg-neon-gold/10 hover:bg-neon-gold/20 text-neon-gold border border-neon-gold/30'
              }`}
            >
              Tất cả ({availableBalance.toLocaleString('vi-VN')}đ)
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Số tiền rút
          </label>
          <div className="relative">
            <input
              type="number"
              value={withdrawAmount}
              onChange={handleAmountChange}
              placeholder="Nhập số tiền cần rút"
              className={`input pr-16 text-lg ${errors.amount ? 'input-error' : ''}`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary font-medium">đ</span>
          </div>
          {errors.amount && (
            <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.amount}
            </p>
          )}
          <p className="text-xs text-text-tertiary mt-2">
            Số dư khả dụng: <span className="text-neon-gold font-medium">{availableBalance.toLocaleString('vi-VN')}đ</span>
            <span className="mx-2">|</span>
            Số tiền tối thiểu: <span className="font-medium">{MIN_WITHDRAWAL.toLocaleString('vi-VN')}đ</span>
          </p>
        </div>

        {/* Bank Details */}
        <div className="border-t border-border pt-6">
          <h4 className="font-medium text-text-primary mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Thông tin tài khoản nhận tiền
          </h4>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tên ngân hàng</label>
              <input
                type="text"
                value={bankDetails.bankName}
                onChange={(e) => {
                  setBankDetails({ ...bankDetails, bankName: e.target.value });
                  if (errors.bankName) setErrors({ ...errors, bankName: '' });
                }}
                placeholder="VD: Vietcombank, VPBank, MB Bank..."
                className={`input ${errors.bankName ? 'input-error' : ''}`}
              />
              {errors.bankName && (
                <p className="text-red-400 text-sm mt-1">{errors.bankName}</p>
              )}
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Số tài khoản</label>
              <input
                type="text"
                value={bankDetails.accountNumber}
                onChange={(e) => {
                  setBankDetails({ ...bankDetails, accountNumber: e.target.value });
                  if (errors.accountNumber) setErrors({ ...errors, accountNumber: '' });
                }}
                placeholder="Nhập số tài khoản"
                className={`input ${errors.accountNumber ? 'input-error' : ''}`}
              />
              {errors.accountNumber && (
                <p className="text-red-400 text-sm mt-1">{errors.accountNumber}</p>
              )}
            </div>

            {/* Account Holder */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Tên chủ tài khoản</label>
              <input
                type="text"
                value={bankDetails.accountHolder}
                onChange={(e) => {
                  setBankDetails({ ...bankDetails, accountHolder: e.target.value });
                  if (errors.accountHolder) setErrors({ ...errors, accountHolder: '' });
                }}
                placeholder="Nhập tên chủ tài khoản (viết in hoa không dấu)"
                className={`input ${errors.accountHolder ? 'input-error' : ''}`}
              />
              {errors.accountHolder && (
                <p className="text-red-400 text-sm mt-1">{errors.accountHolder}</p>
              )}
            </div>
          </div>
        </div>

        {/* Withdraw Button */}
        <div className="mt-6">
          <motion.button
            onClick={handleWithdraw}
            disabled={withdrawLoading || availableBalance <= 0}
            whileHover={{ scale: availableBalance > 0 ? 1.02 : 1 }}
            whileTap={{ scale: availableBalance > 0 ? 0.98 : 1 }}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-3
              ${withdrawLoading || availableBalance <= 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-neon-gold to-neon-cyan text-white hover:shadow-lg hover:shadow-neon-gold/25'
              }
            `}
          >
            {withdrawLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang gửi yêu cầu...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Rút tiền
              </>
            )}
          </motion.button>

          {availableBalance <= 0 && (
            <p className="text-center text-sm text-text-tertiary mt-3">
              Số dư hoa hồng chưa đủ để rút. Cần tối thiểu {MIN_WITHDRAWAL.toLocaleString('vi-VN')}đ.
            </p>
          )}
        </div>
      </Card>

      {/* Recent Withdrawals */}
      {data.recentWithdrawals?.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Lịch sử rút tiền gần đây</h3>
          <div className="space-y-3">
            {data.recentWithdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between p-3 bg-bg-tertiary/50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-text-primary">
                    {withdrawal.amount?.toLocaleString('vi-VN')}đ
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {new Date(withdrawal.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <Badge
                  variant={
                    withdrawal.status === 'COMPLETED' ? 'success' :
                    withdrawal.status === 'PENDING' ? 'warning' :
                    'default'
                  }
                >
                  {withdrawal.status === 'COMPLETED' ? 'Hoàn thành' :
                   withdrawal.status === 'PENDING' ? 'Đang duyệt' :
                   withdrawal.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function SettingsTab({ user }) {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || user?.name || '',
    username: user?.username || '',
    phone: user?.phone || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Update profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);
    
    try {
      const res = await api.put('/auth/profile', {
        fullName: profileForm.fullName,
        username: profileForm.username,
        phone: profileForm.phone,
      });
      
      // Update user in context
      const updatedUser = res.data?.data;
      if (updatedUser) {
        updateUser(updatedUser);
      }
      
      toast.success(t('toasts.profile_updated'));
      setProfileSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Cập nhật thất bại');
    } finally {
      setProfileLoading(false);
    }
  };
  
  // Change password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('toasts.password_mismatch'));
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error(t('toasts.password_too_short'));
      return;
    }
    
    setPasswordLoading(true);
    setPasswordSuccess(false);
    
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      toast.success('Đổi mật khẩu thành công!');
      setPasswordSuccess(true);
      
      // Clear password fields
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Đổi mật khẩu thất bại');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t('dashboard.profile_info')}</h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">{t('dashboard.full_name')}</label>
              <input 
                type="text" 
                value={profileForm.fullName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="input" 
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">{t('auth.email')}</label>
              <input type="email" defaultValue={user?.email} className="input" disabled />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">{t('dashboard.username')}</label>
              <input 
                type="text" 
                value={profileForm.username}
                onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                className="input" 
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">{t('auth.phone')}</label>
              <input 
                type="tel" 
                value={profileForm.phone}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder={t('auth.phone')}
                className="input" 
              />
            </div>
          </div>
          <Button type="submit" loading={profileLoading}>
            {t('dashboard.save_changes')}
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t('dashboard.change_password')}</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-text-secondary mb-1">{t('dashboard.current_password')}</label>
            <div className="relative">
              <input 
                type={showPasswords ? 'text' : 'password'} 
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="input pr-10" 
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              >
                {showPasswords ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">{t('dashboard.new_password')}</label>
            <input 
              type={showPasswords ? 'text' : 'password'} 
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              className="input" 
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">{t('auth.confirm_password')}</label>
            <input 
              type={showPasswords ? 'text' : 'password'} 
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="input" 
            />
          </div>
          <Button type="submit" loading={passwordLoading}>
            {t('dashboard.update_password')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
