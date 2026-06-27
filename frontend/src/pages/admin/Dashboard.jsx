import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingCart, Users, Package, AlertTriangle,
  RefreshCw, ArrowUpRight, ArrowDownRight, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';
import { useParallelData } from '../../hooks/useAdminData';

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
        {change !== undefined && change !== null && (
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

const EmptyChart = ({ message }) => (
  <div className="h-64 flex flex-col items-center justify-center text-gray-500">
    <Package className="w-10 h-10 opacity-30 mb-2" />
    <p className="text-sm">{message}</p>
  </div>
);

const SkeletonBlock = ({ height = 64 }) => (
  <div className="animate-pulse bg-white/5 rounded" style={{ height }} />
);

const ChartCard = ({ title, loading, children, empty }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#111827] rounded-2xl border border-white/5 p-6"
  >
    <h3 className="font-semibold mb-4">{title}</h3>
    <div className="h-64">
      {loading ? (
        <SkeletonBlock height="100%" />
      ) : empty ? (
        <EmptyChart message={empty} />
      ) : (
        children
      )}
    </div>
  </motion.div>
);

const tooltipStyle = {
  contentStyle: { backgroundColor: '#1f2937', border: '1px solid #ffffff10', borderRadius: '8px' },
  labelStyle: { color: '#fff' },
};

// Format ISO date (YYYY-MM-DD) into a short label like "12/06"
const formatDayLabel = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function AdminDashboard() {
  const { t } = useTranslation();

  // Build fetchers once via useMemo so the array reference is stable across
  // renders. Passing a new array each render would re-trigger the hook's
  // effect, even though the hook now tolerates it via a ref.
  const fetchers = useMemo(
    () => [
      () => adminApi.getDashboardStats(),
      () => adminApi.getRecentOrders(5),
      () => adminApi.getTopProducts(5),
      () => adminApi.getRevenueSeries('month'),
    ],
    []
  );

  const { results, reload } = useParallelData(fetchers);
  const [statsRes, recentOrdersRes, topProductsRes, revenueRes] = results;

  // Surface a single toast when any of the parallel requests fails; using
  // a ref so the toast doesn't fire on every render.
  const lastErrorRef = useRef(null);
  useEffect(() => {
    const errResult = results.find((r) => r.error);
    if (errResult && errResult.error !== lastErrorRef.current) {
      lastErrorRef.current = errResult.error;
      toast.error(t('admin.load_dashboard_failed', 'Không thể tải dashboard'));
    } else if (!errResult) {
      lastErrorRef.current = null;
    }
  }, [results, t]);

  const statsData = statsRes.data || {};
  const recentOrders = Array.isArray(recentOrdersRes.data) ? recentOrdersRes.data : [];
  const topProducts = Array.isArray(topProductsRes.data) ? topProductsRes.data : [];
  const revenueRaw = Array.isArray(revenueRes.data) ? revenueRes.data : [];

  const revenueChart = revenueRaw.map((row) => ({
    name: formatDayLabel(row.date),
    revenue: Number(row.revenue || 0),
  }));
  const salesChart = revenueChart.map((row, i) => ({
    name: row.name,
    sales: Math.round(row.revenue / (i + 1)),
  }));

  const isLoading = results.some((r) => r.loading);

  const totalRevenue = Number(statsData.totalRevenue || 0);
  const totalOrders = Number(statsData.totalOrders || 0);
  const totalCustomers = Number(statsData.totalCustomers || 0);
  const todayOrders = Number(statsData.todayOrders || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.dashboard')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('admin.welcome_back')}</p>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('admin.refresh')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          titleKey="admin.total_revenue"
          value={isLoading ? '...' : `${totalRevenue.toLocaleString('vi-VN')}₫`}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard
          titleKey="admin.total_orders"
          value={isLoading ? '...' : totalOrders.toLocaleString()}
          change={todayOrders > 0 ? `+${todayOrders}` : null}
          changeType="up"
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatCard
          titleKey="admin.active_users"
          value={isLoading ? '...' : totalCustomers.toLocaleString()}
          icon={Users}
          gradient="bg-gradient-to-br from-purple-500 to-pink-600"
        />
        <StatCard
          titleKey="admin.pending_orders"
          value={isLoading ? '...' : Number(statsData.pendingOrders || 0).toLocaleString()}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard
          title={t('admin.revenue_overview')}
          loading={revenueRes.loading}
          empty={revenueChart.length === 0 ? 'Chưa có dữ liệu doanh thu' : null}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} />
              <YAxis stroke="#ffffff40" fontSize={12} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t('admin.sales_trend')}
          loading={revenueRes.loading}
          empty={salesChart.length === 0 ? 'Chưa có dữ liệu bán hàng' : null}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} />
              <YAxis stroke="#ffffff40" fontSize={12} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-[#111827] rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-semibold">{t('admin.recent_orders')}</h3>
          </div>
          <div className="divide-y divide-white/5">
            {recentOrdersRes.loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-4 space-y-2">
                  <SkeletonBlock height={14} />
                  <SkeletonBlock height={10} />
                </div>
              ))
            ) : recentOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa có đơn hàng nào</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                      {(order.user?.email || order.user?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{order.user?.email || order.user?.username || '—'}</p>
                      <p className="text-xs text-gray-500">#{order.orderNumber || order.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{Number(order.total || 0).toLocaleString('vi-VN')}₫</p>
                    <p className="text-xs text-gray-500 capitalize">{order.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-semibold">{t('admin.top_products')}</h3>
          </div>
          <div className="divide-y divide-white/5">
            {topProductsRes.loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-4 space-y-2">
                  <SkeletonBlock height={14} />
                  <SkeletonBlock height={10} />
                </div>
              ))
            ) : topProducts.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa có sản phẩm nào</p>
              </div>
            ) : (
              topProducts.map((product, i) => (
                <div key={product.id} className="px-6 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.salesCount || 0} {t('products.sold').toLowerCase()}</p>
                  </div>
                  <span className="text-sm font-medium text-green-400">
                    {Number(product.price || 0).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}