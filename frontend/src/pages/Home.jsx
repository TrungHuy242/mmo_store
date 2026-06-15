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
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCat) params.category = activeCat;
      if (search) params.search = search;
      const [p, c] = await Promise.all([
        api.get('/products', { params }),
        categories.length ? Promise.resolve({ data: categories }) : api.get('/categories'),
      ]);
      setProducts(p.data);
      if (!categories.length) setCategories(c.data);
    } catch {
      toast.error('Khong tai duoc san pham');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [activeCat]);

  const handleBuy = (product) => {
    if (!user) { toast('Vui long dang nhap de mua'); return navigate('/login'); }
    navigate(`/checkout/${product.id}`);
  };

  return (
    <div>
      <motion.section
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass p-8 mb-6 text-center"
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          <span className="text-neon-cyan">Cho</span> san pham <span className="text-neon-magenta">MMO</span> tu dong
        </h1>
        <p className="text-gray-400">Tai khoan, proxy, tool, the cao... Giao hang tu dong 24/7.</p>
      </motion.section>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex-1">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tim san pham..." className="input" />
        </form>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setActiveCat('')} className={`px-3 py-1.5 rounded-xl text-sm border transition ${!activeCat ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'border-white/10 text-gray-400'}`}>Tat ca</button>
        {categories.map((c) => (
          <button key={c._id} onClick={() => setActiveCat(c._id)} className={`px-3 py-1.5 rounded-xl text-sm border transition ${activeCat === c._id ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'border-white/10 text-gray-400'}`}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {loading ? <SkeletonGrid /> : (
        products.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} onBuy={handleBuy} />)}
          </div>
        ) : <p className="text-center text-gray-500 py-12">Khong co san pham.</p>
      )}
    </div>
  );
}
