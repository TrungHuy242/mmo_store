import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import { productApi, categoryApi } from '../api';
import { Button, Input, SkeletonGrid, Badge, ProductCard } from '../components/ui';
import { useCartStore } from '../store';
import useSEO from '../hooks/useSEO';

// Default "all" category - will be prepended to API categories
const defaultCategory = { id: 'all', name: 'Tất cả sản phẩm', icon: '🛒' };

// Helper function to highlight matching keywords
function HighlightText({ text, searchTerm }) {
  if (!searchTerm || !text) return text;
  
  const parts = text.split(new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark key={i} className="bg-cyan-500/30 text-cyan-200 rounded px-0.5">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// Helper to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const sortOptions = [
  { value: 'newest', labelKey: 'products.sort_newest' },
  { value: 'popular', labelKey: 'products.sort_popular' },
  { value: 'price_low', labelKey: 'products.sort_price_asc' },
  { value: 'price_high', labelKey: 'products.sort_price_desc' },
  { value: 'rating', labelKey: 'products.sort_rating' },
];

const priceRanges = [
  { value: 'all', labelKey: 'products.all_prices' },
  { value: '0-50', labelKey: 'products.under_50' },
  { value: '50-100', labelKey: 'products.from_50_to_100' },
  { value: '100-500', labelKey: 'products.from_100_to_500' },
  { value: '500+', labelKey: 'products.above_500' },
];

export default function Products() {
  const { t } = useTranslation();
  // SEO - Dynamic page title
  useSEO({
    title: 'Sản phẩm',
    description: 'Khám phá hàng ngàn sản phẩm MMO chất lượng cao: Tài khoản Premium, Source Code, Tools & Scripts với giá cả hợp lý.',
    keywords: 'san pham mmo, tai khoan premium, source code, tools, scripts, mua ban',
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Categories from API
  const [categories, setCategories] = useState([defaultCategory]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [priceRange, setPriceRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const loadMoreRef = useRef(null);
  const { addItem } = useCartStore();

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await categoryApi.getAll();
        const data = res.data?.data || res.data || [];

        // Map API categories to component format
        const mappedCategories = data.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: getCategoryIcon(cat.name),
        }));

        setCategories([defaultCategory, ...mappedCategories]);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Keep default category on error
        setCategories([defaultCategory]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Get icon for category based on name
  const getCategoryIcon = (name) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('account') || nameLower.includes('tài khoản')) return '👤';
    if (nameLower.includes('code') || nameLower.includes('source') || nameLower.includes('mã nguồn')) return '💻';
    if (nameLower.includes('tool') || nameLower.includes('script')) return '⚙️';
    if (nameLower.includes('proxy')) return '🌐';
    if (nameLower.includes('course') || nameLower.includes('khóa học')) return '📚';
    if (nameLower.includes('vps') || nameLower.includes('server')) return '🖥️';
    if (nameLower.includes('software')) return '📦';
    if (nameLower.includes('game')) return '🎮';
    if (nameLower.includes('social') || nameLower.includes('mạng xã hội')) return '📱';
    return '📁'; // Default icon
  };

  // Intersection Observer for infinite scroll
  const { ref: inViewRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Fetch products
  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = {
        page: pageNum,
        limit: 12,
        sort: sortBy,
      };

      if (category !== 'all') params.category = category;
      if (search) params.q = search;
      if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number);
        if (min) params.minPrice = min;
        if (max) params.maxPrice = max;
        else params.minPrice = 500;
      }

      const res = await productApi.getAll(params);
      const data = res.data?.data || res.data || [];
      
      if (append) {
        setProducts(prev => [...prev, ...data]);
      } else {
        setProducts(data);
      }
      
      setHasMore(data.length === 12);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, search, sortBy, priceRange]);

  // Initial load
  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [category, sortBy, priceRange, search]);

  // Search debounce - 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchProducts(1, false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, true);
    }
  }, [inView, hasMore, loading, loadingMore]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (search) params.set('q', search);
    setSearchParams(params);
  }, [category, sortBy, search]);

  const handleAddToCart = (product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.effectivePrice || product.price,
      image: product.image,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-12 bg-bg-secondary/50 border-b border-border">
        <div className="container-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="text-3xl font-bold text-text-primary mb-2">{t('products.all')}</h1>
            <p className="text-text-secondary">
              {t('home.categories_subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container-lg py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">{t('common.search')}</label>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('products.search_placeholder')}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">{t('products.categories')}</label>
                <div className="space-y-1">
                  {categoriesLoading ? (
                    <>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 bg-bg-tertiary/50 rounded-lg animate-pulse" />
                      ))}
                    </>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                          ${category === cat.id
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                          }
                        `}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">{t('products.price_range')}</label>
                <div className="space-y-1">
                  {priceRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setPriceRange(range.value)}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                        ${priceRange === range.value
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                        }
                      `}
                    >
                      {t(range.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* Mobile filter toggle */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  }
                >
                  {t('products.filters')}
                </Button>

                <p className="text-sm text-text-secondary">
                  {loading ? t('products.loading') : `${products.length} ${t('products.all').toLowerCase()}`}
                </p>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select py-2 px-3 text-sm w-auto"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                ))}
              </select>
            </div>

            {/* Mobile Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="lg:hidden mb-6 overflow-hidden"
                >
                  <div className="p-4 bg-bg-secondary border border-border rounded-xl space-y-4">
                    {/* Categories */}
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">{t('products.categories')}</label>
                      <div className="flex flex-wrap gap-2">
                        {categoriesLoading ? (
                          <>
                            {[1, 2, 3].map(i => (
                              <div key={i} className="h-8 w-20 bg-bg-tertiary/50 rounded-lg animate-pulse" />
                            ))}
                          </>
                        ) : (
                          categories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setCategory(cat.id)}
                              className={`
                                px-3 py-1.5 rounded-lg text-sm transition-colors
                                ${category === cat.id
                                  ? 'bg-primary text-white'
                                  : 'bg-bg-tertiary text-text-secondary'
                                }
                              `}
                            >
                              {cat.icon} {cat.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">{t('products.price_range')}</label>
                      <div className="flex flex-wrap gap-2">
                        {priceRanges.map((range) => (
                          <button
                            key={range.value}
                            onClick={() => setPriceRange(range.value)}
                            className={`
                              px-3 py-1.5 rounded-lg text-sm transition-colors
                              ${priceRange === range.value
                                ? 'bg-primary/10 text-primary border border-primary'
                                : 'bg-bg-tertiary text-text-secondary border border-transparent'
                              }
                            `}
                          >
                            {t(range.labelKey)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            {loading ? (
              <SkeletonGrid count={8} />
            ) : products.length === 0 ? (
              <EmptyState onClear={() => {
                setCategory('all');
                setSearch('');
                setPriceRange('all');
              }} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  {products.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: Math.min(i * 0.06, 0.5), // Cap delay at 0.5s for better UX
                        duration: 0.4, 
                        ease: [0.22, 1, 0.36, 1] // Smooth easing
                      }}
                    >
                      <ProductCardWrapper
                        product={product}
                        onAddToCart={handleAddToCart}
                        searchTerm={search}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Load More with staggered animation */}
                {hasMore && (
                  <div ref={loadMoreRef} className="mt-8 flex justify-center">
                    {loadingMore ? (
                      <motion.div 
                        className="flex items-center gap-3 text-text-secondary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        {t('products.loading_more')}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Button
                          variant="secondary"
                          onClick={() => {
                            const nextPage = page + 1;
                            setPage(nextPage);
                            fetchProducts(nextPage, true);
                          }}
                        >
                          {t('products.load_more')}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProductCardWrapper({ product, onAddToCart, searchTerm }) {
  const { t } = useTranslation();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const isOutOfStock = product.stock < 1;

  return (
    <div className="group card overflow-hidden hover:border-border-hover transition-all">
      {/* Image */}
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-product bg-bg-tertiary overflow-hidden">
          <img
            src={product.image || `https://picsum.photos/400/300?random=${product.id}`}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isOutOfStock && <Badge variant="danger">{t('products.out_of_stock')}</Badge>}
            {product.type === 'instant' && !isOutOfStock && <Badge variant="success">{t('product_detail.instant')}</Badge>}
            {product.flashSale?.enabled && <Badge variant="warning">Sale</Badge>}
          </div>

          {/* Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsInWishlist(!isInWishlist);
              }}
              className={`
                p-2 rounded-lg backdrop-blur-sm transition-colors
                ${isInWishlist ? 'bg-danger text-white' : 'bg-black/50 text-white hover:bg-black/70'}
              `}
            >
              <svg className="w-5 h-5" fill={isInWishlist ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(window.location.origin + `/product/${product.id}`);
              }}
              className="p-2 rounded-lg bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          {/* Sale discount */}
          {product.flashSale?.enabled && (
            <div className="absolute bottom-3 right-3">
              <span className="px-2 py-1 bg-danger text-white text-sm font-bold rounded">
                -{Math.round((1 - product.flashSale.salePrice / product.price) * 100)}%
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {product.category && (
          <p className="text-xs text-primary mb-1">{product.category.name || product.category}</p>
        )}
        
        {/* Title with Highlight */}
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-text-primary line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            <HighlightText text={product.name} searchTerm={searchTerm} />
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-3.5 h-3.5 ${star <= Math.round(product.rating || 4.5) ? 'text-warning' : 'text-text-tertiary'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-text-tertiary">({product.reviewCount || 0})</span>
          {product.salesCount > 0 && (
            <span className="text-xs text-text-tertiary ml-auto">{product.salesCount}+ {t('products.sold')}</span>
          )}
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-text-primary">
              ${(product.effectivePrice || product.price)?.toLocaleString()}
            </span>
            {product.flashSale?.enabled && (
              <span className="text-sm text-text-tertiary line-through">
                ${product.price?.toLocaleString()}
              </span>
            )}
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className={`
              p-2 rounded-lg transition-colors
              ${isOutOfStock
                ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-600'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onClear }) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16">
      <svg className="w-16 h-16 mx-auto text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="text-lg font-medium text-text-primary mb-2">{t('products.no_products')}</h3>
      <p className="text-text-secondary mb-6">{t('products.try_adjust_filters')}</p>
      <Button variant="secondary" onClick={onClear}>{t('common.clearFilters')}</Button>
    </div>
  );
}
