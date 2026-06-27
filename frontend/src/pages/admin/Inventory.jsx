import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Package, AlertTriangle, TrendingUp, TrendingDown, RefreshCw,
  Plus, Download, Search, Filter, ChevronLeft, ChevronRight,
  Boxes, Clock, CheckCircle, XCircle, Trash2, Eye, EyeOff,
  Upload, X, Copy, Check
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  getProducts,
  getInventoryByProduct,
  getInventoryStats,
  addBulkInventory,
  deleteInventoryItem,
} from '../../services/adminApi';
import toast from 'react-hot-toast';

// Inventory item type labels
const ITEM_TYPES = [
  { value: 'LICENSE_KEY', label: 'License Key', icon: '🔑' },
  { value: 'ACCOUNT', label: 'Tài khoản (email:pass)', icon: '👤' },
  { value: 'LINK', label: 'Link Download', icon: '🔗' },
  { value: 'OTHER', label: 'Khác', icon: '📦' },
];

// Status badge
function StatusBadge({ status }) {
  const map = {
    AVAILABLE: { label: 'Còn hàng', cls: 'bg-green-500/10 text-green-400 border border-green-500/20' },
    SOLD: { label: 'Đã bán', cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
    RESERVED: { label: 'Đang giữ', cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    EXPIRED: { label: 'Hết hạn', cls: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  };
  const s = map[status] || { label: status, cls: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' };
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${s.cls}`}>{s.label}</span>;
}

// Skeleton loader row
function SkeletonRow() {
  return (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

// Modal Bulk Add Inventory
function BulkAddModal({ product, onClose, onSuccess }) {
  const [type, setType] = useState('LICENSE_KEY');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);

  const lines = rawText.split('\n').filter(l => l.trim() !== '');

  const handleSubmit = async () => {
    if (lines.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 item');
      return;
    }
    setLoading(true);
    const toastId = toast.loading(`Đang nạp ${lines.length} items...`);
    try {
      const items = lines.map(line => ({ value: line.trim(), type }));
      const res = await addBulkInventory(product.id, items);
      const added = res.data?.length ?? lines.length;
      toast.success(`✅ Đã nạp thành công ${added} items vào "${product.name}"`, { id: toastId });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi nạp hàng', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0f172a] rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" />
              Nạp hàng hàng loạt
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Sản phẩm: <span className="text-white font-medium">{product?.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Loại hàng</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ITEM_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    type === t.value
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <p className="text-xs font-medium mt-1 leading-tight">{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-400">
                Danh sách items <span className="text-gray-600">(mỗi dòng = 1 item)</span>
              </label>
              {lines.length > 0 && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                  {lines.length} items
                </span>
              )}
            </div>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={12}
              placeholder={
                type === 'LICENSE_KEY'
                  ? 'XXXX-YYYY-ZZZZ-AAAA\nBBBB-CCCC-DDDD-EEEE\n...'
                  : type === 'ACCOUNT'
                  ? 'email@example.com:password123\nuser2@example.com:pass456\n...'
                  : type === 'LINK'
                  ? 'https://drive.google.com/file/xxx\nhttps://mega.nz/file/yyy\n...'
                  : 'Nhập dữ liệu, mỗi dòng 1 item...'
              }
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors font-mono resize-none"
            />
          </div>

          {/* Preview */}
          {lines.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Preview (5 items đầu):</p>
              <div className="bg-[#060d1f] rounded-xl p-3 border border-white/5 space-y-1.5">
                {lines.slice(0, 5).map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-5 text-right shrink-0">{i + 1}.</span>
                    <span className="text-xs font-mono text-green-400 truncate">
                      {line.length > 50 ? line.substring(0, 50) + '...' : line}
                    </span>
                  </div>
                ))}
                {lines.length > 5 && (
                  <p className="text-xs text-gray-500 pl-7">... và {lines.length - 5} items khác</p>
                )}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400/80">
              Items trùng lặp sẽ bị bỏ qua. Đảm bảo không có khoảng trắng thừa đầu/cuối dòng.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between gap-3">
          <button
            onClick={() => setRawText('')}
            disabled={!rawText}
            className="px-4 py-2 rounded-xl bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Xoá trắng
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors">
              Huỷ
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || lines.length === 0}
              className="px-6 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Đang nạp...</>
              ) : (
                <><Upload className="w-4 h-4" /> Nạp {lines.length > 0 ? `${lines.length} ` : ''}items</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Confirm Delete Modal
function ConfirmDeleteModal({ item, onClose, onConfirm, loading }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0f172a] rounded-2xl border border-white/10 shadow-2xl z-50 p-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold">Xoá item này?</h3>
            <p className="text-sm text-gray-400">Thao tác này không thể hoàn tác</p>
          </div>
        </div>
        {item && (
          <div className="bg-white/5 rounded-xl p-3 mb-5 font-mono text-sm text-gray-300">
            {item.value?.substring(0, 40)}{(item.value?.length || 0) > 40 ? '...' : ''}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors">
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Xoá
          </button>
        </div>
      </motion.div>
    </>
  );
}

// Masked value component
function MaskedValue({ value }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const display = visible ? value : (value?.substring(0, 8) + '••••••••');

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-gray-300">{display}</span>
      <button
        onClick={() => setVisible(v => !v)}
        className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
        title={visible ? 'Ẩn' : 'Hiện'}
      >
        {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-green-400 transition-colors"
        title="Copy"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminInventory() {
  const { t } = useTranslation();

  // State
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const ITEMS_PER_PAGE = 20;

  // Load products list
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await getProducts({ limit: 100 });
        const list = res.data || [];
        setProducts(list);
        if (list.length > 0) {
          setSelectedProductId(list[0].id);
        }
      } catch (err) {
        toast.error('Không thể tải danh sách sản phẩm');
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  // Update selected product object
  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      const p = products.find(p => p.id === selectedProductId || p.id === parseInt(selectedProductId));
      setSelectedProduct(p || null);
      setCurrentPage(1);
    }
  }, [selectedProductId, products]);

  // Load inventory items
  const loadInventory = useCallback(async () => {
    if (!selectedProductId) return;
    setLoadingInventory(true);
    try {
      const res = await getInventoryByProduct(selectedProductId, {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: statusFilter || undefined,
      });
      // Normalize backend fields: content → value, extraData.type → type
      const rawItems = res.data || [];
      const items = rawItems.map(item => ({
        ...item,
        value: item.value ?? item.content ?? '',
        type: item.type ?? item.extraData?.type ?? 'LICENSE_KEY',
      }));
      setInventoryItems(items);
      setPagination(res.pagination || { total: items.length, totalPages: 1 });
    } catch (err) {
      toast.error('Không thể tải inventory');
      setInventoryItems([]);
    } finally {
      setLoadingInventory(false);
    }
  }, [selectedProductId, currentPage, statusFilter]);

  // Load inventory stats
  const loadStats = useCallback(async () => {
    if (!selectedProductId) return;
    setLoadingStats(true);
    try {
      const res = await getInventoryStats(selectedProductId);
      setStats(res.data || null);
    } catch {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [selectedProductId]);

  useEffect(() => {
    loadInventory();
    loadStats();
  }, [loadInventory, loadStats]);

  // Delete item
  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeletingId(deleteItem.id);
    try {
      await deleteInventoryItem(deleteItem.id);
      toast.success('Đã xoá item');
      setDeleteItem(null);
      loadInventory();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoá thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter items by search
  const filteredItems = search
    ? inventoryItems.filter(item =>
        item.value?.toLowerCase().includes(search.toLowerCase()) ||
        item.type?.toLowerCase().includes(search.toLowerCase())
      )
    : inventoryItems;

  // Stats cards data
  const statCards = [
    {
      label: 'Tổng items',
      value: stats?.total ?? 0,
      icon: Boxes,
      color: 'text-white',
      iconBg: 'bg-blue-500/10',
    },
    {
      label: 'Còn hàng',
      value: stats?.available ?? 0,
      icon: CheckCircle,
      color: 'text-green-400',
      iconBg: 'bg-green-500/10',
    },
    {
      label: 'Đã bán',
      value: stats?.sold ?? 0,
      icon: TrendingUp,
      color: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
    },
    {
      label: 'Cảnh báo kho',
      value: stats?.available <= 5 && stats?.available > 0 ? '⚠️ Thấp' : stats?.available === 0 ? '🚨 Hết' : '✅ Tốt',
      icon: AlertTriangle,
      color: stats?.available === 0 ? 'text-red-400' : stats?.available <= 5 ? 'text-amber-400' : 'text-green-400',
      iconBg: stats?.available === 0 ? 'bg-red-500/10' : stats?.available <= 5 ? 'bg-amber-500/10' : 'bg-green-500/10',
      isText: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Kho hàng</h1>
          <p className="text-gray-400 text-sm mt-1">Nạp hàng và theo dõi tồn kho theo sản phẩm</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { loadInventory(); loadStats(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
          <button
            onClick={() => setShowBulkAdd(true)}
            disabled={!selectedProductId}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
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
        <label className="block text-sm font-medium text-gray-400 mb-2">Chọn sản phẩm để xem kho</label>
        {loadingProducts ? (
          <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
        ) : (
          <select
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          >
            {products.length === 0 && <option value="">Chưa có sản phẩm</option>}
            {products.map(p => (
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
                  <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center ${card.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-3xl font-bold mt-4">{card.isText ? card.value : card.value.toLocaleString()}</p>
                  <p className="text-sm text-gray-400 mt-1">{card.label}</p>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="AVAILABLE">Còn hàng</option>
            <option value="SOLD">Đã bán</option>
            <option value="RESERVED">Đang giữ</option>
          </select>
          <span className="px-4 py-2.5 text-sm text-gray-400 bg-white/5 rounded-xl border border-white/5">
            {pagination.total} items
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Giá trị</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ngày thêm</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingInventory
                ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                : filteredItems.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                          <Package className="w-12 h-12 opacity-30" />
                          <p className="font-medium">
                            {selectedProductId ? 'Kho trống — hãy nạp hàng ngay!' : 'Chọn sản phẩm để xem kho'}
                          </p>
                          {selectedProductId && (
                            <button
                              onClick={() => setShowBulkAdd(true)}
                              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-sm font-medium hover:bg-blue-600 transition-colors text-white"
                            >
                              <Upload className="w-4 h-4" />
                              Nạp hàng ngay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                  : filteredItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300">
                          {ITEM_TYPES.find(t => t.value === item.type)?.icon}{' '}
                          {ITEM_TYPES.find(t => t.value === item.type)?.label || item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <MaskedValue value={item.value} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
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
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Trang {currentPage}/{pagination.totalPages} · {pagination.total} items
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showBulkAdd && selectedProduct && (
          <BulkAddModal
            product={selectedProduct}
            onClose={() => setShowBulkAdd(false)}
            onSuccess={() => { loadInventory(); loadStats(); }}
          />
        )}
        {deleteItem && (
          <ConfirmDeleteModal
            item={deleteItem}
            onClose={() => setDeleteItem(null)}
            onConfirm={handleDelete}
            loading={deletingId === deleteItem.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
