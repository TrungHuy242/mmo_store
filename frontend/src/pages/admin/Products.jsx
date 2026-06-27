import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Search, Plus, MoreHorizontal, Edit, Trash2, Eye,
  Copy, Download, X, Package, Grid, List, Star, TrendingUp,
  RefreshCw, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';
import { useAdminData, usePaginatedData } from '../../hooks/useAdminData';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { SkeletonTable } from '../../components/ui';

const ITEMS_PER_PAGE = 10;

const PRODUCT_TYPES = [
  { value: 'digital', label: 'Digital (File, Tool)' },
  { value: 'account', label: 'Account (Tài khoản)' },
  { value: 'license', label: 'License (Key bản quyền)' },
];

const STATUS_OPTIONS = [
  { value: 'all', key: 'admin.all_status_admin' },
  { value: 'active', key: 'admin.active' },
  { value: 'inactive', key: 'admin.inactive' },
];

const FALLBACK_IMG = (id) => `https://picsum.photos/seed/${id}/100/100`;

function AddProductModal({ categories, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    price: '',
    description: '',
    thumbnail: '',
    productType: 'digital',
  });

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) {
      toast.error(t('admin.fill_required_fields', 'Vui lòng điền đầy đủ thông tin bắt buộc'));
      return;
    }
    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) {
      toast.error('Giá không hợp lệ');
      return;
    }
    setLoading(true);
    const toastId = toast.loading(t('admin.creating_product', 'Đang tạo sản phẩm...'));
    try {
      await adminApi.createProduct({
        name: form.name,
        categoryId: form.categoryId,
        price,
        description: form.description,
        imageUrl: form.thumbnail,
        productType: form.productType,
      });
      toast.success(t('admin.product_created', 'Đã tạo sản phẩm thành công'), { id: toastId });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.create_failed', 'Tạo sản phẩm thất bại'), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('admin.add_product')}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            {t('admin.product_name')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            placeholder={t('admin.enter_product_name')}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('admin.category')} <span className="text-red-400">*</span>
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white cursor-pointer"
              required
            >
              <option value="">{t('admin.select_category')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('admin.price_vnd')} <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              placeholder="0"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Loại sản phẩm</label>
          <select
            value={form.productType}
            onChange={(e) => handleChange('productType', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white cursor-pointer"
          >
            {PRODUCT_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('admin.product_description')}</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('admin.image_url')}</label>
          <input
            type="text"
            value={form.thumbnail}
            onChange={(e) => handleChange('thumbnail', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            placeholder="https://..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors">
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-blue-500 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {t('admin.create_product')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProductPreview({ product, onClose }) {
  const { t } = useTranslation();
  return (
    <Modal isOpen onClose={onClose} title={t('admin.product_details')} size="lg">
      <div className="space-y-5">
        <img
          src={product.thumbnail || product.image || FALLBACK_IMG(product.id)}
          alt={product.name}
          className="w-full h-48 object-cover rounded-xl"
        />
        <div>
          <span className="inline-block px-2 py-1 text-xs bg-white/5 rounded-lg">{product.category?.name || '—'}</span>
          <h3 className="text-xl font-bold mt-2">{product.name}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-300">{t('common.price')}</p>
            <p className="text-lg font-bold text-green-400">{Number(product.price || 0).toLocaleString('vi-VN')}₫</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-300">{t('admin.stock')}</p>
            <p className={`text-lg font-bold ${product.stock <= 5 ? 'text-red-400' : 'text-green-400'}`}>
              {product.stock ?? 0}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-300">{t('admin.sales')}</p>
            <p className="text-lg font-bold">{product.salesCount || 0}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500">{t('admin.rating')}</p>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-lg font-bold">{product.rating || '—'}</span>
            </div>
          </div>
        </div>

        {product.description && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Mô tả</p>
            <p className="text-sm text-gray-300">{product.description}</p>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-500 mb-1">{t('admin.created')}</p>
          <p className="text-sm">{product.createdAt ? new Date(product.createdAt).toLocaleString('vi-VN') : '—'}</p>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminProducts() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Categories
  const {
    data: categoriesData,
    load: reloadCategories,
  } = useAdminData(() => adminApi.getCategories(), { autoLoad: true });
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  // Products with pagination
  const {
    data: products,
    loading,
    page,
    totalPages,
    total,
    changePage,
    updateParams,
    reload: reloadProducts,
  } = usePaginatedData(
    (params) => adminApi.getProducts({ limit: ITEMS_PER_PAGE, ...params }),
    { limit: ITEMS_PER_PAGE },
    { autoLoad: true }
  );

  // Re-fetch products whenever filters change
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (categoryFilter !== 'all') params.category = categoryFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    updateParams(params);
  }, [search, categoryFilter, statusFilter, updateParams]);

  // Reset selection when product list changes
  useEffect(() => {
    setSelectedProducts([]);
  }, [products]);

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setActionLoading(deleteProduct.id);
    try {
      await adminApi.deleteProduct(deleteProduct.id);
      toast.success(t('admin.product_deleted', 'Đã xóa sản phẩm'));
      setDeleteProduct(null);
      reloadProducts();
      reloadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.delete_failed', 'Xóa thất bại'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (product) => {
    setActionLoading(product.id);
    try {
      await adminApi.updateProduct(product.id, { isActive: !product.isActive });
      toast.success(product.isActive ? t('admin.deactivated') : t('admin.activated'));
      reloadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.update_failed'));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length && products.length > 0) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.products')}</h1>
          <p className="text-gray-300 text-sm mt-1">{t('admin.manage_products_title')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { reloadProducts(); reloadCategories(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
            aria-label={t('admin.refresh_products', 'Làm mới sản phẩm')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {t('admin.refresh')}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm font-medium transition-colors"
            aria-label={t('admin.add_product')}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {t('admin.add_product')}
          </button>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`p-4 rounded-xl border transition-all text-left ${
            categoryFilter === 'all'
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : 'bg-[#111827] border-white/5 text-gray-400 hover:border-white/10'
          }`}
        >
          <span className="text-2xl">📦</span>
          <p className="text-sm font-medium mt-2">{t('common.all')}</p>
          <p className="text-xs text-gray-500">{total} {t('admin.products').toLowerCase()}</p>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`p-4 rounded-xl border transition-all text-left ${
              categoryFilter === cat.id
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-[#111827] border-white/5 text-gray-400 hover:border-white/10'
            }`}
          >
            <span className="text-2xl">📁</span>
            <p className="text-sm font-medium mt-2">{cat.name}</p>
            <p className="text-xs text-gray-500">{cat.productCount || 0} {t('admin.products').toLowerCase()}</p>
          </button>
        ))}
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white cursor-pointer"
          >
            <option value="all">{t('admin.all_categories')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
              aria-label="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {selectedProducts.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
            <span className="text-sm text-blue-400">{selectedProducts.length} {t('admin.selected')}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedProducts([])}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors"
              >
                {t('admin.clear')}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Products Table/Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden"
      >
        {loading ? (
          <SkeletonTable rows={8} cols={7} />
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-500" aria-hidden="true" />
            <p className="text-gray-300 mt-4">{t('admin.no_products_yet', 'Chưa có sản phẩm nào')}</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-500 text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Thêm sản phẩm đầu tiên
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.product')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.category')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('common.price')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.stock')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.sales')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.rating')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.status')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setPreviewProduct(product)}
                        className="flex items-center gap-3 group text-left"
                      >
                        <img
                          src={product.thumbnail || product.image || FALLBACK_IMG(product.id)}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium group-hover:text-blue-400 transition-colors">{product.name}</p>
                          <p className="text-xs text-gray-300">
                            {product.createdAt ? new Date(product.createdAt).toLocaleDateString('vi-VN') : ''}
                          </p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 text-xs bg-white/5 rounded-lg">{product.category?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium">{Number(product.price || 0).toLocaleString('vi-VN')}₫</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${product.stock <= 5 ? 'text-red-400' : 'text-green-400'}`}>
                          {product.stock ?? 0}
                        </span>
                        {product.stock <= 5 && product.stock >= 0 && (
                          <AlertTriangle className="w-3 h-3 text-red-400" aria-hidden="true" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" aria-hidden="true" />
                        <span className="text-sm">{product.salesCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" aria-hidden="true" />
                        <span className="text-sm">{product.rating || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        disabled={actionLoading === product.id}
                        className={`relative w-10 h-6 rounded-full transition-colors disabled:opacity-50 ${
                          product.isActive ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={!!product.isActive}
                        aria-label={product.isActive ? t('admin.deactivate', 'Vô hiệu hóa') : t('admin.activate', 'Kích hoạt')}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          product.isActive ? 'left-5' : 'left-1'
                        }`} />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewProduct(product)}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title={t('admin.view')}
                          aria-label={`${t('admin.view')} ${product.name}`}
                        >
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDeleteProduct(product)}
                          disabled={actionLoading === product.id}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                          title={t('admin.delete')}
                          aria-label={`${t('admin.delete')} ${product.name}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 rounded-xl border border-white/5 overflow-hidden hover:border-white/10 transition-colors group"
              >
                <div className="relative">
                  <img
                    src={product.thumbnail || product.image || FALLBACK_IMG(product.id)}
                    alt={product.name}
                    className="w-full h-40 object-cover"
                  />
                  {!product.isActive && (
                    <span className="absolute top-2 left-2 px-2 py-1 text-xs bg-gray-500 text-white rounded-lg">
                      Vô hiệu hóa
                    </span>
                  )}
                  {product.stock <= 5 && product.stock >= 0 && (
                    <span className="absolute top-2 right-2 px-2 py-1 text-xs bg-red-500 text-white rounded-lg">
                      {t('admin.low_stock_items')}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-xs text-gray-400">{product.category?.name || '—'}</span>
                  <h3 className="font-medium mt-1 group-hover:text-blue-400 transition-colors line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold">{Number(product.price || 0).toLocaleString('vi-VN')}₫</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm">{product.rating || '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <span className={`text-xs ${product.stock > 5 ? 'text-green-400' : 'text-red-400'}`}>
                      {t('admin.stock')}: {product.stock ?? 0}
                    </span>
                    <span className="text-xs text-gray-300">{product.salesCount || 0} {t('products.sold').toLowerCase()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="px-4 py-3 border-t border-white/5">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={changePage} />
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddProductModal
            categories={categories}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => { reloadProducts(); reloadCategories(); }}
          />
        )}
        {previewProduct && (
          <ProductPreview
            product={previewProduct}
            onClose={() => setPreviewProduct(null)}
          />
        )}
        {deleteProduct && (
          <ConfirmModal
            isOpen
            onClose={() => setDeleteProduct(null)}
            onConfirm={handleDelete}
            title="Xoá sản phẩm?"
            message={`Sản phẩm "${deleteProduct.name}" sẽ bị xóa. Hành động này không thể hoàn tác.`}
            confirmLabel="Xoá"
            loading={actionLoading === deleteProduct.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}