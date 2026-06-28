import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import useSEO from '../hooks/useSEO';

export default function Login() {
  const { t } = useTranslation();
  // SEO - Dynamic page title
  useSEO({
    title: 'Đăng nhập',
    description: 'Đăng nhập vào tài khoản MMO Store để mua sắm và quản lý đơn hàng.',
  });
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If we were bounced here by the 401 interceptor, ?redirect= carries the
  // path the user was trying to reach. Honour it after a successful login.
  const redirectTarget = searchParams.get('redirect');

  const isSafeRedirect = (target) => {
    if (!target || typeof target !== 'string') return false;
    // Only accept same-origin absolute paths. Reject anything that looks
    // like an absolute URL or a protocol to prevent open-redirect attacks.
    if (!target.startsWith('/') || target.startsWith('//')) return false;
    if (target.startsWith('/login') || target.startsWith('/register')) return false;
    return true;
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = t('auth.enter_email_err');
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = t('auth.invalid_email');
    if (!form.password) newErrors.password = t('auth.enter_password_err');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      
      // Check if 2FA is required
      if (result.requiresOtp) {
        toast.success(result.message || 'Mã xác thực đã được gửi qua Telegram');
        // Store pending user info for OTP verification
        sessionStorage.setItem('pending2FAUser', JSON.stringify({
          id: result.userId || result.user?.id,
          email: form.email,
        }));
        navigate('/verify-otp');
        return;
      }
      
      toast.success(t('auth.login_success'));

      // Honour ?redirect=... if the user was bounced here by the 401
      // interceptor. Falls back to the role-based default.
      if (isSafeRedirect(redirectTarget)) {
        navigate(redirectTarget, { replace: true });
      } else if (result.isAdmin || result.role === 'SUPER_ADMIN' || result.role === 'MANAGER' || result.role === 'SUPPORT' || result.role === 'FINANCE') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      // Server error response shape:
      //   validation error  → { errors: [{msg}] }
      //   service error    → { error: '...' }  (error middleware wraps the Error object)
      //   unexpected       → err.message
      const validationErrors = err.response?.data?.errors;
      if (validationErrors?.length) {
        toast.error(validationErrors[0].msg);
      } else {
        const serverMsg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          t('auth.login_failed');
        toast.error(serverMsg);
      }
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('auth.welcome_back')}</h2>
            <p className="text-gray-400">{t('auth.login_continue')}</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('auth.email')}</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input 
                  className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
                  type="email" 
                  placeholder={t('auth.enter_email')} 
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
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('auth.password')}</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input 
                  className={`input pl-12 ${errors.password ? 'input-error' : ''}`}
                  type="password" 
                  placeholder={t('auth.enter_password')} 
                  value={form.password} 
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading}
              className="btn-neon w-full py-3 text-base disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('auth.processing')}
                </span>
              ) : t('auth.login_btn')}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              {t('auth.no_account')}{' '}
              <Link to="/register" className="text-neon-magenta hover:text-neon-magenta/80 font-medium transition-colors">
                {t('auth.register_now')}
              </Link>
            </p>
            <p className="text-gray-400 text-sm mt-2">
              <Link to="/forgot-password" className="text-neon-cyan hover:text-neon-cyan/80 transition">
                {t('auth.forgot_password')}
              </Link>
            </p>
          </div>

          {/* Demo account */}
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-gray-500 text-center">
              {t('auth.demo_account')} <span className="text-neon-cyan">admin@mmostore.com</span> / <span className="text-neon-cyan">Admin@12345</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
