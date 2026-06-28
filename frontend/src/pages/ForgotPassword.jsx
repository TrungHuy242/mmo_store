import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import useSEO from '../hooks/useSEO';

export default function ForgotPassword() {
  // SEO
  useSEO({
    title: 'Quên mật khẩu',
    description: 'Khôi phục mật khẩu tài khoản MMO Store của bạn.',
  });

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Nhập email của bạn');

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('Đã gửi hướng dẫn đặt lại mật khẩu đến email!');
    } catch (error) {
      // Backend error shapes:
      //   validation  → { success: false, errors: [{field, message}] }
      //   service    → { success: false, error: '...' }
      //   unexpected → err.message
      const validationErrors = error.response?.data?.errors;
      if (validationErrors?.length) {
        toast.error(validationErrors[0].message);
      } else {
        const serverMsg =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          'Có lỗi xảy ra. Vui lòng thử lại.';
        toast.error(serverMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="glass p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Kiểm tra email!</h2>
            <p className="text-gray-400 mb-6">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <span className="text-neon-cyan">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Nếu không thấy email, hãy kiểm tra hộp thư spam.
            </p>
            <Link to="/login" className="btn-neon">
              Quay lại đăng nhập
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Quên mật khẩu?</h2>
            <p className="text-gray-400">Nhập email để nhận hướng dẫn đặt lại mật khẩu</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  className="input pl-12"
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-neon w-full py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xử lý...
                </span>
              ) : 'Gửi yêu cầu'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Nhớ mật khẩu?{' '}
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
