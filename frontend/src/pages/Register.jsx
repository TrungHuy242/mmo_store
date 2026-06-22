import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    ref: params.get('ref') || '' 
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Vui lòng nhập tên';
    if (!form.email) newErrors.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email không hợp lệ';
    if (!form.password) newErrors.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      await register(form);
      toast.success('Đăng ký thành công!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass p-8 sm:p-10">
          {/* Referral Banner */}
          {form.ref && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-xl bg-neon-gold/10 border border-neon-gold/30 text-center"
            >
              <p className="text-neon-gold text-sm">
                <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Bạn được giới thiệu bởi một người bạn - Hoa hồng 10%!
              </p>
            </motion.div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-magenta to-neon-cyan flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Tạo tài khoản mới</h2>
            <p className="text-gray-400">Đăng ký để bắt đầu mua sắm</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tên hiển thị</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input 
                  className={`input pl-12 ${errors.name ? 'input-error' : ''}`}
                  type="text" 
                  placeholder="Nhập tên của bạn" 
                  value={form.name} 
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input 
                  className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
                  type="email" 
                  placeholder="Nhập email của bạn" 
                  value={form.email} 
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mật khẩu</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input 
                  className={`input pl-12 ${errors.password ? 'input-error' : ''}`}
                  type="password" 
                  placeholder="Ít nhất 6 ký tự" 
                  value={form.password} 
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Password strength */}
            {form.password && (
              <PasswordStrength password={form.password} />
            )}

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading}
              className="btn-magenta w-full py-3 text-base disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xử lý...
                </span>
              ) : 'Tạo tài khoản'}
            </button>
          </form>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Bằng việc đăng ký, bạn đồng ý với{' '}
            <a href="#" className="text-neon-cyan hover:underline">Điều khoản sử dụng</a>
            {' '}và{' '}
            <a href="#" className="text-neon-cyan hover:underline">Chính sách bảo mật</a>
          </p>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-neon-cyan hover:text-neon-cyan/80 font-medium transition-colors">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PasswordStrength({ password }) {
  const getStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
  const labels = ['Yếu', 'Trung bình', 'Khá', 'Mạnh', 'Rất mạnh'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? colors[strength - 1] : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${
        strength <= 1 ? 'text-red-400' : 
        strength <= 2 ? 'text-orange-400' : 
        strength <= 3 ? 'text-yellow-400' : 'text-green-400'
      }`}>
        {labels[strength - 1] || 'Nhập mật khẩu'}
      </p>
    </div>
  );
}
