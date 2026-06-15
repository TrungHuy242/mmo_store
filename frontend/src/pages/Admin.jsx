import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/client.js';

export default function Admin() {
  const [tab, setTab] = useState('orders');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-2xl font-bold mb-4 text-neon-gold">Admin Panel</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {['orders', 'products', 'users', 'broadcast'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-xl text-sm border transition ${tab === t ? 'border-neon-gold bg-neon-gold/10 text-neon-gold' : 'border-white/10 text-gray-400'}`}>{t}</button>
        ))}
      </div>
      {tab === 'orders' && <OrdersTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'broadcast' && <BroadcastTab />}
    </motion.div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const load = () => api.get('/admin/orders').then((r) => setOrders(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const markPaid = async (id) => {
    await api.post(`/admin/orders/${id}/mark-paid`);
    toast.success('Da xac nhan & giao hang'); load();
  };
  const exportXlsx = () => { window.open(`${api.defaults.baseURL}/admin/orders/export?token=`, '_blank'); };
  return (
    <div className="glass p-5">
      <div className="flex justify-between mb-3">
        <h3 className="font-semibold">Don hang</h3>
        <button onClick={exportXlsx} className="btn-neon py-1.5 text-sm">Export Excel</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-400 text-left"><th className="py-2">Ma</th><th>Email</th><th>SP</th><th>Tien</th><th>PT</th><th>TT</th><th></th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-t border-white/5">
                <td className="py-2 font-mono text-neon-gold">{o.code}</td>
                <td>{o.user?.email}</td><td>{o.productName}</td>
                <td>{o.totalAmount.toLocaleString('vi-VN')}</td><td>{o.paymentMethod}</td><td>{o.status}</td>
                <td>{(o.status === 'pending' || o.status === 'paid') && <button onClick={() => markPaid(o._id)} className="text-neon-cyan text-xs">Xac nhan</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', category: '', deliveryType: 'text', description: '', image: '', stock: '' });
  const load = () => api.get('/products').then((r) => setProducts(r.data));
  useEffect(() => { load(); api.get('/categories').then((r) => setCats(r.data)); }, []);
  const create = async () => {
    if (!form.name || !form.price || !form.category) return toast.error('Nhap ten, gia, danh muc');
    const stock = form.stock ? form.stock.split('\n').map((s) => s.trim()).filter(Boolean) : [];
    await api.post('/products', { ...form, price: Number(form.price), stock });
    toast.success('Da tao san pham'); setForm({ name: '', price: '', category: '', deliveryType: 'text', description: '', image: '', stock: '' }); load();
  };
  const replenish = async (id) => {
    const txt = prompt('Nhap stock moi (moi dong 1 item):');
    if (!txt) return;
    const items = txt.split('\n').map((s) => s.trim()).filter(Boolean);
    await api.post(`/products/${id}/replenish`, { items });
    toast.success('Da nap kho'); load();
  };
  return (
    <div className="space-y-4">
      <div className="glass p-5 space-y-2">
        <h3 className="font-semibold mb-2">Them san pham</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input className="input" placeholder="Ten" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Gia" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">-- Danh muc --</option>
            {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="input" value={form.deliveryType} onChange={(e) => setForm({ ...form, deliveryType: e.target.value })}>
            <option value="text">Giao text</option><option value="file">Giao file/link</option>
          </select>
          <input className="input sm:col-span-2" placeholder="Anh URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          <input className="input sm:col-span-2" placeholder="Mo ta" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <textarea className="input sm:col-span-2" rows="3" placeholder="Stock ban dau (moi dong 1 item)" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </div>
        <button onClick={create} className="btn-neon">Tao</button>
      </div>
      <div className="glass p-5">
        <h3 className="font-semibold mb-3">San pham</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-gray-400 text-left"><th className="py-2">Ten</th><th>Gia</th><th>Kho</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="py-2">{p.name}</td><td>{p.price.toLocaleString('vi-VN')}</td><td>{p.stock}</td>
                <td><button onClick={() => replenish(p.id)} className="text-neon-cyan text-xs">Nap kho</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const load = () => api.get('/admin/users').then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);
  const adjust = async (id) => {
    const amount = Number(prompt('Cong/tru so du (vd: 50000 hoac -20000):'));
    if (!amount) return;
    await api.post(`/admin/users/${id}/balance`, { amount, field: 'balance' });
    toast.success('Da cap nhat'); load();
  };
  return (
    <div className="glass p-5">
      <h3 className="font-semibold mb-3">Nguoi dung</h3>
      <table className="w-full text-sm">
        <thead><tr className="text-gray-400 text-left"><th className="py-2">Email</th><th>Role</th><th>So du</th><th>Hoa hong</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-t border-white/5">
              <td className="py-2">{u.email}</td><td>{u.role}</td>
              <td>{(u.balance || 0).toLocaleString('vi-VN')}</td><td>{(u.commissionBalance || 0).toLocaleString('vi-VN')}</td>
              <td><button onClick={() => adjust(u._id)} className="text-neon-cyan text-xs">Sua so du</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BroadcastTab() {
  const [msg, setMsg] = useState('');
  const send = async () => {
    if (!msg) return toast.error('Nhap noi dung');
    const r = await api.post('/admin/broadcast', { message: msg });
    toast.success(r.data.message); setMsg('');
  };
  return (
    <div className="glass p-5 space-y-3">
      <h3 className="font-semibold">Gui broadcast Telegram</h3>
      <textarea className="input" rows="4" placeholder="Noi dung gui toi tat ca user da lien ket Telegram" value={msg} onChange={(e) => setMsg(e.target.value)} />
      <button onClick={send} className="btn-magenta">Gui</button>
    </div>
  );
}
