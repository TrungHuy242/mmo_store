import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import CountdownTimer from '../components/CountdownTimer.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  const [zoomSrc, setZoomSrc] = useState(null);
  const [wishlist, setWishlist] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const [p, all] = await Promise.all([
        api.get(`/products/${id}`),
        api.get('/products').catch(() => ({ data: { products: [] } })),
      ]);
      setProduct(p.data);
      const relatedProducts = (all.data.products || all.data || []).filter(
        (pr) => pr.id !== id && pr.category?.id === p.data.category?.id
      ).slice(0, 4);
      setRelated(relatedProducts);
    } catch (err) {
      toast.error('Không tải được sản phẩm');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = () => {
    navigate(`/checkout/${id}`);
  };

  const handleAddToCart = () => {
    toast.success('Đã thêm vào giỏ hàng');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="skeleton h-96 rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-10 w-3/4 rounded-xl" />
            <div className="skeleton h-6 w-1/2 rounded-xl" />
            <div className="skeleton h-20 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-400 mb-2">Sản phẩm không tồn tại</h3>
        <Link to="/" className="btn-neon mt-4 inline-block">Quay lại trang chủ</Link>
      </div>
    );
  }

  const onSale = product.flashSale?.enabled && new Date(product.flashSale.endsAt) > new Date();
  const outOfStock = product.stock < 1;
  const originalPrice = product.effectivePrice ?? product.price;
  const salePrice = product.flashSale?.salePrice ?? originalPrice;
  const discount = onSale ? Math.round((1 - salePrice / originalPrice) * 100) : 0;

  const tabs = [
    { id: 'details', label: 'Chi tiết' },
    { id: 'specs', label: 'Thông số' },
    { id: 'reviews', label: 'Đánh giá' },
  ];

  const reviews = [
    { user: 'Nguyễn Văn A', rating: 5, comment: 'Sản phẩm tốt, giao hàng nhanh!', date: '2024-01-15' },
    { user: 'Trần Thị B', rating: 4, comment: 'Chất lượng ok, đáng mua', date: '2024-01-10' },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/" className="hover:text-white transition">Trang chủ</Link>
        <span>/</span>
        {product.category && (
          <>
            <span className="hover:text-white transition cursor-pointer">{product.category.name}</span>
            <span>/</span>
          </>
        )}
        <span className="text-white">{product.name}</span>
      </nav>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* Main Image */}
          <div 
            className="relative glass rounded-2xl overflow-hidden cursor-zoom-in"
            onClick={() => setZoomSrc(product.image || 'https://picsum.photos/800/600')}
          >
            <img
              src={product.image || 'https://picsum.photos/800/600'}
              alt={product.name}
              className="w-full h-96 lg:h-[500px] object-cover transition-transform duration-300 hover:scale-105"
            />
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {onSale && (
                <span className="badge badge-magenta animate-pulse-glow">
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  FLASH SALE
                </span>
              )}
              {outOfStock && (
                <span className="badge badge-danger">Hết hàng</span>
              )}
            </div>

            {/* Discount Badge */}
            {discount > 0 && (
              <div className="absolute top-4 right-4">
                <span className="bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg">
                  -{discount}%
                </span>
              </div>
            )}

            {/* Zoom hint */}
            <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-white flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                Phóng to
              </span>
            </div>
          </div>

          {/* Thumbnail Gallery */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-20 h-20 glass rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-neon-cyan transition">
                <img
                  src={`https://picsum.photos/200/200?random=${i}`}
                  alt={`Thumbnail ${i}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Category */}
          {product.category && (
            <span className="text-sm text-neon-cyan/70 font-medium">
              {product.category.icon} {product.category.name}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold text-white">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={`w-5 h-5 ${star <= 4 ? 'text-neon-gold' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-400">(128 đánh giá)</span>
          </div>

          {/* Price */}
          <div className="glass p-6 rounded-2xl space-y-2">
            {onSale ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-neon-gold">
                    {salePrice.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    {originalPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CountdownTimer endsAt={product.flashSale.endsAt} />
                </div>
              </>
            ) : (
              <span className="text-4xl font-bold text-neon-cyan">
                {originalPrice.toLocaleString('vi-VN')} đ
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${outOfStock ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="font-medium">
                {outOfStock ? 'Hết hàng' : `Còn ${product.stock} sản phẩm`}
              </span>
            </div>
            {product.stock < 5 && product.stock > 0 && (
              <span className="text-amber-400 text-sm">Sắp hết hàng!</span>
            )}
          </div>

          {/* Quantity Selector */}
          {!outOfStock && (
            <div className="flex items-center gap-4">
              <span className="text-gray-400">Số lượng:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 h-10 bg-white/5 border border-white/10 rounded-xl text-center font-semibold"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={outOfStock}
              onClick={handleBuy}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                outOfStock
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  : 'btn-neon text-base py-4'
              }`}
            >
              {outOfStock ? 'Hết hàng' : 'Mua ngay'}
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setWishlist(!wishlist)}
              className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              <svg className={`w-6 h-6 ${wishlist ? 'text-neon-magenta' : 'text-gray-400'}`} fill={wishlist ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </motion.button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
              <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm">Giao hàng tức thì</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
              <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm">Bảo mật cao</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
              <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-sm">Hỗ trợ 24/7</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
              <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">Đổi trả miễn phí</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs Section */}
      <div className="glass p-6 rounded-2xl">
        {/* Tab Headers */}
        <div className="flex gap-1 border-b border-white/10 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                activeTab === tab.id
                  ? 'text-neon-cyan'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-neon-cyan rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'details' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Mô tả sản phẩm</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {product.description || 'Sản phẩm chất lượng cao, giao hàng tự động ngay sau khi thanh toán. Được kiểm tra kỹ trước khi giao.'}
                </p>
                
                <h4 className="text-lg font-semibold text-white mt-6">Hướng dẫn sử dụng</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-300">
                  <li>Thanh toán và nhận mã sản phẩm qua email hoặc Telegram</li>
                  <li>Đăng nhập tài khoản với thông tin được cung cấp</li>
                  <li>Thay đổi mật khẩu ngay sau khi nhận được</li>
                  <li>Liên hệ hỗ trợ nếu gặp vấn đề</li>
                </ol>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Thông số kỹ thuật</h3>
                <div className="grid gap-3">
                  {[
                    { label: 'Loại sản phẩm', value: product.category?.name || 'Tài khoản' },
                    { label: 'Thời hạn', value: 'Vĩnh viễn' },
                    { label: 'Bảo hành', value: '7 ngày' },
                    { label: 'Hỗ trợ', value: '24/7' },
                    { label: 'Giao hàng', value: 'Tự động qua email/Telegram' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between p-3 bg-white/5 rounded-xl">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-white font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Đánh giá từ khách hàng</h3>
                  <button className="btn-outline text-sm">Viết đánh giá</button>
                </div>
                
                {/* Rating Summary */}
                <div className="flex items-center gap-8 p-6 glass rounded-xl">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-neon-gold">4.8</div>
                    <div className="flex gap-1 mt-2 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className={`w-5 h-5 ${star <= 4 ? 'text-neon-gold' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">128 đánh giá</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 w-8">{stars} sao</span>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-neon-gold rounded-full" 
                            style={{ width: stars === 5 ? '70%' : stars === 4 ? '20%' : '10%' }}
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-8">{stars === 5 ? '70' : stars === 4 ? '20' : '10'}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.map((review, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 bg-white/5 rounded-xl"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center text-white font-bold">
                            {review.user[0]}
                          </div>
                          <div>
                            <div className="font-medium text-white">{review.user}</div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-neon-gold' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                      <p className="text-gray-300">{review.comment}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <ProductCard product={p} onBuy={(product) => navigate(`/checkout/${product.id}`)} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomSrc(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8"
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={zoomSrc}
              alt="Zoomed"
              className="max-w-full max-h-full object-contain rounded-xl"
            />
            <button
              onClick={() => setZoomSrc(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
