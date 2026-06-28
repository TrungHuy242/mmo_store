import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import useSEO from '../hooks/useSEO';

const ADMIN_ROLES = ['SUPER_ADMIN', 'MANAGER', 'SUPPORT', 'FINANCE', 'INVENTORY_STAFF', 'MARKETING'];
const isAdminRole = (role) => !!role && ADMIN_ROLES.includes(role);

export default function VerifyOtp() {
  const { t } = useTranslation();
  
  useSEO({
    title: 'Xác thực 2FA',
    description: 'Nhập mã xác thực từ Telegram để hoàn tất đăng nhập.',
  });

  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingUser, setPendingUser] = useState(null);
  const inputRefs = useRef([]);

  // Get pending user from sessionStorage
  useEffect(() => {
    const pending = sessionStorage.getItem('pending2FAUser');
    if (pending) {
      setPendingUser(JSON.parse(pending));
    } else {
      // No pending user, redirect to login
      toast.error(t('toasts.session_expired'));
      navigate('/login');
    }
  }, [navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (index === 5 && digit) {
      const fullCode = [...newCode].join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // Move to previous input and clear it
        inputRefs.current[index - 1]?.focus();
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
      } else {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      handleVerify(pastedData);
    } else if (pastedData.length > 0) {
      // Fill in what we can
      const newCode = [...code];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      // Focus the next empty input
      const nextEmpty = newCode.findIndex((c) => !c);
      if (nextEmpty >= 0) {
        inputRefs.current[nextEmpty]?.focus();
      }
    }
  };

  const handleVerify = async (codeToVerify = code.join('')) => {
    if (codeToVerify.length !== 6) {
      toast.error(t('toasts.enter_otp_6_digits'));
      return;
    }

    if (!pendingUser) {
      toast.error(t('toasts.session_expired'));
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyLoginOtp(pendingUser.id, codeToVerify);
      
      if (res.data?.success) {
        const { accessToken, refreshToken, user } = res.data.data;
        
        // Store tokens
        localStorage.setItem('token', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        
        // Clear pending user
        sessionStorage.removeItem('pending2FAUser');
        
        toast.success('Đăng nhập thành công!');
        
        // Redirect based on role
        if (isAdminRole(user.role)) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
        
        // Force reload to update auth state
        window.location.reload();
      }
    } catch (err) {
      // Backend error shapes:
      //   service → { success: false, error: '...' }
      //   unexpected → err.message
      const serverMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Mã xác thực không đúng hoặc đã hết hạn';
      toast.error(serverMsg);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !pendingUser) return;

    setLoading(true);
    try {
      await authApi.resendLoginOtp(pendingUser.id);
      toast.success('Đã gửi lại mã xác thực');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err) {
      const serverMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Không thể gửi lại mã xác thực';
      toast.error(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('pending2FAUser');
    navigate('/login');
  };

  if (!pendingUser) {
    return null;
  }

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
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-cyan to-blue-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Xác thực đăng nhập</h2>
            <p className="text-gray-400">
              Nhập mã 6 chữ số được gửi qua Telegram
            </p>
            {pendingUser.email && (
              <p className="text-sm text-neon-cyan mt-2">
                {pendingUser.email}
              </p>
            )}
          </div>

          {/* OTP Input */}
          <div className="mb-8">
            <div 
              className="flex justify-center gap-2 sm:gap-3"
              onPaste={handlePaste}
            >
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl 
                    bg-white/5 border-2 transition-all
                    ${digit 
                      ? 'border-neon-cyan text-neon-cyan' 
                      : 'border-white/20 text-white'
                    }
                    focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 outline-none
                  `}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button 
            onClick={() => handleVerify()}
            disabled={loading || code.join('').length !== 6}
            className="btn-neon w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang xác thực...
              </span>
            ) : 'Xác thực'}
          </button>

          {/* Resend & Cancel */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              className="w-full py-2 text-sm text-neon-cyan hover:text-neon-cyan/80 transition-colors disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 
                ? `Gửi lại mã (${resendCooldown}s)` 
                : 'Gửi lại mã xác thực'
              }
            </button>
            
            <button
              onClick={handleCancel}
              className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Hủy và quay lại
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-gray-400 text-center">
              <svg className="w-4 h-4 inline-block mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Kiểm tra tin nhắn từ Bot Telegram để lấy mã xác thực. Mã có hiệu lực trong 3 phút.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
