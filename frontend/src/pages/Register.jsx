import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '', name: '', ref: params.get('ref') || '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || form.password.length < 6) return toast.error('Email hop le va mat khau >= 6 ky tu');
    setLoading(true);
    try {
      await register(form);
      toast.success('Dang ky thanh cong');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Dang ky that bai');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto glass p-8 mt-10">
      <h2 className="text-2xl font-bold mb-6 text-neon-magenta">Dang ky</h2>
      {form.ref && <p className="text-xs text-neon-gold mb-3">Ban duoc gioi thieu (ref: {form.ref})</p>}
      <form onSubmit={submit} className="space-y-4">
        <input className="input" placeholder="Ten hien thi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="Mat khau (>= 6 ky tu)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={loading} className="btn-magenta w-full">{loading ? 'Dang xu ly...' : 'Dang ky'}</button>
      </form>
      <p className="text-gray-400 text-sm mt-4 text-center">Da co tai khoan? <Link to="/login" className="text-neon-cyan">Dang nhap</Link></p>
    </motion.div>
  );
}
