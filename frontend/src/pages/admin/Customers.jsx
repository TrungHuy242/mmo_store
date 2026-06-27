import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Search, Plus, MoreHorizontal, Mail, Phone, Globe, Clock,
  ShoppingCart, DollarSign, AlertTriangle, ChevronLeft, ChevronRight,
  Filter, Download, User, Shield, TrendingUp, ExternalLink, X,
  RefreshCw, UserCheck, UserX
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';

export default function AdminCustomers() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const itemsPerPage = 10;

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: itemsPerPage };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const res = await adminApi.getCustomers(params);
      const result = res.data?.data || res.data || [];
      const pagination = res.data?.pagination || res.pagination || {};
      
      setCustomers(result);
      setTotal(pagination.total || result.length);
      setTotalPages(pagination.totalPages || 1);
    } catch (err) {
      console.error('Failed to load customers:', err);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, t]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const handleToggleStatus = async (customer) => {
    setActionLoading(customer.id);
    try {
      const newStatus = customer.status === 'active' ? 'suspended' : 'active';
      await adminApi.updateCustomerStatus(customer.id, newStatus);
      toast.success(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản`);
      loadCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-500/10 text-green-400 border-green-500/20',
      suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
      banned: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    const labels = {
      active: 'Hoạt động',
      suspended: 'Vô hiệu hóa',
      banned: 'Bị cấm',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[status] || colors.active}`}>
        {labels[status] || status}
      </span>
    );
  };

  const activeCount = customers.filter(c => c.status === 'active').length;
  const totalRevenue = customers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.customers')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('admin.manage_users')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => loadCustomers()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" />
            {t('admin.export')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111827] rounded-xl border border-white/5 p-4">
          <p className="text-sm text-gray-400">{t('admin.total_customers')}</p>
          <p className="text-2xl font-bold mt-1">{loading ? '...' : total}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#111827] rounded-xl border border-white/5 p-4">
          <p className="text-sm text-gray-400">{t('admin.active_users')}</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{loading ? '...' : activeCount}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111827] rounded-xl border border-white/5 p-4">
          <p className="text-sm text-gray-400">{t('admin.total_revenue')}</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{loading ? '...' : totalRevenue.toLocaleString('vi-VN')}₫</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#111827] rounded-xl border border-white/5 p-4">
          <p className="text-sm text-gray-400">{t('admin.suspicious_accounts')}</p>
          <p className="text-2xl font-bold mt-1 text-amber-400">0</p>
        </motion.div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder={t('admin.search')} value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 cursor-pointer">
          <option value="all">{t('admin.all_status')}</option>
          <option value="active">{t('admin.active')}</option>
          <option value="suspended">{t('admin.suspended')}</option>
        </select>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div><p className="text-gray-400 mt-4">{t('common.loading')}</p></div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center"><User className="w-12 h-12 mx-auto text-gray-600" /><p className="text-gray-400 mt-4">Chưa có khách hàng nào</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.customer')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.total_spent', 'Chi tiêu')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Đơn hàng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.last_login', 'Đăng nhập cuối')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.status')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">{t('admin.actions')}</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                          {customer.fullName?.charAt(0) || customer.email?.charAt(0) || 'U'}
                        </div>
                        <div><p className="font-medium">{customer.fullName || '—'}</p><p className="text-xs text-gray-500">{customer.username || '—'}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><span className="text-sm">{customer.email}</span></td>
                    <td className="px-4 py-4"><span className="text-sm text-green-400 font-medium">{(customer.totalSpent || 0).toLocaleString('vi-VN')}₫</span></td>
                    <td className="px-4 py-4"><span className="text-sm">{customer.orderCount || 0}</span></td>
                    <td className="px-4 py-4"><span className="text-xs text-gray-500">{customer.lastLoginAt ? new Date(customer.lastLoginAt).toLocaleString('vi-VN') : '—'}</span></td>
                    <td className="px-4 py-4">{getStatusBadge(customer.status)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleStatus(customer)} disabled={actionLoading === customer.id}
                          className={`p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 ${customer.status === 'active' ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                          title={customer.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}>
                          {actionLoading === customer.id ? <RefreshCw className="w-4 h-4 animate-spin" /> :
                           customer.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-gray-400">Trang {currentPage}/{totalPages} · {total} khách hàng</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-white/10'}`}>{i + 1}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
