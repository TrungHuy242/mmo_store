import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  DollarSign, TrendingUp, CreditCard, Wallet, ArrowUpRight,
  ArrowDownRight, Download, Filter, Calendar, PieChart,
  BarChart3, LineChart
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart as RechartsLine, Line,
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const revenueStats = [
  { labelKey: 'admin.total_revenue', value: '1,234,567,890₫', change: '+18.5%', type: 'up', periodKey: 'admin.vs_last_year' },
  { labelKey: 'admin.this_month', value: '156,780,000₫', change: '+12.3%', type: 'up', periodKey: 'admin.vs_last_month' },
  { labelKey: 'admin.this_week', value: '42,450,000₫', change: '+5.2%', type: 'up', periodKey: 'admin.vs_last_week' },
  { labelKey: 'admin.today', value: '8,450,000₫', change: '+15.8%', type: 'up', periodKey: 'admin.vs_yesterday' },
];

const revenueData = [
  { name: 'Jan', revenue: 85000000, orders: 240 },
  { name: 'Feb', revenue: 92000000, orders: 280 },
  { name: 'Mar', revenue: 78000000, orders: 220 },
  { name: 'Apr', revenue: 105000000, orders: 310 },
  { name: 'May', revenue: 112000000, orders: 350 },
  { name: 'Jun', revenue: 98000000, orders: 290 },
  { name: 'Jul', revenue: 124000000, orders: 380 },
  { name: 'Aug', revenue: 138000000, orders: 420 },
  { name: 'Sep', revenue: 142000000, orders: 450 },
  { name: 'Oct', revenue: 156000000, orders: 480 },
  { name: 'Nov', revenue: 168000000, orders: 520 },
  { name: 'Dec', revenue: 184000000, orders: 580 },
];

const categoryRevenue = [
  { name: 'Accounts', revenue: 420000000, color: '#3b82f6' },
  { name: 'Proxy', revenue: 280000000, color: '#8b5cf6' },
  { name: 'Tools', revenue: 320000000, color: '#06b6d4' },
  { name: 'Courses', revenue: 150000000, color: '#f59e0b' },
  { name: 'VPS', revenue: 64000000, color: '#10b981' },
];

const paymentMethods = [
  { name: 'Balance', value: 45, color: '#22c55e' },
  { name: 'VietQR', value: 40, color: '#3b82f6' },
  { name: 'Bank Transfer', value: 15, color: '#8b5cf6' },
];

const topProducts = [
  { name: 'Gmail Account New', revenue: 18600000, orders: 1240 },
  { name: 'Proxy US Datacenter', revenue: 26700000, orders: 890 },
  { name: 'Facebook Tool Pro', revenue: 16800000, orders: 560 },
  { name: 'AI Content Writer', revenue: 21000000, orders: 420 },
  { name: 'VPS Premium 4GB', revenue: 15500000, orders: 310 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'];

export default function AdminRevenue() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('year');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.revenue_analytics')}</h1>
          <p className="text-gray-300 text-sm mt-1">{t('admin.track_earnings')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          >
            <option value="week">{t('admin.this_week')}</option>
            <option value="month">{t('admin.this_month')}</option>
            <option value="year">{t('admin.this_year')}</option>
            <option value="all">{t('admin.all_time')}</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm font-medium transition-colors" aria-label={t('admin.export')}>
            <Download className="w-4 h-4" aria-hidden="true" />
            {t('admin.export')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueStats.map((stat, i) => (
          <motion.div key={stat.labelKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-[#111827] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                stat.type === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {stat.type === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-gray-300 text-sm mt-4">{t(stat.labelKey)}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{t(stat.periodKey)}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-[#111827] rounded-2xl border border-white/5 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold">{t('admin.revenue_overview')}</h2>
              <p className="text-sm text-gray-300">{t('admin.revenue_orders_overview')}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" aria-hidden="true" />
                <span className="text-sm text-gray-300">{t('admin.revenue')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400" aria-hidden="true" />
                <span className="text-sm text-gray-300">{t('admin.orders')}</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                  formatter={(value) => [`${value.toLocaleString()}₫`, t('admin.revenue')]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Line type="monotone" dataKey="orders" stroke="#22d3ee" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#111827] rounded-2xl border border-white/5 p-6"
        >
          <h2 className="font-semibold mb-2">{t('admin.revenue_by_category')}</h2>
          <p className="text-sm text-gray-300 mb-6">{t('admin.distribution_earnings')}</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={categoryRevenue}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="revenue"
                >
                  {categoryRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                  formatter={(value) => [`${(value/1000000).toFixed(0)}M₫`, '']}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-4">
            {categoryRevenue.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                <span className="text-xs text-gray-300 flex-1">{cat.name}</span>
                <span className="text-xs font-medium">{(cat.revenue/1000000).toFixed(0)}M₫</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Payment Methods & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#111827] rounded-2xl border border-white/5 p-6"
        >
          <h2 className="font-semibold mb-2">{t('admin.payment_methods')}</h2>
          <p className="text-sm text-gray-300 mb-6">{t('admin.distribution_payment_types')}</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethods} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-[#111827] rounded-2xl border border-white/5 p-6"
        >
          <h2 className="font-semibold mb-2">{t('admin.top_products')}</h2>
          <p className="text-sm text-gray-300 mb-6">{t('admin.best_performing')}</p>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium text-gray-300" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-gray-300">{product.orders} {t('admin.orders')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-400">{product.revenue.toLocaleString('vi-VN')}₫</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
