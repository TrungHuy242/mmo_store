import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Search, Filter, Download, MoreHorizontal, Eye, CheckCircle,
  XCircle, Clock, RefreshCw, ChevronLeft, ChevronRight,
  Package, User, CreditCard, MessageSquare, AlertTriangle, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';

const statusOptions = [
  { value: 'all', labelKey: 'admin.all_status' },
  { value: 'pending', labelKey: 'admin.pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'paid', labelKey: 'admin.paid', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'processing', labelKey: 'admin.processing', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'completed', labelKey: 'admin.completed', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'refunded', labelKey: 'admin.refunded', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'cancelled', labelKey: 'admin.cancelled', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

const paymentOptions = [
  { value: 'all', labelKey: 'admin.all_payments' },
  { value: 'BALANCE', labelKey: 'admin.balance' },
  { value: 'VIETQR', labelKey: 'admin.vietqr' },
  { value: 'USDT_TRC20', labelKey: 'USDT' },
  { value: 'CARD', labelKey: 'Card' },
];

export default function AdminOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  
  const itemsPerPage = 10;

  // Load orders
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (paymentFilter !== 'all') params.paymentMethod = paymentFilter;
      
      const res = await adminApi.getOrders(params);
      const result = res.data?.data || res.data || [];
      const pagination = res.data?.pagination || res.pagination || {};
      
      setOrders(result);
      setTotal(pagination.total || result.length);
      setTotalPages(pagination.totalPages || Math.ceil((pagination.total || result.length) / itemsPerPage));
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, paymentFilter, t]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Complete order
  const handleCompleteOrder = async (orderId) => {
    setActionLoading(orderId);
    try {
      await adminApi.completeOrder(orderId);
      toast.success('Đã hoàn thành đơn hàng');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId) => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    
    setActionLoading(orderId);
    try {
      await adminApi.cancelOrder(orderId);
      toast.success('Đã hủy đơn hàng');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedOrders(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusOption?.color || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
        {t(statusOption?.labelKey || status)}
      </span>
    );
  };

  const getPaymentLabel = (method) => {
    const option = paymentOptions.find(p => p.value === method);
    return t(option?.labelKey || method);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.orders')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('admin.manage_all_orders')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadOrders()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" />
            {t('admin.export')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111827] rounded-2xl border border-white/5 p-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={t('admin.search')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
            ))}
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          >
            {paymentOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
            <span className="text-sm text-blue-400">{selectedOrders.length} {t('admin.selected')}</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors">
                {t('admin.mark_completed')}
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors">
                {t('admin.cancel_selected')}
              </button>
              <button
                onClick={() => setSelectedOrders([])}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors"
              >
                {t('admin.clear')}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden"
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-4">{t('common.loading')}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-600" />
            <p className="text-gray-400 mt-4">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.order')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.customer')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.product')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.amount')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.payment')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.date')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="font-mono text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        #{order.orderNumber || order.id}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                          {order.user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{order.user?.fullName || order.user?.username || '—'}</p>
                          <p className="text-xs text-gray-500">{order.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {order.items?.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{item.product?.name || '—'}</span>
                            {item.quantity > 1 && (
                              <span className="px-1.5 py-0.5 text-xs bg-white/10 rounded">x{item.quantity}</span>
                            )}
                          </div>
                        ))}
                        {(order.items?.length || 0) > 2 && (
                          <span className="text-xs text-gray-500">+{order.items.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium">
                        {Number(order.total).toLocaleString('vi-VN')}₫
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-gray-400">{getPaymentLabel(order.paymentMethod)}</span>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title={t('admin.view_details')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status === 'pending' || order.status === 'paid' ? (
                          <button
                            onClick={() => handleCompleteOrder(order.id)}
                            disabled={actionLoading === order.id}
                            className="p-2 rounded-lg hover:bg-green-500/10 text-gray-400 hover:text-green-400 transition-colors disabled:opacity-50"
                            title={t('admin.mark_complete')}
                          >
                            {actionLoading === order.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        ) : null}
                        {order.status !== 'completed' && order.status !== 'refunded' && order.status !== 'cancelled' ? (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={actionLoading === order.id}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                            title={t('admin.cancel_order')}
                          >
                            {actionLoading === order.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {t('admin.showing')} {(currentPage - 1) * itemsPerPage + 1} {t('admin.of')} {Math.min(currentPage * itemsPerPage, total)} {t('admin.of')} {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === i + 1
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onComplete={handleCompleteOrder}
          onCancel={handleCancelOrder}
          loading={actionLoading === selectedOrder.id}
        />
      )}
    </div>
  );
}

function OrderDetailsModal({ order, onClose, onComplete, onCancel, loading }) {
  const { t } = useTranslation();
  
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#111827] rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t('admin.order')} #{order.orderNumber || order.id}</h2>
            <p className="text-sm text-gray-500">
              {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Status Timeline */}
          <div className="flex items-center justify-between">
            {['pending', 'paid', 'processing', 'completed'].map((status, i) => {
              const isActive = ['pending', 'paid', 'processing', 'completed'].indexOf(order.status) >= i;
              return (
                <div key={status} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-500'
                  }`}>
                    {status === 'pending' && <Clock className="w-5 h-5" />}
                    {status === 'paid' && <CreditCard className="w-5 h-5" />}
                    {status === 'processing' && <RefreshCw className="w-5 h-5" />}
                    {status === 'completed' && <CheckCircle className="w-5 h-5" />}
                  </div>
                  <span className="ml-2 text-sm capitalize">{t('admin.' + status)}</span>
                  {i < 3 && <div className={`w-12 h-0.5 mx-2 ${isActive ? 'bg-green-500' : 'bg-white/10'}`} />}
                </div>
              );
            })}
          </div>

          {/* Customer Info */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('admin.customer')}</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                {order.user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-medium">{order.user?.fullName || order.user?.username || '—'}</p>
                <p className="text-sm text-gray-500">{order.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('admin.product')}</h3>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 p-1.5 rounded-lg bg-blue-500/20 text-blue-400" />
                    <div>
                      <p className="font-medium">{item.product?.name || '—'}</p>
                      <p className="text-sm text-gray-500">{t('admin.quantity_num')} {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-bold">{Number(item.price).toLocaleString('vi-VN')}₫</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
              <span className="text-gray-400">{t('common.total')}</span>
              <span className="text-lg font-bold text-green-400">{Number(order.total).toLocaleString('vi-VN')}₫</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('admin.payment')}</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
              <span className="text-green-400 font-medium">{t('admin.paid')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <button
            onClick={() => onCancel(order.id)}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {t('admin.cancel_order')}
          </button>
          <button
            onClick={() => onComplete(order.id)}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-green-500 text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {t('admin.mark_complete')}
          </button>
        </div>
      </motion.div>
    </>
  );
}
