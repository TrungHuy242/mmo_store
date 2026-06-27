import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Search, User, RefreshCw, UserCheck, UserX, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';
import { usePaginatedData } from '../../hooks/useAdminData';
import Pagination from '../../components/ui/Pagination';

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: 'all', key: 'admin.all_status' },
  { value: 'active', key: 'admin.active' },
  { value: 'suspended', key: 'admin.suspended' },
];

const STATUS_BADGES = {
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
  banned: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const STATUS_LABELS = {
  active: 'Hoạt động',
  suspended: 'Vô hiệu hóa',
  banned: 'Bị cấm',
};

function StatusBadge({ status }) {
  const cls = STATUS_BADGES[status] || STATUS_BADGES.active;
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${cls}`}>{label}</span>
  );
}

const StatBox = ({ label, value, color = 'text-white', loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#111827] rounded-xl border border-white/5 p-4"
  >
    <p className="text-sm text-gray-400">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${color}`}>{loading ? '...' : value}</p>
  </motion.div>
);

export default function AdminCustomers() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const {
    data: customers,
    loading,
    page,
    totalPages,
    total,
    changePage,
    updateParams,
    reload,
  } = usePaginatedData(
    (params) => adminApi.getCustomers({ limit: ITEMS_PER_PAGE, ...params }),
    { limit: ITEMS_PER_PAGE },
    { autoLoad: true }
  );

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter !== 'all') params.status = statusFilter;
    updateParams(params);
  }, [search, statusFilter, updateParams]);

  const handleToggleStatus = async (customer) => {
    setActionLoading(customer.id);
    try {
      const newStatus = customer.status === 'active' ? 'suspended' : 'active';
      await adminApi.updateCustomerStatus(customer.id, newStatus);
      toast.success(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản`);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.update_failed'));
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = customers.filter((c) => c.status === 'active').length;
  const totalRevenue = customers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0);
  const totalOrders = customers.reduce((sum, c) => sum + Number(c.orderCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.customers')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('admin.manage_users')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={reload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.refresh')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBox label={t('admin.total_customers')} value={total} loading={loading} />
        <StatBox label={t('admin.active_users')} value={activeCount} color="text-green-400" loading={loading} />
        <StatBox
          label={t('admin.total_revenue')}
          value={`${totalRevenue.toLocaleString('vi-VN')}₫`}
          color="text-green-400"
          loading={loading}
        />
        <StatBox
          label="Tổng đơn hàng"
          value={totalOrders}
          color="text-blue-400"
          loading={loading}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder={t('admin.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-sm text-white cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden"
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-400 mt-4">{t('common.loading')}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-12 h-12 mx-auto text-gray-600" />
            <p className="text-gray-400 mt-4">Chưa có khách hàng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.customer')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Chi tiêu</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Đơn hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Số dư</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Đăng nhập cuối</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.status')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                          {(customer.fullName || customer.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{customer.fullName || customer.username || '—'}</p>
                          <p className="text-xs text-gray-500">{customer.username || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm">{customer.email || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-green-400 font-medium">
                        {Number(customer.totalSpent || 0).toLocaleString('vi-VN')}₫
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm">{customer.orderCount || 0}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-blue-400">
                        {Number(customer.balance || 0).toLocaleString('vi-VN')}₫
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-gray-500">
                        {customer.lastLogin ? new Date(customer.lastLogin).toLocaleString('vi-VN') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={customer.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(customer)}
                          disabled={actionLoading === customer.id}
                          className={`p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 ${
                            customer.status === 'active'
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-green-400 hover:text-green-300'
                          }`}
                          title={customer.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          {actionLoading === customer.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : customer.status === 'active' ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
          <p className="text-sm text-gray-400">{total} khách hàng</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={changePage} />
        </div>
      </motion.div>
    </div>
  );
}