import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { t } = useTranslation();
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
    if (!form.name.trim()) newErrors.name = t('auth.enter_name_err');
    if (!form.email) newErrors.email = t('auth.enter_email_err');
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = t('auth.invalid_email');
    if (!form.password) newErrors.password = t('auth.enter_password_err');
    else if (form.password.length < 6) newErrors.password = t('auth.password_min');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      await register(form);
      toast.success(t('auth.signup_success'));
      navigate('/dashboard');
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      if (validationErrors?.length) {
        toast.error(validationErrors[0].msg);
      } else {
        const serverMsg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          t('auth.signup_failed');
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
                {t('auth.referred_friend')}
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
            <h2 className="text-2xl font-bold mb-2">{t('auth.title_register')}</h2>
            <p className="text-gray-400">{t('auth.register_start')}</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('auth.fullname')}</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input 
                  className={`input pl-12 ${errors.name ? 'input-error' : ''}`}
                  type="text" 
                  placeholder={t('auth.enter_name')} 
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
                  placeholder={t('auth.password_min')} 
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
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('auth.processing')}
                </span>
              ) : t('auth.register_now')}
            </button>
          </form>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-4">
            {t('auth.terms_agree')}{' '}
            <a href="#" className="text-neon-cyan hover:underline">{t('auth.terms_of_service')}</a>
            {' '}{' '}
            <a href="#" className="text-neon-cyan hover:underline">{t('auth.privacy_policy')}</a>
          </p>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {t('auth.has_account')}{' '}
              <Link to="/login" className="text-neon-cyan hover:text-neon-cyan/80 font-medium transition-colors">
                {t('auth.login_btn')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PasswordStrength({ password }) {
  const { t } = useTranslation();

  // Check individual criteria
  const criteria = useMemo(() => ({
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }), [password]);

  // Calculate strength score (1-4)
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;           // Length >= 8
    if (/[a-z]/.test(pwd)) score++;        // Has lowercase
    if (/[A-Z]/.test(pwd)) score++;         // Has uppercase
    if (/[0-9]/.test(pwd)) score++;         // Has number
    if (/[^A-Za-z0-9]/.test(pwd)) score++; // Has special char
    return Math.min(4, Math.max(1, score - 1)); // Normalize to 1-4
  };

  const strength = password.length > 0 ? getStrength(password) : 0;

  // Strength levels configuration
  const strengthConfig = {
    1: { color: 'bg-red-500', textColor: 'text-red-400', label: 'Yếu', barColor: '#ef4444' },
    2: { color: 'bg-orange-500', textColor: 'text-orange-400', label: 'Trung bình', barColor: '#f97316' },
    3: { color: 'bg-yellow-500', textColor: 'text-yellow-400', label: 'Khá', barColor: '#eab308' },
    4: { color: 'bg-green-500', textColor: 'text-green-400', label: 'Mạnh', barColor: '#22c55e' },
  };

  const config = strengthConfig[strength] || strengthConfig[1];

  // Criteria checklist
  const criteriaList = [
    { key: 'length', label: 'Ít nhất 8 ký tự', met: criteria.length },
    { key: 'lowercase', label: 'Có chữ thường (a-z)', met: criteria.lowercase },
    { key: 'uppercase', label: 'Có chữ hoa (A-Z)', met: criteria.uppercase },
    { key: 'number', label: 'Có số (0-9)', met: criteria.number },
    { key: 'special', label: 'Có ký tự đặc biệt (!@#$)', met: criteria.special },
  ];

  const metCount = criteriaList.filter(c => c.met).length;

  return (
    <div className="mt-3 space-y-3">
      {/* Strength Bars */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((level) => {
          const isActive = level <= strength;
          const widthPercent = isActive ? '100%' : '0%';
          const barColor = isActive ? config.barColor : '#ffffff1a';

          return (
            <div
              key={level}
              className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden"
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: barColor }}
                initial={{ width: '0%' }}
                animate={{ width: widthPercent }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          );
        })}
      </div>

      {/* Strength Label */}
      <div className="flex items-center justify-between">
        <motion.span
          className={`text-xs font-medium ${config.textColor}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          key={config.label}
        >
          {config.label}
        </motion.span>
        <span className="text-xs text-gray-500">
          {metCount}/5 tiêu chí
        </span>
      </div>

      {/* Criteria Checklist */}
      <motion.div
        className="grid grid-cols-1 gap-1.5"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
      >
        {criteriaList.map((item) => (
          <motion.div
            key={item.key}
            className="flex items-center gap-2 text-xs"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
          >
            <motion.div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.met ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              {item.met ? (
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              )}
            </motion.div>
            <span className={item.met ? 'text-green-400/80' : 'text-gray-500'}>
              {item.label}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Dynamic Hint */}
      <AnimatePresence mode="wait">
        {strength < 4 && password.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-gray-500 flex items-start gap-1.5"
          >
            <svg className="w-3.5 h-3.5 mt-0.5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Mật khẩu nên chứa ít nhất 1 chữ hoa, 1 chữ số và kí tự đặc biệt.
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
