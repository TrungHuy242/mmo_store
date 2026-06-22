import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/client.js';

export default function Admin() {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (tab === 'dashboard') {
      api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
    }
  }, [tab]);

  const tabs = [
    { id: 'dashboard', label: 'Tổng quan', icon: 'chart' },
    { id: 'orders', label: 'Đơn hàng', icon: 'order' },
    { id: 'products', label: 'Sản phẩm', icon: 'product' },
    { id: 'categories', label: 'Danh mục', icon: 'category' },
    { id: 'users', label: 'Người dùng', icon: 'user' },
    { id: 'broadcast', label: 'Thông báo', icon: 'broadcast' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-gold/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-neon-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            Trang quản trị
          </h1>
          <p className="text-gray-400 text-sm mt-1">Quản lý cửa hàng của bạn</p>
        </div>
        <div className="badge badge-gold">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Admin Panel
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 glass">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.id 
                ? 'bg-neon-gold/20 text-neon-gold' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TabIcon icon={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'dashboard' && <DashboardStats stats={stats} />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'products' && <ProductsTab />}
          {tab === 'categories' && <CategoriesTab />}
          {tab === 'users' && <UsersTab />}
          {tab === 'broadcast' && <BroadcastTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function TabIcon({ icon }) {
  const icons = {
    chart: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    order: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    product: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    category: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    user: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    broadcast: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  };
  return icons[icon] || null;
}

function DashboardStats({ stats }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass p-6">
            <div className="skeleton h-20 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Tổng đơn hàng', value: stats.totalOrders || 0, icon: 'order', color: 'cyan' },
    { label: 'Doanh thu', value: (stats.totalRevenue || 0).toLocaleString('vi-VN') + ' đ', icon: 'money', color: 'gold' },
    { label: 'Người dùng', value: stats.totalUsers || 0, icon: 'user', color: 'magenta' },
    { label: 'Sản phẩm', value: stats.totalProducts || 0, icon: 'product', color: 'green' },
  ];

  const colorMap = {
    cyan: 'bg-neon-cyan/20 text-neon-cyan',
    gold: 'bg-neon-gold/20 text-neon-gold',
    magenta: 'bg-neon-magenta/20 text-neon-magenta',
    green: 'bg-emerald-500/20 text-emerald-400',
  };

  const iconMap = {
    order: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    money: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    user: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    product: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{c.label}</p>
                <p className="text-2xl font-bold">{c.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${colorMap[c.color]} flex items-center justify-center`}>
                {iconMap[c.icon]}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass p-6">
        <h3 className="font-semibold mb-4">Hoạt động gần đây</h3>
        {stats.recentOrders?.length > 0 ? (
          <div className="space-y-3">
            {stats.recentOrders.map(o => (
              <div key={o.id || o._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-magenta/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-white">{o.user?.email || o.userEmail || 'Khách'}</p>
                    <p className="text-xs text-gray-400">{o.productName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-neon-gold">{o.totalAmount?.toLocaleString('vi-VN')} đ</p>
                  <p className="text-xs text-gray-400">{new Date(o.createdAt || o.created_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Chưa có đơn hàng nào</p>
        )}
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/orders').then(r => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markPaid = async (id) => {
    try {
      await api.post(`/admin/orders/${id}/mark-paid`);
      toast.success('Đã xác nhận & giao hàng');
      load();
    } catch (err) {
      toast.error('Thất bại');
    }
  };

  const exportXlsx = () => {
    window.open(`${api.defaults.baseURL}/admin/orders/export`, '_blank');
  };

  const statusColors = {
    pending: 'badge-warning',
    paid: 'badge-cyan',
    delivered: 'badge-success',
    cancelled: 'badge-danger',
  };

  return (
    <div className="space-y-4">
      <div className="glass p-4 flex items-center justify-between">
        <h3 className="font-semibold">Quản lý đơn hàng</h3>
        <button onClick={exportXlsx} className="btn-gold text-sm">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Xuất Excel
        </button>
      </div>

      {loading ? (
        <div className="glass p-4"><div className="skeleton h-64 rounded-xl" /></div>
      ) : (
        <div className="glass overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th>Số tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td className="font-mono text-neon-gold">{o.code}</td>
                    <td className="text-sm">{o.user?.email}</td>
                    <td className="text-sm">{o.productName}</td>
                    <td>{o.totalAmount?.toLocaleString('vi-VN')} đ</td>
                    <td className="capitalize text-sm">{o.paymentMethod}</td>
                    <td>
                      <span className={`badge ${statusColors[o.status] || 'badge-warning'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      {(o.status === 'pending' || o.status === 'paid') && (
                        <button onClick={() => markPaid(o._id)} className="text-neon-cyan text-sm hover:underline">
                          Xác nhận
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <p className="text-center text-gray-500 py-8">Chưa có đơn hàng nào</p>
          )}
        </div>
      )}
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', price: '', category: '', deliveryType: 'text', description: '', image: '', stock: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/products'),
      api.get('/categories'),
    ]).then(([p, c]) => {
      const prodData = p.data.products || p.data;
      setProducts(Array.isArray(prodData) ? prodData : []);
      const catData = c.data.categories || c.data;
      setCats(Array.isArray(catData) ? catData : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.price || !form.category) return toast.error('Nhập tên, giá, danh mục');
    const stock = form.stock ? form.stock.split('\n').map(s => s.trim()).filter(Boolean) : [];
    try {
      await api.post('/products', { ...form, price: Number(form.price), stock });
      toast.success('Đã tạo sản phẩm');
      setForm({ name: '', price: '', category: '', deliveryType: 'text', description: '', image: '', stock: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thất bại');
    }
  };

  const replenish = async (id) => {
    const txt = prompt('Nhập stock mới (mỗi dòng 1 item):');
    if (!txt) return;
    const items = txt.split('\n').map(s => s.trim()).filter(Boolean);
    try {
      await api.post(`/products/${id}/replenish`, { items });
      toast.success('Đã nạp kho');
      load();
    } catch (err) {
      toast.error('Thất bại');
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Product */}
      <div className="glass p-6">
        <h3 className="font-semibold mb-4">Thêm sản phẩm mới</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input className="input" placeholder="Tên sản phẩm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Giá (VNĐ)" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            <option value="">-- Chọn danh mục --</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="select" value={form.deliveryType} onChange={e => setForm({ ...form, deliveryType: e.target.value })}>
            <option value="text">Giao dạng text</option>
            <option value="file">Giao dạng file/link</option>
          </select>
          <input className="input" placeholder="URL hình ảnh" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
          <textarea className="input" rows="1" placeholder="Mô tả" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <textarea className="input mt-4" rows="3" placeholder="Stock ban đầu (mỗi dòng 1 item)" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
        <button onClick={create} className="btn-neon mt-4">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tạo sản phẩm
        </button>
      </div>

      {/* Products List */}
      <div className="glass p-6">
        <h3 className="font-semibold mb-4">Danh sách sản phẩm ({products.length})</h3>
        {loading ? (
          <div className="skeleton h-48 rounded-xl" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Kho</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.name}</td>
                    <td className="text-sm text-gray-400">{p.category?.name || '-'}</td>
                    <td className="text-neon-cyan">{p.price?.toLocaleString('vi-VN')} đ</td>
                    <td>
                      <span className={`badge ${p.stock < 5 ? 'badge-warning' : 'badge-success'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => replenish(p.id)} className="text-neon-cyan text-sm hover:underline">
                        Nạp kho
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', icon: '' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/categories').then(r => setCategories(Array.isArray(r.data) ? r.data : (r.data.categories || []))).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return toast.error('Nhập tên danh mục');
    try {
      await api.post('/categories', form);
      toast.success('Đã tạo danh mục');
      setForm({ name: '', icon: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thất bại');
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass p-6">
        <h3 className="font-semibold mb-4">Thêm danh mục mới</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input className="input flex-1" placeholder="Tên danh mục" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input w-24" placeholder="Icon (emoji)" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
          <button onClick={create} className="btn-neon">Tạo</button>
        </div>
      </div>

      <div className="glass p-6">
        <h3 className="font-semibold mb-4">Danh sách danh mục ({categories.length})</h3>
        {loading ? (
          <div className="skeleton h-32 rounded-xl" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map(c => (
              <div key={c.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="text-2xl">{c.icon || '📁'}</span>
                <span className="font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/users').then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const adjust = async (id) => {
    const amount = Number(prompt('Cộng/trừ số dư (vd: 50000 hoặc -20000):'));
    if (!amount) return;
    try {
      await api.post(`/admin/users/${id}/balance`, { amount, field: 'balance' });
      toast.success('Đã cập nhật số dư');
      load();
    } catch (err) {
      toast.error('Thất bại');
    }
  };

  return (
    <div className="glass p-6">
      <h3 className="font-semibold mb-4">Người dùng ({users.length})</h3>
      {loading ? (
        <div className="skeleton h-64 rounded-xl" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Tên</th>
                <th>Vai trò</th>
                <th>Số dư</th>
                <th>Hoa hồng</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td className="text-sm">{u.email}</td>
                  <td className="text-sm">{u.name || '-'}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-gold' : 'badge-cyan'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="text-neon-cyan">{(u.balance || 0).toLocaleString('vi-VN')} đ</td>
                  <td className="text-neon-gold">{(u.commissionBalance || 0).toLocaleString('vi-VN')} đ</td>
                  <td>
                    <button onClick={() => adjust(u._id)} className="text-neon-cyan text-sm hover:underline">
                      Sửa số dư
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BroadcastTab() {
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!msg.trim()) return toast.error('Nhập nội dung');
    setSending(true);
    try {
      const r = await api.post('/admin/broadcast', { message: msg });
      toast.success(r.data.message || 'Đã gửi thông báo');
      setMsg('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi thất bại');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-neon-magenta/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-neon-magenta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold">Gửi thông báo Telegram</h3>
          <p className="text-xs text-gray-400">Gửi tin nhắn đến tất cả người dùng đã liên kết Telegram</p>
        </div>
      </div>
      
      <textarea 
        className="input" 
        rows="6" 
        placeholder="Nhập nội dung thông báo..."
        value={msg}
        onChange={e => setMsg(e.target.value)}
      />
      
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-500">
          {msg.length} ký tự
        </p>
        <button onClick={send} disabled={sending || !msg.trim()} className="btn-magenta">
          {sending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang gửi...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Gửi thông báo
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
