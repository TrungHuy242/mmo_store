import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Star, Search, Trash2, RefreshCw, MessageSquare, X,
  ChevronDown, Filter, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import { reviewApi } from '../../api/review.api.js';
import { SkeletonTable } from '../../components/ui';
import { productApi } from '../../api/index.js';

// Star Rating Component
function StarRating({ rating, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-600 text-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

// Reply Modal
function ReplyModal({ review, onClose, onReply }) {
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      await onReply(review.id, replyContent);
      toast.success('Đã gửi phản hồi');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gửi phản hồi thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gradient-to-br from-[#1a1f35] to-[#0f172a] rounded-2xl border border-white/10 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Phản hồi đánh giá</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Review Info */}
        <div className="p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-start gap-3">
            {review.user?.avatar ? (
              <img
                src={review.user.avatar}
                alt={review.user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center" aria-hidden="true">
                <span className="text-primary font-semibold">
                  {review.user?.name?.[0] || review.user?.email?.[0] || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-white">{review.user?.name || 'Khách hàng'}</p>
              <p className="text-xs text-gray-300">{review.user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-200 bg-black/20 rounded-lg p-3">
            {review.content}
          </p>
        </div>

        {/* Reply Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nội dung phản hồi
          </label>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Viết phản hồi của bạn..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
            autoFocus
          />
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!replyContent.trim() || submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              Gửi phản hồi
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Reviews() {
  const { t } = useTranslation();

  // State
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [starFilter, setStarFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [replyReview, setReplyReview] = useState(null);

  const itemsPerPage = 10;

  // Load products for filter
  const loadProducts = useCallback(async () => {
    try {
      const res = await productApi.getAll({ limit: 100 });
      setProducts(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, []);

  // Load reviews
  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (search) params.search = search;
      if (starFilter !== 'all') params.rating = parseInt(starFilter);
      if (productFilter !== 'all') params.productId = productFilter;

      const res = await reviewApi.getByProduct(productFilter !== 'all' ? productFilter : undefined, params);
      const data = res.data?.data || res.data || [];
      const pagination = res.data?.pagination || {};

      // If using admin endpoint that returns all reviews
      if (Array.isArray(data)) {
        setReviews(data);
        setTotal(pagination.total || data.length);
        setTotalPages(pagination.totalPages || 1);
      } else {
        setReviews(data.reviews || data.items || []);
        setTotal(pagination.total || 0);
        setTotalPages(pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      toast.error(t('toasts.reviews_load_failed'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, starFilter, productFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    try {
      await reviewApi.delete(id);
      toast.success(t('toasts.review_deleted'));
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xóa đánh giá thất bại');
    }
  };

  // Handle reply
  const handleReply = async (reviewId, content) => {
    await reviewApi.update(reviewId, { adminReply: content });
    loadReviews();
  };

  // Filter options
  const starOptions = [
    { value: 'all', label: 'Tất cả sao' },
    { value: '5', label: '5 sao', stars: 5 },
    { value: '4', label: '4 sao', stars: 4 },
    { value: '3', label: '3 sao', stars: 3 },
    { value: '2', label: '2 sao', stars: 2 },
    { value: '1', label: '1 sao', stars: 1 },
  ];

  // Stats
  const totalReviews = reviews.length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;
  const fiveStarReviews = reviews.filter(r => r.rating === 5).length;
  const oneStarReviews = reviews.filter(r => r.rating === 1).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Đánh giá</h1>
          <p className="text-gray-300 text-sm mt-1">Xem và quản lý đánh giá sản phẩm</p>
        </div>
        <button
          onClick={() => loadReviews()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
          aria-label="Làm mới đánh giá"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-2xl font-bold">{loading ? '...' : avgRating}</span>
          </div>
          <p className="text-gray-300 text-sm mt-2">Điểm đánh giá trung bình</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-2xl font-bold">{loading ? '...' : total}</span>
          </div>
          <p className="text-gray-300 text-sm mt-2">Tổng đánh giá</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-green-400 fill-green-400" />
            </div>
            <span className="text-2xl font-bold">{loading ? '...' : fiveStarReviews}</span>
          </div>
          <p className="text-gray-300 text-sm mt-2">Đánh giá 5 sao</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-red-400 fill-red-400" />
            </div>
            <span className="text-2xl font-bold">{loading ? '...' : oneStarReviews}</span>
          </div>
          <p className="text-gray-300 text-sm mt-2">Đánh giá 1 sao</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Tìm kiếm đánh giá..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Star Filter */}
        <div className="relative">
          <select
            value={starFilter}
            onChange={(e) => { setStarFilter(e.target.value); setCurrentPage(1); }}
            className="appearance-none px-4 py-2.5 pr-10 rounded-xl bg-[#111827] border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          >
            {starOptions.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-[#111827]">
                {opt.stars ? `${opt.stars} sao` : opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
        </div>

        {/* Product Filter */}
        <div className="relative">
          <select
            value={productFilter}
            onChange={(e) => { setProductFilter(e.target.value); setCurrentPage(1); }}
            className="appearance-none px-4 py-2.5 pr-10 rounded-xl bg-[#111827] border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          >
            <option value="all" className="bg-[#111827]">Tất cả sản phẩm</option>
            {products.map(p => (
              <option key={p.id} value={p.id} className="bg-[#111827]">
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 p-6">
          <SkeletonTable rows={8} cols={8} />
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Số sao</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nội dung</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phản hồi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ngày</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-300">
                      <Star className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                      <p>Không có đánh giá nào</p>
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <span className="text-sm text-blue-400 font-mono">#{review.id?.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {review.user?.avatar ? (
                            <img src={review.user.avatar} alt={review.user.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              {review.user?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">{review.user?.name || review.user?.email}</p>
                            {review.user?.email && <p className="text-xs text-gray-500">{review.user.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {review.product?.thumbnail && (
                            <img src={review.product.thumbnail} alt={review.product?.name} className="w-8 h-8 rounded object-cover" />
                          )}
                          <span className="text-sm">{review.product?.name || `Sản phẩm #${review.productId?.slice(0, 8)}`}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                              aria-hidden="true"
                            />
                          ))}
                          <span className="ml-1 text-sm text-gray-400">{review.rating}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <p className="text-sm text-gray-300 line-clamp-2">{review.content}</p>
                      </td>
                      <td className="px-4 py-4">
                        {review.adminReply ? (
                          <div className="text-sm">
                            <p className="text-gray-300 line-clamp-2">{review.adminReply}</p>
                            <p className="text-xs text-gray-500 mt-1">{review.repliedAt ? new Date(review.repliedAt).toLocaleDateString('vi-VN') : ''}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Chưa phản hồi</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          {!review.adminReply && (
                            <button
                              onClick={() => setSelectedReview(review)}
                              className="p-2 rounded-lg hover:bg-white/10 text-blue-400 transition-colors"
                              title="Phản hồi"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-2 rounded-lg hover:bg-white/10 text-red-400 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      <AnimatePresence>
        {replyReview && (
          <ReplyModal
            review={replyReview}
            onClose={() => setReplyReview(null)}
            onReply={handleReply}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
