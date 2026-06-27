import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign,
  Package, AlertTriangle, Ticket, CheckCircle, Clock, ArrowUpRight,
  ArrowDownRight, Activity, Server, CreditCard, Zap, Globe,
  MoreHorizontal, Eye, Download, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';

const StatCard = ({ titleKey, value, change, changeType, icon: Icon, gradient }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111827] rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            changeType === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {changeType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-1">{t(titleKey)}</p>
      <p className="text-2xl font-bold">{value}</p>
    </motion.div>
  );
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [salesData, setSalesData] = useState([]);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        adminApi.getDashboardStats().catch(() => ({ data: null })),
        adminApi.getRecentOrders(5).catch(() => ({ data: [] })),
        adminApi.getTopProducts(5).catch(() => ({ data: [] })),
      ]);

      // Parse stats
      const statsData = statsRes.data?.data || statsRes.data || {};
      setStats({
        revenue: statsData.totalRevenue || statsData.revenue || 0,
        orders: statsData.totalOrders || statsData.orders || 0,
        customers: statsData.totalCustomers || statsData.customers || 0,
        products: statsData.totalProducts || statsData.products || 0,
      });

      // Parse recent orders
      const ordersList = ordersRes.data?.data || ordersRes.data || ordersRes.data?.orders || [];
      setRecentOrders(Array.isArray(ordersList) ? ordersList.slice(0, 5) : []);

      // Parse top products
      const productsList = productsRes.data?.data || productsRes.data || productsRes.data?.products || [];
      setTopProducts(Array.isArray(productsList) ? productsList.slice(0, 5) : []);

      // Generate chart data from stats if available
      if (statsData.revenueByDay) {
        setRevenueData(statsData.revenueByDay);
      } else {
        // Generate placeholder data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        setRevenueData(months.map(name => ({
          name,
          revenue: Math.random() * 10000 + 5000,
          orders: Math.floor(Math.random() * 100 + 50),
        })));
      }

      if (statsData.salesByDay) {
        setSalesData(statsData.salesByDay);
      } else {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        setSalesData(days.map(name => ({ name, sales: Math.random() * 5000 + 1000 })));
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      // Use placeholder data
      setStats({ revenue: 0, orders: 0, customers: 0, products: 0 });
      setRevenueData([]);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.dashboard')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('admin.welcome_back')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDashboard()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.refresh')}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          titleKey="admin.total_revenue"
          value={loading ? '...' : `${Number(stats?.revenue || 0).toLocaleString('vi-VN')}₫`}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard
          titleKey="admin.total_orders"
          value={loading ? '...' : (stats?.orders || 0).toLocaleString()}
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatCard
          titleKey="admin.active_users"
          value={loading ? '...' : (stats?.customers || 0).toLocaleString()}
          icon={Users}
          gradient="bg-gradient-to-br from-purple-500 to-pink-600"
        />
        <StatCard
          titleKey="admin.low_stock_warning"
          value={loading ? '...' : (stats?.lowStock || 0).toString()}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111827] rounded-2xl border border-white/5 p-6"
        >
          <h3 className="font-semibold mb-4">{t('admin.revenue_overview')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} />
                <YAxis stroke="#ffffff40" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111827] rounded-2xl border border-white/5 p-6"
        >
          <h3 className="font-semibold mb-4">{t('admin.sales_trend')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} />
                <YAxis stroke="#ffffff40" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-[#111827] rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold">{t('admin.recent_orders')}</h3>
            <button className="text-sm text-blue-400 hover:text-blue-300">{t('common.viewAll')}</button>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-4 animate-pulse">
                  <div className="h-4 bg-white/5 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-white/5 rounded w-1/4"></div>
                </div>
              ))
            ) : recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                      {order.user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{order.user?.email || '—'}</p>
                      <p className="text-xs text-gray-500">#{order.orderNumber || order.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{Number(order.total).toLocaleString('vi-VN')}₫</p>
                    <p className="text-xs text-gray-500 capitalize">{order.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa có đơn hàng nào</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-semibold">{t('admin.top_products')}</h3>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-4 animate-pulse">
                  <div className="h-4 bg-white/5 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-white/5 rounded w-1/3"></div>
                </div>
              ))
            ) : topProducts.length > 0 ? (
              topProducts.map((product, i) => (
                <div key={product.id} className="px-6 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.salesCount || product.sales || 0} {t('products.sold').toLowerCase()}</p>
                  </div>
                  <span className="text-sm font-medium text-green-400">
                    {Number(product.price || 0).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa có sản phẩm nào</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
