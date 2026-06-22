import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import { SkeletonGrid } from '../components/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();

  const ITEMS_PER_PAGE = 12;

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCat) params.category = activeCat;
      if (search) params.search = search;
      if (sortBy !== 'default') params.sort = sortBy;
      params.page = page;
      params.limit = ITEMS_PER_PAGE;

      const [p, c] = await Promise.all([
        api.get('/products', { params }),
        api.get('/categories'),
      ]);

      const productData = p.data.products || p.data;
      const pageData = p.data.totalPages !== undefined ? p.data : { products: productData, totalPages: 1 };
      setProducts(Array.isArray(productData) ? productData : []);
      if (pageData.totalPages) setTotalPages(pageData.totalPages);
      const catData = c.data.categories || c.data;
      if (!categories.length) setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      toast.error('Không tải được sản phẩm');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [activeCat, sortBy, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleBuy = (product) => {
    if (!user) { 
      toast.error('Vui lòng đăng nhập để mua hàng');
      return navigate('/login'); 
    }
    navigate(`/checkout/${product.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 sm:p-12 text-center relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-neon-cyan/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-neon-magenta/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Giao hàng tự động 24/7
          </motion.div>
          
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">
            <span className="text-neon-cyan">Chợ</span> sản phẩm{' '}
            <span className="text-neon-magenta">MMO</span> uy tín
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Tài khoản, proxy, tool, thẻ cào, khóa học... Mua sắm dễ dàng với giao hàng tức thì.
          </p>
          
          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4">
            <FeatureBadge icon="zap" text="Giao hàng tức thì" />
            <FeatureBadge icon="shield" text="Bảo mật cao" />
            <FeatureBadge icon="percent" text="Hỗ trợ affiliate 10%" />
          </div>
        </div>
      </motion.section>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-4 sm:p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Tìm kiếm sản phẩm..." 
                className="input pl-12" 
              />
            </div>
            <button type="submit" className="btn-neon px-6">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Sort */}
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="select w-full lg:w-48"
          >
            <option value="default">Mặc định</option>
            <option value="price_asc">Giá: Thấp → Cao</option>
            <option value="price_desc">Giá: Cao → Thấp</option>
            <option value="name_asc">Tên: A → Z</option>
          </select>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--neon-cyan) #1a1a2e' }}
      >
        <button 
          onClick={() => { setActiveCat(''); setPage(1); }}
          className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            !activeCat 
              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40' 
              : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Tất cả
          </span>
        </button>
        {categories.map((c, idx) => (
          <motion.button
            key={c.id || idx}
            onClick={() => { setActiveCat(c.id); setPage(1); }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * idx }}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeCat === c.id
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40' 
                : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              {c.icon && <span>{c.icon}</span>}
              {c.name}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Products Grid */}
      {loading ? (
        <SkeletonGrid count={8} />
      ) : products.length ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <ProductCard product={p} onBuy={handleBuy} />
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-outline px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-xl font-medium transition-all ${
                      page === pageNum
                        ? 'btn-neon'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-outline px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Không tìm thấy sản phẩm</h3>
          <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc danh mục khác</p>
        </div>
      )}
    </div>
  );
}

function FeatureBadge({ icon, text }) {
  const icons = {
    zap: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    shield: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    percent: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  };
  
  return (
    <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 flex items-center gap-2">
      {icons[icon]}
      {text}
    </span>
  );
}
