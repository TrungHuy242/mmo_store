import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Key, Plus, Search, RefreshCw, X, Copy, Check, Shield, 
  ShieldOff, Ban, Unlock, Monitor, Globe, Mail, Hash,
  ChevronDown, Loader2, AlertCircle
} from 'lucide-react';
import { licenseApi } from '../../api/license.api.js';
import { productApi } from '../../api/product.api.js';

export default function Licenses() {
  const { t } = useTranslation();
  
  // State
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, blacklisted: 0, expired: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  // Generate form
  const [generateForm, setGenerateForm] = useState({
    productId: '',
    count: 10,
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Search & filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      const res = await productApi.getAll({ isActive: true, limit: 100 });
      const productList = res.data?.data || res.data || [];
      // Filter only license-type products
      const licenseProducts = productList.filter(p => p.productType === 'license');
      setProducts(licenseProducts);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Load licenses for selected product
  const loadLicenses = useCallback(async () => {
    if (!selectedProduct) {
      setLicenses([]);
      return;
    }
    
    setLoading(true);
    try {
      const res = await licenseApi.getForProduct(selectedProduct.id, { limit: 100 });
      setLicenses(res.data?.data || res.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách license keys');
    } finally {
      setLoading(false);
    }
  }, [selectedProduct]);

  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

  // Load statistics
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await licenseApi.getStatistics(selectedProduct?.id);
      setStats(res.data?.data || res.data || { total: 0, active: 0, inactive: 0, blacklisted: 0, expired: 0 });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [selectedProduct]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Handle generate keys
  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!generateForm.productId || !generateForm.count) {
      toast.error('Vui lòng chọn sản phẩm và số lượng');
      return;
    }

    setSubmitting(true);
    try {
      const res = await licenseApi.generate({
        productId: generateForm.productId,
        count: parseInt(generateForm.count),
      });
      
      toast.success(res.data?.message || `Đã tạo ${generateForm.count} license keys`);
      setShowGenerateModal(false);
      setGenerateForm({ productId: '', count: 10 });
      
      // Refresh data
      loadLicenses();
      loadStats();
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Tạo license keys thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deactivate
  const handleDeactivate = async (licenseId) => {
    if (!confirm('Bạn có chắc muốn vô hiệu hóa license key này?')) return;
    
    try {
      await licenseApi.deactivate(licenseId);
      toast.success('Đã vô hiệu hóa license key');
      loadLicenses();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Vô hiệu hóa thất bại');
    }
  };

  // Handle blacklist
  const handleBlacklist = async (licenseId) => {
    if (!confirm('Bạn có chắc muốn đưa license key này vào danh sách đen?')) return;
    
    try {
      await licenseApi.blacklist(licenseId);
      toast.success('Đã đưa vào danh sách đen');
      loadLicenses();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Thao tác thất bại');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const [copiedId, setCopiedId] = useState(null);

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: { class: 'bg-green-500/10 text-green-400 border-green-500/20', icon: Shield, label: 'Đang hoạt động' },
      INACTIVE: { class: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: Unlock, label: 'Chưa kích hoạt' },
      BLACKLISTED: { class: 'bg-red-500/10 text-red-400 border-red-500/20', icon: Ban, label: 'Bị khóa' },
      EXPIRED: { class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertCircle, label: 'Hết hạn' },
    };
    const badge = badges[status] || badges.INACTIVE;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border ${badge.class}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  // Filter licenses
  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.key.toLowerCase().includes(search.toLowerCase()) ||
      license.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      license.hwid?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || license.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">License Keys</h1>
          <p className="text-gray-300 text-sm mt-1">Quản lý license keys cho sản phẩm</p>
        </div>
        <button 
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Tạo Keys hàng loạt
        </button>
      </div>

      {/* Product Selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-400 mb-2">Chọn sản phẩm</label>
        <button
          onClick={() => setShowProductDropdown(!showProductDropdown)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#111827] border border-white/10 text-left hover:border-indigo-500/50 transition-colors"
        >
          <span className={selectedProduct ? 'text-white' : 'text-gray-500'}>
            {selectedProduct ? selectedProduct.name : 'Chọn sản phẩm license...'}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {showProductDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-20 w-full mt-2 bg-[#1a1f35] border border-white/10 rounded-xl shadow-xl max-h-64 overflow-y-auto"
            >
              {products.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Không có sản phẩm license
                </div>
              ) : (
                products.map(product => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowProductDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between ${
                      selectedProduct?.id === product.id ? 'bg-indigo-500/10' : ''
                    }`}
                  >
                    <span className="text-white">{product.name}</span>
                    <span className="text-xs text-gray-500">Stock: {product.stock || 0}</span>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Tổng Keys', value: stats.total, color: 'indigo', icon: Key },
          { label: 'Đã kích hoạt', value: stats.active, color: 'green', icon: Shield },
          { label: 'Chưa dùng', value: stats.inactive, color: 'gray', icon: Unlock },
          { label: 'Bị khóa', value: stats.blacklisted, color: 'red', icon: Ban },
          { label: 'Hết hạn', value: stats.expired, color: 'amber', icon: AlertCircle },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }}
            className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
              </div>
              {loadingStats ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              ) : (
                <span className="text-xl font-bold">{stat.value}</span>
              )}
            </div>
            <p className="text-gray-400 text-xs">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm theo key, email, HWID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Chưa kích hoạt</option>
          <option value="BLACKLISTED">Bị khóa</option>
          <option value="EXPIRED">Hết hạn</option>
        </select>
        <button 
          onClick={() => { loadLicenses(); loadStats(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
          aria-label="Làm mới"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {/* Licenses Table */}
      <div className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Khách hàng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Thiết bị (HWID)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IP kích hoạt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ngày kích hoạt</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!selectedProduct ? (
                <tr>
                  <td colSpan="7" className="px-4 py-16 text-center text-gray-500">
                    <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Vui lòng chọn sản phẩm để xem license keys</p>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Đang tải...</p>
                  </td>
                </tr>
              ) : filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                    <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Không có license key nào</p>
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((license) => (
                  <tr key={license.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded font-mono text-xs font-bold">
                          {license.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(license.key, license.id)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          {copiedId === license.id ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(license.status)}
                    </td>
                    <td className="px-4 py-4">
                      {license.user ? (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-300">{license.user.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {license.hwid ? (
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-gray-500" />
                          <code className="text-xs text-gray-400 font-mono">{license.hwid.slice(0, 16)}...</code>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {license.ipAddress ? (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-400">{license.ipAddress}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {license.activatedAt ? (
                        <span className="text-sm text-gray-300">
                          {new Date(license.activatedAt).toLocaleDateString('vi-VN')}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {license.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleDeactivate(license.id)}
                              className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                              title="Vô hiệu hóa"
                              aria-label={`Vô hiệu hóa license ${license.key}`}
                            >
                              <Unlock className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => handleBlacklist(license.id)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Đưa vào danh sách đen"
                              aria-label={`Đưa vào danh sách đen license ${license.key}`}
                            >
                              <Ban className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </>
                        )}
                        {license.status === 'INACTIVE' && (
                          <button
                            onClick={() => handleBlacklist(license.id)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Đưa vào danh sách đen"
                            aria-label={`Đưa vào danh sách đen license ${license.key}`}
                          >
                            <ShieldOff className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowGenerateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-[#1a1f35] to-[#0f172a] rounded-2xl border border-white/10 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                    Tạo Keys hàng loạt
                  </h2>
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Đóng"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleGenerate} className="p-6 space-y-5">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sản phẩm <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={generateForm.productId}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
                    required
                  >
                    <option value="">Chọn sản phẩm...</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>

                {/* Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Số lượng keys cần tạo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={generateForm.count}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="1000"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 1000 keys mỗi lần tạo</p>
                </div>

                {/* Info */}
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-indigo-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-indigo-300 font-medium mb-1">License Key Format</p>
                      <p className="text-gray-400 font-mono">XXXX-XXXX-XXXX-XXXX</p>
                      <p className="text-gray-500 text-xs mt-2">
                        Sau khi tạo, stock của sản phẩm sẽ được tự động tăng.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Tạo Keys
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
