import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Search, Eye, CheckCircle, XCircle, Clock, RefreshCw, ChevronLeft, ChevronRight,
  Package, CreditCard, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';
import { usePaginatedData } from '../../hooks/useAdminData';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { SkeletonTable } from '../../components/ui';

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: 'all', key: 'admin.all_status', color: '' },
  { value: 'pending', key: 'admin.pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'paid', key: 'admin.paid', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'processing', key: 'admin.processing', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'completed', key: 'admin.completed', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'refunded', key: 'admin.refunded', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'cancelled', key: 'admin.cancelled', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

const PAYMENT_OPTIONS = [
  { value: 'all', key: 'admin.all_payments' },
  { value: 'BALANCE', key: 'admin.balance' },
  { value: 'VIETQR', key: 'admin.vietqr' },
  { value: 'USDT_TRC20', key: 'USDT' },
  { value: 'CARD', key: 'Card' },
];

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  const cls = opt?.color || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${cls}`}>
      {t(opt?.key || status)}
    </span>
  );
};

const PaymentLabel = ({ method }) => {
  const { t } = useTranslation();
  const opt = PAYMENT_OPTIONS.find((p) => p.value === method);
  return <span className="text-xs text-gray-400">{t(opt?.key || method || '—')}</span>;
};

const TIMELINE_STEPS = [
  { key: 'pending', icon: Clock },
  { key: 'paid', icon: CreditCard },
  { key: 'processing', icon: RefreshCw },
  { key: 'completed', icon: CheckCircle },
];

function OrderDetailsModal({ order, onClose, onComplete, onCancel, loading }) {
  const { t } = useTranslation();
  const currentStep = TIMELINE_STEPS.findIndex((s) => s.key === order.status);

  return (
    <Modal isOpen onClose={onClose} size="2xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">
            {t('admin.order')} #{order.orderNumber || order.id}
          </h2>
          <p className="text-sm text-gray-300">
            {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—'}
          </p>
        </div>
      </div>

      <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
        {/* Status Timeline */}
        <div className="flex items-center justify-between">
          {TIMELINE_STEPS.map((step, i) => {
            const isActive = currentStep >= i;
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="ml-2 text-sm">{t(`admin.${step.key}`)}</span>
                {i < TIMELINE_STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${isActive ? 'bg-green-500' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Customer Info */}
        <div className="bg-white/5 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">{t('admin.customer')}</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold" aria-hidden="true">
              {(order.user?.email || order.user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{order.user?.fullName || order.user?.username || '—'}</p>
              <p className="text-sm text-gray-300">{order.user?.email || '—'}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white/5 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">{t('admin.product')}</h3>
          <div className="space-y-3">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 p-1.5 rounded-lg bg-blue-500/20 text-blue-400" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{item.product?.name || '—'}</p>
                    <p className="text-sm text-gray-300">{t('admin.quantity_num')} {item.quantity}</p>
                  </div>
                </div>
                <p className="font-bold">{Number(item.price || 0).toLocaleString('vi-VN')}₫</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
            <span className="text-gray-300">{t('common.total')}</span>
            <span className="text-lg font-bold text-green-400">
              {Number(order.total || 0).toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white/5 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">{t('admin.payment')}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" aria-hidden="true" />
              <span className="capitalize">{order.paymentMethod || '—'}</span>
            </div>
            <StatusBadge status={order.status === 'completed' ? 'completed' : 'paid'} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-5 mt-5 border-t border-white/5">
        <button
          onClick={() => onCancel(order.id)}
          disabled={loading || order.status === 'cancelled' || order.status === 'refunded' || order.status === 'completed'}
          className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('admin.cancel_order')}
        </button>
        <button
          onClick={() => onComplete(order.id)}
          disabled={loading || order.status === 'completed' || order.status === 'cancelled' || order.status === 'refunded'}
          className="px-4 py-2 rounded-xl bg-green-500 text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          {t('admin.mark_complete')}
        </button>
      </div>
    </Modal>
  );
}

export default function AdminOrders() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [cancelOrderId, setCancelOrderId] = useState(null);

  const {
    data: orders,
    loading,
    page,
    totalPages,
    total,
    changePage,
    updateParams,
    reload,
  } = usePaginatedData(
    (params) => adminApi.getOrders({ limit: ITEMS_PER_PAGE, ...params }),
    { limit: ITEMS_PER_PAGE },
    { autoLoad: true }
  );

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (paymentFilter !== 'all') params.paymentMethod = paymentFilter;
    updateParams(params);
  }, [search, statusFilter, paymentFilter, updateParams]);

  const handleCompleteOrder = async (orderId) => {
    setActionLoading(orderId);
    try {
      await adminApi.completeOrder(orderId);
      toast.success(t('admin.order_completed', 'Đã hoàn thành đơn hàng'));
      reload();
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.update_failed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setActionLoading(orderId);
    try {
      await adminApi.cancelOrder(orderId);
      toast.success(t('admin.order_cancelled', 'Đã hủy đơn hàng'));
      setCancelOrderId(null);
      reload();
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.update_failed'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.orders')}</h1>
          <p className="text-gray-300 text-sm mt-1">{t('admin.manage_all_orders')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={reload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
            aria-label={t('admin.refresh_orders', 'Làm mới danh sách đơn hàng')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {t('admin.refresh')}
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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={t('admin.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white cursor-pointer"
          >
            {PAYMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden"
      >
        {loading ? (
          <SkeletonTable rows={8} cols={8} />
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-500" aria-hidden="true" />
            <p className="text-gray-300 mt-4">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.order')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.customer')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.product')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.amount')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.payment')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.date')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold" aria-hidden="true">
                          {(order.user?.email || order.user?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{order.user?.fullName || order.user?.username || '—'}</p>
                          <p className="text-xs text-gray-300">{order.user?.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {(order.items || []).slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" aria-hidden="true" />
                            <span className="text-sm">{item.product?.name || '—'}</span>
                            {item.quantity > 1 && (
                              <span className="px-1.5 py-0.5 text-xs bg-white/10 rounded">x{item.quantity}</span>
                            )}
                          </div>
                        ))}
                        {(order.items?.length || 0) > 2 && (
                          <span className="text-xs text-gray-300">+{order.items.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium">{Number(order.total || 0).toLocaleString('vi-VN')}₫</span>
                    </td>
                    <td className="px-4 py-4">
                      <PaymentLabel method={order.paymentMethod} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-gray-300">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title={t('admin.view_details')}
                          aria-label={`${t('admin.view_details')} ${order.orderNumber || order.id}`}
                        >
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        </button>
                        {(order.status === 'pending' || order.status === 'paid') && (
                          <button
                            onClick={() => handleCompleteOrder(order.id)}
                            disabled={actionLoading === order.id}
                            className="p-2 rounded-lg hover:bg-green-500/10 text-gray-400 hover:text-green-400 transition-colors disabled:opacity-50"
                            title={t('admin.mark_complete')}
                            aria-label={`${t('admin.mark_complete')} ${order.orderNumber || order.id}`}
                          >
                            {actionLoading === order.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <CheckCircle className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                        )}
                        {!['completed', 'refunded', 'cancelled'].includes(order.status) && (
                          <button
                            onClick={() => setCancelOrderId(order.id)}
                            disabled={actionLoading === order.id}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                            title={t('admin.cancel_order')}
                            aria-label={`${t('admin.cancel_order')} ${order.orderNumber || order.id}`}
                          >
                            <XCircle className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
          <p className="text-sm text-gray-300">{total} {t('admin.orders').toLowerCase()}</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={changePage} />
        </div>
      </motion.div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onComplete={handleCompleteOrder}
          onCancel={handleCancelOrder}
          loading={actionLoading === selectedOrder.id}
        />
      )}

      <ConfirmModal
        isOpen={!!cancelOrderId}
        onClose={() => setCancelOrderId(null)}
        onConfirm={() => handleCancelOrder(cancelOrderId)}
        title="Huỷ đơn hàng?"
        message="Hành động này không thể hoàn tác."
        confirmLabel="Huỷ đơn"
        loading={actionLoading === cancelOrderId}
      />
    </div>
  );
}