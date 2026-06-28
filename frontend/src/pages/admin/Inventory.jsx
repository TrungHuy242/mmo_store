import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Package, AlertTriangle, TrendingUp, Boxes, CheckCircle,
  RefreshCw, Search, ChevronLeft, ChevronRight,
  Trash2, Eye, EyeOff, Upload, X, Copy, Check, User,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';
import { useAdminData } from '../../hooks/useAdminData';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { SkeletonTable } from '../../components/ui';

const ITEMS_PER_PAGE = 20;

const ITEM_TYPES = [
  { value: 'LICENSE_KEY', label: 'License Key', icon: '🔑' },
  { value: 'ACCOUNT', label: 'Tài khoản (email:pass)', icon: '👤' },
  { value: 'LINK', label: 'Link Download', icon: '🔗' },
  { value: 'OTHER', label: 'Khác', icon: '📦' },
];

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'AVAILABLE', label: 'Còn hàng' },
  { value: 'SOLD', label: 'Đã bán' },
  { value: 'RESERVED', label: 'Đang giữ' },
];

const STATUS_BADGES = {
  AVAILABLE: 'bg-green-500/10 text-green-400 border border-green-500/20',
  SOLD: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  RESERVED: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  EXPIRED: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

const STATUS_LABELS = {
  AVAILABLE: 'Còn hàng',
  SOLD: 'Đã bán',
  RESERVED: 'Đang giữ',
  EXPIRED: 'Hết hạn',
};

function StatusBadge({ status }) {
  const cls = STATUS_BADGES[status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  const label = STATUS_LABELS[status] || status;
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}>{label}</span>;
}

function MaskedValue({ value }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('toasts.clipboard_failed'));
    }
  };

  const display = visible ? value : `${(value || '').substring(0, 8)}••••••••`;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-gray-300">{display || '—'}</span>
      <button
        onClick={() => setVisible((v) => !v)}
        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
        title={visible ? 'Ẩn' : 'Hiện'}
        aria-label={visible ? 'Ẩn giá trị' : 'Hiện giá trị'}
      >
        {visible ? <EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> : <Eye className="w-3.5 h-3.5" aria-hidden="true" />}
      </button>
      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-green-400 transition-colors"
        title="Copy"
        aria-label="Sao chép giá trị"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
      </button>
    </div>
  );
}

const PLACEHOLDERS = {
  LICENSE_KEY: 'XXXX-YYYY-ZZZZ-AAAA\nBBBB-CCCC-DDDD-EEEE\n...',
  ACCOUNT: 'email@example.com:password123\nuser2@example.com:pass456\n...',
  LINK: 'https://drive.google.com/file/xxx\nhttps://mega.nz/file/yyy\n...',
  OTHER: 'Nhập dữ liệu, mỗi dòng 1 item...',
};

function BulkAddModal({ product, onClose, onSuccess }) {
  const [type, setType] = useState('LICENSE_KEY');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);

  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l !== '');
  const uniqueLines = Array.from(new Set(lines));
  const duplicateCount = lines.length - uniqueLines.length;

  const handleSubmit = async () => {
    if (uniqueLines.length === 0) {
      toast.error(t('toasts.enter_at_least_1_item'));
      return;
    }
    setLoading(true);
    const toastId = toast.loading(`Đang nạp ${uniqueLines.length} items...`);
    try {
      const items = uniqueLines.map((value) => ({ value, type }));
      const res = await adminApi.addBulkInventory(product.id, items);
      const added = res.data?.data?.length ?? uniqueLines.length;
      toast.success(`✅ Đã nạp thành công ${added} items vào "${product.name}"`, { id: toastId });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi nạp hàng';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="2xl">
      <div className="flex items-start justify-between -mt-2 mb-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" aria-hidden="true" />
            Nạp hàng hàng loạt
          </h2>
          <p className="text-sm text-gray-300 mt-1">
            Sản phẩm: <span className="text-white font-medium">{product?.name}</span>
          </p>
        </div>
      </div>

      <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Loại hàng</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ITEM_TYPES.map((itemType) => (
              <button
                key={itemType.value}
                onClick={() => setType(itemType.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  type === itemType.value
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <span className="text-xl">{itemType.icon}</span>
                <p className="text-xs font-medium mt-1 leading-tight">{itemType.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">
              Danh sách items <span className="text-gray-500">(mỗi dòng = 1 item)</span>
            </label>
            {lines.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                  {uniqueLines.length} items hợp lệ
                </span>
                {duplicateCount > 0 && (
                  <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                    {duplicateCount} trùng lặp
                  </span>
                )}
              </div>
            )}
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={12}
            placeholder={PLACEHOLDERS[type] || PLACEHOLDERS.OTHER}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors font-mono resize-none"
          />
        </div>

        {/* Preview */}
        {uniqueLines.length > 0 && (
          <div>
            <p className="text-xs text-gray-300 mb-2 font-medium">Preview (5 items đầu):</p>
            <div className="bg-[#060d1f] rounded-xl p-3 border border-white/5 space-y-1.5">
              {uniqueLines.slice(0, 5).map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-5 text-right shrink-0">{i + 1}.</span>
                  <span className="text-xs font-mono text-green-400 truncate">
                    {line.length > 50 ? `${line.substring(0, 50)}...` : line}
                  </span>
                </div>
              ))}
              {uniqueLines.length > 5 && (
                <p className="text-xs text-gray-300 pl-7">... và {uniqueLines.length - 5} items khác</p>
              )}
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-amber-300 space-y-0.5">
            <p>Items trùng lặp trong danh sách sẽ bị loại bỏ tự động.</p>
            <p>Đảm bảo không có khoảng trắng thừa đầu/cuối dòng.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-5 mt-5 border-t border-white/5">
        <button
          onClick={() => setRawText('')}
          disabled={!rawText}
          className="px-4 py-2 rounded-xl bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          Xoá trắng
        </button>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || uniqueLines.length === 0}
            className="px-6 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Đang nạp...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Nạp {uniqueLines.length > 0 ? `${uniqueLines.length} ` : ''}items
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const STOCK_BADGE = (available) => {
  if (available === 0) return { label: '🚨 Hết', cls: 'text-red-400', bg: 'bg-red-500/10' };
  if (available <= 5) return { label: '⚠️ Thấp', cls: 'text-amber-400', bg: 'bg-amber-500/10' };
  return { label: '✅ Tốt', cls: 'text-green-400', bg: 'bg-green-500/10' };
};

export default function AdminInventory() {
  const { t } = useTranslation();

  // Products list
  const {
    data: productsData,
    loading: loadingProducts,
    load: reloadProducts,
  } = useAdminData(() => adminApi.getProducts({ limit: 100 }), { autoLoad: true });

  const products = Array.isArray(productsData) ? productsData : [];

  const [selectedProductId, setSelectedProductId] = useState('');
  const selectedProduct = products.find((p) => String(p.id) === String(selectedProductId)) || null;

  // Auto-select first product when list loads
  useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(String(products[0].id));
    }
  }, [products, selectedProductId]);

  // Pagination / filters state for the items list
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Inventory items for the selected product
  const fetchInventory = useCallback(
    () => adminApi.getInventoryByProduct(selectedProductId, {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      status: statusFilter || undefined,
    }),
    [selectedProductId, currentPage, statusFilter]
  );

  const {
    data: inventoryData,
    pagination,
    loading: loadingInventory,
    load: reloadInventory,
  } = useAdminData(fetchInventory, {
    autoLoad: !!selectedProductId,
    initialData: [],
    deps: [selectedProductId, currentPage, statusFilter],
  });

  // Inventory stats
  const fetchStats = useCallback(
    () => adminApi.getInventoryStats(selectedProductId),
    [selectedProductId]
  );

  const {
    data: stats,
    loading: loadingStats,
    load: reloadStats,
  } = useAdminData(fetchStats, { autoLoad: !!selectedProductId, deps: [selectedProductId] });

  // Reset page when product/status changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProductId, statusFilter]);

  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeletingId(deleteItem.id);
    try {
      await adminApi.deleteInventoryItem(deleteItem.id);
      toast.success('Đã xoá item');
      setDeleteItem(null);
      reloadInventory();
      reloadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoá thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  // Normalize items: backend returns { content, extraData: { type } }
  const items = (inventoryData || []).map((item) => ({
    ...item,
    value: item.value ?? item.content ?? '',
    type: item.type ?? item.extraData?.type ?? 'LICENSE_KEY',
  }));

  const filteredItems = search
    ? items.filter((item) =>
        (item.value || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.type || '').toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const stockBadge = stats ? STOCK_BADGE(stats.available ?? 0) : null;

  const statCards = [
    { label: 'Tổng items', value: stats?.total ?? 0, icon: Boxes, cls: 'text-white', bg: 'bg-blue-500/10' },
    { label: 'Còn hàng', value: stats?.available ?? 0, icon: CheckCircle, cls: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Đã bán', value: stats?.sold ?? 0, icon: TrendingUp, cls: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Cảnh báo kho', value: stockBadge?.label || '—', icon: AlertTriangle, cls: stockBadge?.cls || 'text-gray-400', bg: stockBadge?.bg || 'bg-white/5', isText: true },
  ];

  // Mini chart of last 7 days based on stats (if available)
  const chartData = (stats?.recentTrend || []).map((row) => ({
    name: row.date,
    stock: row.available,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Kho hàng</h1>
          <p className="text-gray-300 text-sm mt-1">Nạp hàng và theo dõi tồn kho theo sản phẩm</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { reloadInventory(); reloadStats(); }}
            disabled={!selectedProductId}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Làm mới kho"
          >
            <RefreshCw className={`w-4 h-4 ${loadingInventory ? 'animate-spin' : ''}`} aria-hidden="true" />
            Làm mới
          </button>
          <button
            onClick={() => setShowBulkAdd(true)}
            disabled={!selectedProduct}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Mở nạp hàng hàng loạt"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            Nạp hàng hàng loạt
          </button>
        </div>
      </div>

      {/* Product Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111827] rounded-2xl border border-white/5 p-4"
      >
        <label className="block text-sm font-medium text-gray-300 mb-2">Chọn sản phẩm để xem kho</label>
        {loadingProducts ? (
          <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
        ) : (
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
          >
            {products.length === 0 && <option value="">Chưa có sản phẩm</option>}
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111827] rounded-2xl border border-white/5 p-6"
            >
              {loadingStats ? (
                <div className="space-y-3">
                  <div className="h-12 w-12 bg-white/5 rounded-xl animate-pulse" />
                  <div className="h-8 bg-white/5 rounded animate-pulse w-16" />
                  <div className="h-4 bg-white/5 rounded animate-pulse w-24" />
                </div>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center ${card.cls}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className={`text-3xl font-bold mt-4 ${card.cls}`}>
                    {card.isText ? card.value : Number(card.value).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-300 mt-1">{card.label}</p>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Inventory Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden"
      >
        {/* Table Header / Filters */}
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Tìm kiếm item..."
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
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <span className="px-4 py-2.5 text-sm text-gray-300 bg-white/5 rounded-xl border border-white/5 whitespace-nowrap">
            {pagination?.total ?? items.length} items
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Giá trị</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ngày thêm</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingInventory ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${60 + ((j * 13) % 40)}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ) : !selectedProductId ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <User className="w-10 h-10 mx-auto opacity-30 mb-2" aria-hidden="true" />
                    <p>Chọn sản phẩm để xem kho</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-300">
                      <Package className="w-12 h-12 opacity-30" aria-hidden="true" />
                      <p className="font-medium">Kho trống — hãy nạp hàng ngay!</p>
                      <button
                        onClick={() => setShowBulkAdd(true)}
                        className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-sm font-medium hover:bg-blue-600 transition-colors text-white"
                      >
                        <Upload className="w-4 h-4" aria-hidden="true" />
                        Nạp hàng ngay
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const meta = ITEM_TYPES.find((t) => t.value === item.type);
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-200">
                          {meta?.icon} {meta?.label || item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <MaskedValue value={item.value} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-300">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          {item.status === 'AVAILABLE' && (
                            <button
                              onClick={() => setDeleteItem(item)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                              title="Xoá item"
                              aria-label={`Xoá item ${item.id}`}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-gray-300">
              Trang {currentPage}/{pagination.totalPages} · {pagination.total} items
            </p>
            <Pagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </motion.div>

      {/* Modals */}
      {showBulkAdd && selectedProduct && (
        <BulkAddModal
          product={selectedProduct}
          onClose={() => setShowBulkAdd(false)}
          onSuccess={() => { reloadInventory(); reloadStats(); reloadProducts(); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Xoá item này?"
        message="Thao tác này không thể hoàn tác."
        confirmLabel="Xoá"
        loading={deletingId === deleteItem?.id}
      />
    </div>
  );
}