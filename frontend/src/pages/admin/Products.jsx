import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Search, Filter, Plus, MoreHorizontal, Edit, Trash2, Eye,
  Copy, ToggleLeft, ToggleRight, Download, Upload, X, Image,
  Package, Grid, List, ChevronLeft, ChevronRight, Star, TrendingUp,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';

export default function AdminProducts() {
  const { t } = useTranslation();
  
  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const itemsPerPage = 10;

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const res = await adminApi.getCategories();
      const data = res.data?.data || res.data || [];
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // Load products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (search) params.search = search;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const res = await adminApi.getProducts(params);
      // Backend returns: { success, data: [...], pagination }
      const result = res.success ? res.data : (res.data?.data || res.data || []);
      const pagination = res.pagination || {};
      
      setProducts(Array.isArray(result) ? result : []);
      setTotal(pagination.total || (Array.isArray(result) ? result.length : 0));
      setTotalPages(pagination.totalPages || 1);
    } catch (err) {
      console.error('Failed to load products:', err);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, categoryFilter, statusFilter, t]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Delete product
  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    
    setDeletingId(id);
    try {
      await adminApi.deleteProduct(id);
      toast.success('Đã xóa sản phẩm');
      loadProducts();
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  // Toggle product status
  const handleToggleStatus = async (product) => {
    try {
      await adminApi.updateProduct(product.id, { isActive: !product.isActive });
      toast.success(product.isActive ? 'Đã vô hiệu hóa' : 'Đã kích hoạt');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  // Add product success handler
  const handleAddSuccess = () => {
    loadProducts();
    loadCategories();
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.products')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('admin.manage_products_title')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadProducts()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" />
            {t('admin.export')}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('admin.add_product')}
          </button>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => { setCategoryFilter('all'); setCurrentPage(1); }}
          className={`p-4 rounded-xl border transition-all ${
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
            onClick={() => { setCategoryFilter(cat.id); setCurrentPage(1); }}
            className={`p-4 rounded-xl border transition-all ${
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

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          >
            <option value="all">{t('admin.all_categories')}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          >
            <option value="all">{t('admin.all_status_admin')}</option>
            <option value="active">{t('admin.active')}</option>
            <option value="inactive">{t('admin.inactive')}</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
            <span className="text-sm text-blue-400">{selectedProducts.length} {t('admin.selected')}</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors">
                {t('admin.activate')}
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors">
                {t('admin.delete')}
              </button>
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
        transition={{ delay: 0.1 }}
        className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden"
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-4">{t('common.loading')}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-600" />
            <p className="text-gray-400 mt-4">Chưa có sản phẩm nào</p>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.product')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.category')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('common.price')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.stock')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.sales')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.rating')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.status')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">{t('admin.actions')}</th>
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
                        onClick={() => setSelectedProduct(product)}
                        className="flex items-center gap-3 group"
                      >
                        <img
                          src={product.thumbnail || product.image || `https://picsum.photos/seed/${product.id}/100/100`}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium group-hover:text-blue-400 transition-colors">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.createdAt ? new Date(product.createdAt).toLocaleDateString('vi-VN') : ''}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 text-xs bg-white/5 rounded-lg">{product.category?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium">{Number(product.price).toLocaleString('vi-VN')}₫</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${product.stock <= 5 ? 'text-red-400' : 'text-green-400'}`}>
                          {product.stock}
                        </span>
                        {product.stock <= 5 && <span className="text-xs text-red-400">{t('admin.low')}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-sm">{product.salesCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm">{product.rating || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`relative w-10 h-6 rounded-full transition-colors ${
                          product.isActive ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          product.isActive ? 'left-5' : 'left-1'
                        }`} />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title={t('admin.view')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title={t('admin.edit')}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title={t('admin.duplicate')}>
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                          title={t('admin.delete')}
                        >
                          {deletingId === product.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
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
                    src={product.thumbnail || product.image || `https://picsum.photos/seed/${product.id}/100/100`}
                    alt={product.name}
                    className="w-full h-40 object-cover"
                  />
                  {!product.isActive && (
                    <span className="absolute top-2 left-2 px-2 py-1 text-xs bg-gray-500 text-white rounded-lg">
                      Vô hiệu hóa
                    </span>
                  )}
                  {product.stock <= 5 && (
                    <span className="absolute top-2 right-2 px-2 py-1 text-xs bg-red-500 text-white rounded-lg">
                      {t('admin.low_stock_items')}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-xs text-gray-500">{product.category?.name}</span>
                  <h3 className="font-medium mt-1 group-hover:text-blue-400 transition-colors line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold">{Number(product.price).toLocaleString('vi-VN')}₫</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm">{product.rating || '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <span className={`text-xs ${product.stock > 10 ? 'text-green-400' : 'text-red-400'}`}>
                      {t('admin.stock')}: {product.stock}
                    </span>
                    <span className="text-xs text-gray-500">{(product.salesCount || 0)} {t('products.sold').toLowerCase()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
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
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
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

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddProductModal
            categories={categories}
            onClose={() => setShowAddModal(false)}
            onSuccess={handleAddSuccess}
          />
        )}
      </AnimatePresence>

      {/* Product Preview */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductPreview
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onManageStock={() => {
              setSelectedProduct(null);
              // Navigate to inventory with product
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.price || !form.categoryId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    setLoading(true);
    const toastId = toast.loading('Đang tạo sản phẩm...');
    
    try {
      await adminApi.createProduct({
        name: form.name,
        categoryId: form.categoryId,
        price: parseFloat(form.price),
        description: form.description,
        imageUrl: form.thumbnail,
        productType: form.productType,
      });
      
      toast.success('Đã tạo sản phẩm thành công', { id: toastId });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tạo sản phẩm thất bại', { id: toastId });
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ paddingTop: 'env(safe-area-inset-top, 64px)' }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#111827] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
            <h2 className="text-lg font-semibold">{t('admin.add_product')}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('admin.product_name')} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                  placeholder={t('admin.enter_product_name')}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('admin.category')} *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                    required
                  >
                    <option value="">{t('admin.select_category')}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('admin.price_vnd')} *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Loại sản phẩm</label>
                <select
                  value={form.productType}
                  onChange={(e) => setForm({ ...form, productType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                >
                  <option value="digital">Digital (File, Tool)</option>
                  <option value="account">Account (Tài khoản)</option>
                  <option value="license">License (Key bản quyền)</option>
                </select>
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('admin.product_description')}</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                rows={3}
                placeholder={t('admin.product_description')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('admin.image_url')}</label>
              <input
                type="text"
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
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
        </div>
      </motion.div>
    </>
  );
}

function ProductPreview({ product, onClose, onManageStock }) {
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
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#111827] border-l border-white/10 shadow-2xl z-50 overflow-hidden"
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('admin.product_details')}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <img
              src={product.thumbnail || product.image || `https://picsum.photos/seed/${product.id}/100/100`}
              alt={product.name}
              className="w-full h-48 object-cover rounded-xl mb-6"
            />
            <h3 className="text-xl font-bold">{product.name}</h3>
            <span className="inline-block px-2 py-1 text-xs bg-white/5 rounded-lg mt-2">{product.category?.name || '—'}</span>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-gray-500">{t('common.price')}</p>
                <p className="text-lg font-bold text-green-400">{Number(product.price).toLocaleString('vi-VN')}₫</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-gray-500">{t('admin.stock')}</p>
                <p className={`text-lg font-bold ${product.stock <= 5 ? 'text-red-400' : 'text-green-400'}`}>{product.stock}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-gray-500">{t('admin.sales')}</p>
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
              <div className="mt-6">
                <p className="text-xs text-gray-500 mb-2">Mô tả</p>
                <p className="text-sm text-gray-300">{product.description}</p>
              </div>
            )}

            <div className="mt-6">
              <p className="text-xs text-gray-500 mb-2">{t('admin.created')}</p>
              <p className="text-sm">{product.createdAt ? new Date(product.createdAt).toLocaleString('vi-VN') : '—'}</p>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-white/5 flex gap-3">
            <button className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors">
              {t('admin.edit')}
            </button>
            <button className="flex-1 px-4 py-2 rounded-xl bg-blue-500 text-sm font-medium hover:bg-blue-600 transition-colors">
              {t('admin.manage_stock')}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
