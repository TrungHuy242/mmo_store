import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Ticket, Plus, Search, Trash2, Calendar, DollarSign, Percent,
  Users, ShoppingCart, RefreshCw, X, Copy, Check, Clock, ChevronDown, Package
} from 'lucide-react';
import { couponApi } from '../../api/coupon.api.js';
import { productApi } from '../../api/index.js';

export default function Coupons() {
  const { t } = useTranslation();
  
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  // Products for selection
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isApplyToAll, setIsApplyToAll] = useState(true); // Default: apply to all products
  const [showProductSelector, setShowProductSelector] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    userLimit: '1',
    startsAt: '',
    expiresAt: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch products when modal opens
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await productApi.getAll({ limit: 100 }); // Get first 100 products
      setProducts(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Handle modal open
  const handleOpenModal = () => {
    setShowModal(true);
    fetchProducts();
  };

  // Load coupons
  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await couponApi.getAll();
      setCoupons(res.data?.data || res.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value,
    }));
  };

  // Handle create coupon
  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.value || !formData.expiresAt) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Validate product selection
    if (!isApplyToAll && selectedProductIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm áp dụng');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        value: parseFloat(formData.value),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        userLimit: formData.userLimit ? parseInt(formData.userLimit) : 1,
        startsAt: formData.startsAt || new Date().toISOString(),
        // Include productIds only if not applying to all
        productIds: isApplyToAll ? null : selectedProductIds,
      };

      await couponApi.create(payload);
      toast.success('Tạo mã giảm giá thành công');
      setShowModal(false);
      resetForm();
      loadCoupons();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Tạo mã giảm giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete coupon
  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return;
    
    try {
      await couponApi.delete(id);
      toast.success('Xóa mã giảm giá thành công');
      loadCoupons();
    } catch (err) {
      toast.error('Xóa mã giảm giá thất bại');
    }
  };

  // Copy code to clipboard
  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      type: 'PERCENTAGE',
      value: '',
      minOrderAmount: '',
      maxDiscount: '',
      usageLimit: '',
      userLimit: '1',
      startsAt: '',
      expiresAt: '',
    });
    setSelectedProductIds([]);
    setIsApplyToAll(true);
    setShowProductSelector(false);
  };

  // Get coupon status
  const getCouponStatus = (coupon) => {
    const now = new Date();
    const startsAt = new Date(coupon.startsAt);
    const expiresAt = new Date(coupon.expiresAt);
    
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { status: 'depleted', label: 'Hết lượt', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
    }
    if (now < startsAt) {
      return { status: 'scheduled', label: 'Sắp diễn ra', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    }
    if (now > expiresAt) {
      return { status: 'expired', label: 'Hết hạn', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
    }
    return { status: 'active', label: 'Đang hoạt động', color: 'bg-green-500/10 text-green-400 border-green-500/20' };
  };

  // Filter coupons
  const filteredCoupons = coupons.filter(coupon => 
    coupon.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mã Giảm Giá</h1>
          <p className="text-gray-300 text-sm mt-1">Quản lý mã giảm giá và khuyến mãi</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadCoupons()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
            aria-label="Làm mới mã giảm giá"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Làm mới
          </button>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            aria-label="Tạo mã giảm giá mới"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Tạo mã mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng mã', value: coupons.length, color: 'purple', icon: Ticket },
          { label: 'Đang hoạt động', value: coupons.filter(c => getCouponStatus(c).status === 'active').length, color: 'green', icon: Check },
          { label: 'Hết hạn', value: coupons.filter(c => getCouponStatus(c).status === 'expired').length, color: 'red', icon: Clock },
          { label: 'Hết lượt', value: coupons.filter(c => getCouponStatus(c).status === 'depleted').length, color: 'gray', icon: Users },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 p-5 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              </div>
              <span className="text-2xl font-bold">{loading ? '...' : stat.value}</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Tìm kiếm mã giảm giá..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors"
        />
      </div>

      {/* Coupons Table */}
      <div className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mã</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Giá trị</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Đơn tối thiểu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sử dụng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Thời hạn</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Đang tải...</p>
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                    <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Không có mã giảm giá nào</p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  const discountValue = coupon.type === 'PERCENTAGE' 
                    ? `${coupon.value}%` 
                    : `${Number(coupon.value).toLocaleString('vi-VN')}₫`;
                  
                  return (
                    <tr key={coupon.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded font-mono text-sm font-bold">
                            {coupon.code}
                          </code>
                          <button
                            onClick={() => copyCode(coupon.code, coupon.id)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            {copiedId === coupon.id ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                          coupon.type === 'PERCENTAGE' 
                            ? 'bg-blue-500/10 text-blue-400' 
                            : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {coupon.type === 'PERCENTAGE' ? (
                            <Percent className="w-3 h-3" />
                          ) : (
                            <DollarSign className="w-3 h-3" />
                          )}
                          {coupon.type === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-white">{discountValue}</span>
                        {coupon.maxDiscount && coupon.type === 'PERCENTAGE' && (
                          <span className="text-xs text-gray-500 block">
                            Tối đa: {Number(coupon.maxDiscount).toLocaleString('vi-VN')}₫
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-gray-400">
                          {coupon.minOrderAmount 
                            ? `${Number(coupon.minOrderAmount).toLocaleString('vi-VN')}₫` 
                            : 'Không có'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className={coupon.usedCount >= (coupon.usageLimit || Infinity) ? 'text-red-400' : 'text-gray-300'}>
                              {coupon.usedCount}
                            </span>
                            <span className="text-gray-500">/</span>
                            <span className="text-gray-400">{coupon.usageLimit || '∞'}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          Mỗi user: {coupon.userLimit || 1} lần
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-300">
                            <Calendar className="w-3 h-3" />
                            {new Date(coupon.startsAt).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <Clock className="w-3 h-3" />
                            {new Date(coupon.expiresAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-[#1a1f35] to-[#0f172a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Tạo mã giảm giá mới</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-5">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Mã giảm giá <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="VD: SUMMER2024"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-amber-500/50 transition-colors uppercase"
                    autoFocus
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Loại giảm giá <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'PERCENTAGE' }))}
                      className={`p-3 rounded-xl border transition-all ${
                        formData.type === 'PERCENTAGE'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-white/10 hover:border-white/20 text-gray-400'
                      }`}
                    >
                      <Percent className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">Phần trăm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'FIXED_AMOUNT' }))}
                      className={`p-3 rounded-xl border transition-all ${
                        formData.type === 'FIXED_AMOUNT'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-white/10 hover:border-white/20 text-gray-400'
                      }`}
                    >
                      <DollarSign className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">Số tiền cố định</span>
                    </button>
                  </div>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Giá trị giảm {formData.type === 'PERCENTAGE' ? '(%)' : '(VNĐ)'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    placeholder={formData.type === 'PERCENTAGE' ? '10' : '10000'}
                    min="0"
                    max={formData.type === 'PERCENTAGE' ? '100' : undefined}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                {/* Max Discount (for percentage) */}
                {formData.type === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Giảm tối đa (VNĐ)
                    </label>
                    <input
                      type="number"
                      name="maxDiscount"
                      value={formData.maxDiscount}
                      onChange={handleInputChange}
                      placeholder="50000"
                      min="0"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>
                )}

                {/* Min Order Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Đơn hàng tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    placeholder="100000"
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                {/* Usage Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Tổng lượt dùng
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit}
                      onChange={handleInputChange}
                      placeholder="Không giới hạn"
                      min="0"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Mỗi user
                    </label>
                    <input
                      type="number"
                      name="userLimit"
                      value={formData.userLimit}
                      onChange={handleInputChange}
                      placeholder="1"
                      min="1"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      name="startsAt"
                      value={formData.startsAt}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Ngày kết thúc <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      name="expiresAt"
                      value={formData.expiresAt}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Apply To - All Products or Specific Products */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Áp dụng cho
                  </label>
                  <div className="space-y-3">
                    {/* Toggle options */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsApplyToAll(true);
                          setShowProductSelector(false);
                          setSelectedProductIds([]);
                        }}
                        className={`p-3 rounded-xl border transition-all ${
                          isApplyToAll
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                            : 'border-white/10 hover:border-white/20 text-gray-400'
                        }`}
                      >
                        <ShoppingCart className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-sm font-medium">Toàn bộ cửa hàng</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsApplyToAll(false);
                          setShowProductSelector(true);
                        }}
                        className={`p-3 rounded-xl border transition-all ${
                          !isApplyToAll
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                            : 'border-white/10 hover:border-white/20 text-gray-400'
                        }`}
                      >
                        <Package className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-sm font-medium">Sản phẩm cụ thể</span>
                      </button>
                    </div>

                    {/* Selected products summary */}
                    {!isApplyToAll && selectedProductIds.length > 0 && (
                      <div className="text-sm text-amber-400/80 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Đã chọn {selectedProductIds.length} sản phẩm
                        <button
                          type="button"
                          onClick={() => setSelectedProductIds([])}
                          className="ml-auto text-gray-400 hover:text-white underline text-xs"
                        >
                          Bỏ chọn tất cả
                        </button>
                      </div>
                    )}

                    {/* Product Selector Dropdown */}
                    {showProductSelector && (
                      <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0f172a]">
                        <div className="p-3 border-b border-white/5 bg-white/5">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                              type="text"
                              placeholder="Tìm kiếm sản phẩm..."
                              className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                              onChange={(e) => {
                                // Filter products in dropdown
                                const searchInput = e.target.value.toLowerCase();
                                const productList = document.getElementById('product-list');
                                if (productList) {
                                  const items = productList.querySelectorAll('.product-item');
                                  items.forEach(item => {
                                    const name = item.dataset.name.toLowerCase();
                                    item.style.display = name.includes(searchInput) ? 'flex' : 'none';
                                  });
                                }
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto" id="product-list">
                          {loadingProducts ? (
                            <div className="p-4 text-center text-gray-500">
                              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                              <p className="text-sm">Đang tải sản phẩm...</p>
                            </div>
                          ) : products.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Không có sản phẩm nào</p>
                            </div>
                          ) : (
                            products.map((product) => {
                              const isSelected = selectedProductIds.includes(product.id);
                              return (
                                <div
                                  key={product.id}
                                  data-name={product.name}
                                  className="product-item flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedProductIds(prev => prev.filter(id => id !== product.id));
                                    } else {
                                      setSelectedProductIds(prev => [...prev, product.id]);
                                    }
                                  }}
                                >
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'bg-amber-500 border-amber-500'
                                      : 'border-gray-500'
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  {product.image && (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-10 h-10 rounded object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{product.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {Number(product.price || 0).toLocaleString('vi-VN')}đ
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Tạo mã
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
