import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Nhap day du thong tin');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Dang nhap thanh cong');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Dang nhap that bai');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto glass p-8 mt-10">
      <h2 className="text-2xl font-bold mb-6 text-neon-cyan">Dang nhap</h2>
      <form onSubmit={submit} className="space-y-4">
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="Mat khau" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={loading} className="btn-neon w-full">{loading ? 'Dang xu ly...' : 'Dang nhap'}</button>
      </form>
      <p className="text-gray-400 text-sm mt-4 text-center">Chua co tai khoan? <Link to="/register" className="text-neon-magenta">Dang ky</Link></p>
    </motion.div>
  );
}
