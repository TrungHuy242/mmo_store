import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, FileText, Archive, FileCode, File, Download, Search, Filter, RefreshCw, X, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { assetApi, productApi } from '../../api';
import { SkeletonTable } from '../../components/ui';

// Format file size to human readable
const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes === null || bytes === undefined) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file icon based on type
const getFileIcon = (type) => {
  switch (type) {
    case 'ZIP':
    case 'RAR':
      return <Archive className="w-5 h-5" />;
    case 'SOURCE_CODE':
      return <FileCode className="w-5 h-5" />;
    case 'CSV':
    case 'TXT':
      return <FileText className="w-5 h-5" />;
    default:
      return <File className="w-5 h-5" />;
  }
};

// Get color class for file type
const getTypeColor = (type) => {
  switch (type) {
    case 'ZIP':
    case 'RAR':
      return 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30';
    case 'SOURCE_CODE':
      return 'text-neon-magenta bg-neon-magenta/10 border-neon-magenta/30';
    case 'CSV':
    case 'TXT':
      return 'text-neon-gold bg-neon-gold/10 border-neon-gold/30';
    default:
      return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
  }
};

export default function Assets() {
  const { t } = useTranslation();
  const [assets, setAssets] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Modal states
  const [deleteModal, setDeleteModal] = useState({ open: false, asset: null });
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProductId, setUploadProductId] = useState('');

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search) params.search = search;
      if (filterProduct) params.productId = filterProduct;
      if (filterType) params.type = filterType;

      const res = await assetApi.getAll(params);
      const data = res.data?.data || res.data || [];
      setAssets(data);
      
      // Update pagination from response
      if (res.data?.pagination) {
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch assets:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      toast.error(t('toasts.assets_load_failed'));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, filterProduct, filterType]);

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const res = await productApi.getAll({ page: 1, limit: 100 });
      const data = res.data?.data || res.data || [];
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !uploadProductId) {
      toast.error(t('toasts.select_file_and_product'));
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('productId', uploadProductId);

      await assetApi.upload(formData);
      toast.success(t('toasts.asset_uploaded'));
      setUploadModal(false);
      setSelectedFile(null);
      setUploadProductId('');
      fetchAssets();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.error || 'Tải lên thất bại');
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteModal.asset) return;

    try {
      await assetApi.delete(deleteModal.asset.id);
      toast.success(t('toasts.asset_deleted'));
      setDeleteModal({ open: false, asset: null });
      fetchAssets();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error.response?.data?.error || 'Xóa thất bại');
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fileTypes = ['ZIP', 'RAR', 'SOURCE_CODE', 'CSV', 'TXT', 'OTHER'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý tài liệu số</h1>
          <p className="text-gray-300 text-sm mt-1">Quản lý các file tài liệu, tài sản số của sản phẩm</p>
        </div>
        <button
          onClick={() => setUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-xl hover:bg-neon-cyan/20 transition-all"
          aria-label="Tải lên tệp mới"
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          Tải lên tệp mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="glass p-4 rounded-xl border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
              <File className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <p className="text-gray-300 text-xs uppercase tracking-wider">Tổng tài liệu</p>
              <p className="text-xl font-bold text-white">{pagination.total}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          className="glass p-4 rounded-xl border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neon-magenta/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-neon-magenta" />
            </div>
            <div>
              <p className="text-gray-300 text-xs uppercase tracking-wider">Tổng lượt tải</p>
              <p className="text-xl font-bold text-white">
                {assets.reduce((sum, a) => sum + (a.downloadCount || 0), 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="glass p-4 rounded-xl border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neon-gold/10 flex items-center justify-center">
              <Archive className="w-5 h-5 text-neon-gold" />
            </div>
            <div>
              <p className="text-gray-300 text-xs uppercase tracking-wider">Tổng dung lượng</p>
              <p className="text-xl font-bold text-white">
                {formatFileSize(assets.reduce((sum, a) => sum + (a.fileSize || 0), 0))}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="glass p-4 rounded-xl border border-white/10">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Tìm kiếm tên file..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
            />
          </div>

          {/* Product Filter */}
          <div className="w-full md:w-48">
            <select
              value={filterProduct}
              onChange={(e) => {
                setFilterProduct(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-cyan/50"
            >
              <option value="">Tất cả sản phẩm</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="w-full md:w-40">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-cyan/50"
            >
              <option value="">Tất cả loại</option>
              {fileTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchAssets}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Assets Table */}
      <div className="glass rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Tên tệp</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Loại</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Sản phẩm</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Kích thước</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Lượt tải</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Ngày tải lên</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7}><div className="py-12"><SkeletonTable rows={8} cols={7} /></div></td></tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <File className="w-12 h-12 opacity-30" aria-hidden="true" />
                      <p>Chưa có tài liệu nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                assets.map((asset, index) => (
                  <motion.tr
                    key={asset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(asset.type)}`}>
                          {getFileIcon(asset.type)}
                        </div>
                        <div>
                          <p className="text-white font-medium truncate max-w-[200px]">{asset.originalName || asset.name}</p>
                          {asset.version > 1 && (
                            <p className="text-xs text-gray-300">v{asset.version}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getTypeColor(asset.type)}`}>
                        {asset.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-300 text-sm truncate max-w-[150px]" title={asset.product?.name}>
                        {asset.product?.name || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-300 text-sm">{formatFileSize(asset.fileSize)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-300 text-sm">{asset.downloadCount || 0}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-300 text-sm">{formatDate(asset.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDeleteModal({ open: true, asset })}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all"
                          title="Xóa"
                          aria-label={`Xóa ${asset.originalName || asset.name}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-300">
              Trang {pagination.page} / {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass w-full max-w-md rounded-2xl border border-white/20 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Tải lên tệp mới</h3>
                <button
                  onClick={() => setUploadModal(false)}
                  className="p-1 text-gray-400 hover:text-white"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Product Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sản phẩm liên kết
                  </label>
                  <select
                    value={uploadProductId}
                    onChange={(e) => setUploadProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-cyan/50"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* File Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Chọn tệp
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      selectedFile
                        ? 'border-neon-cyan/50 bg-neon-cyan/5'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => document.getElementById('file-input').click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      accept=".zip,.rar,.txt,.csv,.json,.js,.html,.pdf"
                    />
                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        {getFileIcon(assetApi.getFileType?.(selectedFile.name) || 'OTHER')}
                        <p className="text-white font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Xóa
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-500" />
                        <p className="text-gray-400">Click để chọn hoặc kéo thả file</p>
                        <p className="text-xs text-gray-500">.zip, .rar, .txt, .csv, .json, .js, .html, .pdf</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || !uploadProductId || uploading}
                  className="flex-1 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-xl hover:bg-neon-cyan/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang tải lên...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Tải lên
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteModal({ open: false, asset: null })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass w-full max-w-md rounded-2xl border border-white/20 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-white">Xác nhận xóa</h3>
              </div>

              <p className="text-gray-300 mb-2">
                Bạn có chắc chắn muốn xóa tài liệu này?
              </p>

              <div className="glass p-3 rounded-lg border border-white/10 mb-6">
                <p className="text-white font-medium truncate">{deleteModal.asset?.originalName}</p>
                <p className="text-sm text-gray-300">{formatFileSize(deleteModal.asset?.fileSize)}</p>
              </div>

              <p className="text-sm text-red-400 mb-6">
                ⚠️ Hành động này không thể hoàn tác. File sẽ bị xóa vĩnh viễn.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ open: false, asset: null })}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  Xóa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
