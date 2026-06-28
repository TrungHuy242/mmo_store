import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { productApi, reviewApi, wishlistApi } from '../api';
import { Button, Input, Tabs, Badge, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCartStore, useWishlistStore } from '../store';
import useSEO from '../hooks/useSEO';

export default function ProductDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlistStore = useWishlistStore((s) => s.isInWishlist(id));
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Bulk discount tiers configuration
  const BULK_DISCOUNT_TIERS = [
    { minQty: 5, maxQty: 9, discount: 5, label: '5-9 sản phẩm' },
    { minQty: 10, maxQty: Infinity, discount: 10, label: '10+ sản phẩm' },
  ];

  // Calculate bulk discount
  const getBulkDiscount = (qty) => {
    const tier = BULK_DISCOUNT_TIERS.find(t => qty >= t.minQty && qty <= t.maxQty);
    return tier ? tier.discount : 0;
  };

  const currentBulkDiscount = getBulkDiscount(quantity);
  const unitPrice = salePrice;
  const discountedUnitPrice = currentBulkDiscount > 0 ? unitPrice * (1 - currentBulkDiscount / 100) : unitPrice;
  const totalPrice = discountedUnitPrice * quantity;
  const totalSavings = (unitPrice * quantity) - totalPrice;

  // SEO - Dynamic title based on product
  useSEO({
    title: product?.name || 'Chi tiết sản phẩm',
    description: product?.description || 'Xem chi tiết sản phẩm và mua ngay với giao dịch tự động.',
  });

  // Sync wishlist state với store
  useEffect(() => {
    setIsInWishlist(isInWishlistStore);
  }, [isInWishlistStore]);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await productApi.getById(id);
        setProduct(res.data?.data || res.data);
        
        // Check wishlist
        if (user) {
          try {
            const wishRes = await wishlistApi.checkProduct(id);
            const inWishlist = wishRes.data?.isInWishlist || wishRes.data?.data?.isInWishlist || false;
            setIsInWishlist(inWishlist);
            // Sync với store
            if (inWishlist && !isInWishlistStore) {
              toggleWishlist(id);
            } else if (!inWishlist && isInWishlistStore) {
              toggleWishlist(id);
            }
          } catch (e) {
            // Ignore wishlist check errors
          }
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, user]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewLoading(true);
        const res = await reviewApi.getByProduct(id);
        setReviews(res.data?.data || res.data || []);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setReviewLoading(false);
      }
    };
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab, id]);

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.effectivePrice || product.price,
      image: product.image,
    }, quantity, currentBulkDiscount);
  };

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    handleAddToCart();
    navigate('/checkout');
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error(t('toasts.login_required_wishlist'));
      navigate('/login');
      return;
    }
    try {
      setWishlistLoading(true);
      if (isInWishlist) {
        await wishlistApi.removeItem(id);
        setIsInWishlist(false);
        toggleWishlist(id);
        toast.success('Đã xóa khỏi yêu thích');
      } else {
        await wishlistApi.addItem(id);
        setIsInWishlist(true);
        toggleWishlist(id);
        toast.success('Đã thêm vào yêu thích');
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật yêu thích');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newReview.comment.trim()) {
      toast.error(t('product_detail.please_write_comment'));
      return;
    }
    try {
      setSubmittingReview(true);
      await reviewApi.create({
        productId: id,
        rating: newReview.rating,
        content: newReview.comment,
      });
      setNewReview({ rating: 5, comment: '' });
      toast.success(t('product_detail.review_submitted'));
      // Refresh reviews
      const res = await reviewApi.getByProduct(id);
      setReviews(res.data?.data || res.data || []);
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error(error.response?.data?.message || t('product_detail.review_failed'));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="container-lg py-16 text-center">
        <h2 className="text-xl font-semibold text-text-primary mb-4">{t('product_detail.product_not_found')}</h2>
        <Link to="/products">
          <Button>{t('product_detail.browse_products')}</Button>
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock < 1;
  const images = product.images?.length > 0 ? product.images : [product.image || `https://picsum.photos/800/600?random=${id}`];
  const originalPrice = product.effectivePrice ?? product.price;
  const salePrice = product.flashSale?.enabled ? product.flashSale.salePrice : originalPrice;
  const discount = product.flashSale?.enabled ? Math.round((1 - salePrice / originalPrice) * 100) : 0;

  const tabs = [
    { id: 'description', labelKey: 'product_detail.description' },
    { id: 'features', labelKey: 'product_detail.features' },
    { id: 'reviews', labelKey: 'product_detail.reviews' },
    { id: 'changelog', labelKey: 'product_detail.changelog' },
  ];

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      {/* Breadcrumb */}
      <div className="container-lg py-4 border-b border-border">
        <nav className="flex items-center gap-2 text-sm text-text-tertiary">
          <Link to="/" className="hover:text-text-primary transition-colors">{t('common.home')}</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-text-primary transition-colors">{t('products.all')}</Link>
          <span>/</span>
          <span className="text-text-secondary">{product.name}</span>
        </nav>
      </div>

      <div className="container-lg py-8">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left: Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            {/* Main Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-bg-secondary mb-4">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={images[selectedImage]}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {isOutOfStock && <Badge variant="danger">{t('products.out_of_stock')}</Badge>}
                {product.type === 'instant' && !isOutOfStock && <Badge variant="success">{t('product_detail.instant_delivery')}</Badge>}
                {discount > 0 && <Badge variant="warning">-{discount}%</Badge>}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`
                      flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors
                      ${selectedImage === i ? 'border-primary' : 'border-transparent'}
                    `}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right: Purchase Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="sticky top-24 space-y-6">
              {/* Product Info */}
              <div>
                {product.category && (
                  <p className="text-sm text-primary mb-2">{product.category.name || product.category}</p>
                )}
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-4">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(product.rating || 4.5) ? 'text-warning' : 'text-text-tertiary'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-text-secondary">
                    {product.rating || 4.5} ({product.reviewCount || 0} {t('product_detail.reviews').toLowerCase()})
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-bold text-text-primary">
                    ${salePrice.toLocaleString()}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-lg text-text-tertiary line-through">
                        ${originalPrice.toLocaleString()}
                      </span>
                      <Badge variant="danger">{t('product_detail.save_percent')} {discount}%</Badge>
                    </>
                  )}
                </div>

                {/* Stock status */}
                <p className="text-sm text-text-secondary mb-6">
                  {isOutOfStock ? (
                    <span className="text-danger">{t('products.out_of_stock')}</span>
                  ) : (
                    <span className="text-success">{product.stock} {t('product_detail.items_in_stock')}</span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-text-secondary">{t('common.quantity')}:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                      className="w-16 h-10 bg-bg-tertiary border border-border rounded-lg text-center text-text-primary focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Bulk Discount Info */}
                {quantity >= 5 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gradient-to-r from-neon-gold/10 to-neon-magenta/10 border border-neon-gold/30 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-neon-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-neon-gold font-semibold">Chiết khấu sỉ {currentBulkDiscount}%</span>
                    </div>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-text-secondary">Giá mỗi sản phẩm:</span>
                      <span className="text-text-primary font-semibold">
                        ${discountedUnitPrice.toLocaleString()} <span className="text-neon-gold">(-{currentBulkDiscount}%)</span>
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-sm mt-1">
                      <span className="text-text-secondary">Tổng cộng ({quantity} sản phẩm):</span>
                      <span className="text-lg font-bold text-neon-gold">
                        ${totalPrice.toLocaleString()}
                      </span>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex items-baseline justify-between text-sm mt-1 text-success">
                        <span className="text-text-secondary">Tiết kiệm được:</span>
                        <span className="font-semibold">${totalSavings.toLocaleString()}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Bulk Discount Tiers Table */}
                <div className="p-4 bg-bg-secondary rounded-xl border border-border">
                  <p className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mua sỉ - Chiết khấu tự động
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">1-4 sản phẩm</span>
                      <span className="text-text-primary">Giá bán lẻ</span>
                    </div>
                    {BULK_DISCOUNT_TIERS.map((tier) => (
                      <div
                        key={tier.minQty}
                        className={`flex items-center justify-between text-sm p-2 rounded-lg transition-colors ${
                          quantity >= tier.minQty && quantity <= tier.maxQty
                            ? 'bg-neon-gold/20 border border-neon-gold/40'
                            : quantity > tier.maxQty && tier.maxQty === 9
                            ? 'bg-neon-gold/20 border border-neon-gold/40'
                            : ''
                        }`}
                      >
                        <span className="text-text-secondary">{tier.label}</span>
                        <span className={`font-semibold ${
                          quantity >= tier.minQty ? 'text-neon-gold' : 'text-text-primary'
                        }`}>
                          Giảm {tier.discount}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    fullWidth
                    size="lg"
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                  >
                    {t('product_detail.buy_btn')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </Button>
                  <Button
                    variant={isInWishlist ? 'primary' : 'secondary'}
                    size="lg"
                    onClick={handleToggleWishlist}
                    disabled={wishlistLoading}
                  >
                    {wishlistLoading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Info */}
              <div className="p-4 bg-bg-secondary rounded-xl border border-border space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-secondary">{t('product_detail.instant_delivery')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-secondary">{t('product_detail.warranty_included')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-secondary">{t('product_detail.support_available')}</span>
                </div>
              </div>

              {/* Share */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">{t('product_detail.share')}:</span>
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="p-2 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs Content */}
        <div className="mt-12">
          <Tabs
            tabs={tabs.map(tab => ({ id: tab.id, label: t(tab.labelKey) }))}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />

          <div className="mt-8">
            {activeTab === 'description' && (
              <div className="prose prose-invert max-w-none">
                <div className="text-text-secondary whitespace-pre-line">
                  {product.description || t('product_detail.no_description')}
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="grid md:grid-cols-2 gap-4">
                {(product.features || [
                  'Premium quality accounts',
                  'Instant delivery',
                  'Full documentation',
                  'Email support',
                  '30-day warranty',
                  'Replacement guarantee',
                ]).map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-bg-secondary rounded-lg border border-border">
                    <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-text-primary">{feature}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* Write Review */}
                {user && (
                  <form onSubmit={handleSubmitReview} className="p-6 bg-bg-secondary rounded-xl border border-border">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">{t('product_detail.write_review')}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-text-secondary mb-2">{t('product_detail.your_rating')}</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReview({ ...newReview, rating: star })}
                              className="p-1"
                            >
                              <svg
                                className={`w-8 h-8 ${star <= newReview.rating ? 'text-warning' : 'text-text-tertiary'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-2">{t('product_detail.your_comment')}</label>
                        <textarea
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          rows={4}
                          className="input"
                          placeholder={t('product_detail.share_experience')}
                          required
                        />
                      </div>
                      <Button type="submit" loading={submittingReview}>
                        {t('product_detail.submit_review')}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                {reviewLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 bg-bg-secondary rounded-lg border border-border">
                        <div className="flex items-center gap-4 mb-4">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="w-32 h-4" />
                            <Skeleton className="w-20 h-3" />
                          </div>
                        </div>
                        <Skeleton className="w-full h-4 mb-2" />
                        <Skeleton className="w-2/3 h-4" />
                      </div>
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-6 bg-bg-secondary rounded-xl border border-border">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center text-white font-semibold">
                              {review.user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{review.user?.name || 'Anonymous'}</p>
                              <p className="text-xs text-text-tertiary">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${star <= review.rating ? 'text-warning' : 'text-text-tertiary'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-text-secondary">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-secondary">
                    <p>{t('product_detail.no_reviews_yet')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'changelog' && (
              <div className="space-y-4">
                {[
                  { version: '2.1.0', date: '2024-01-15', changes: ['Added new features', 'Bug fixes', 'Performance improvements'] },
                  { version: '2.0.0', date: '2023-12-01', changes: ['Major update', 'New UI', 'API improvements'] },
                ].map((version, i) => (
                  <div key={i} className="p-4 bg-bg-secondary rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-primary">v{version.version}</span>
                      <span className="text-sm text-text-tertiary">{version.date}</span>
                    </div>
                    <ul className="space-y-2">
                      {version.changes.map((change, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="text-success">+</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="container-lg py-8">
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="aspect-video rounded-xl" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-10 w-1/4" />
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
