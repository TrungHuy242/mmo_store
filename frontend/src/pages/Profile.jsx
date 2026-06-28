import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi, profileApi } from '../api';
import useSEO from '../hooks/useSEO';

export default function Profile() {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();

  // SEO
  useSEO({
    title: 'Hồ sơ',
    description: 'Quản lý thông tin cá nhân và cài đặt tài khoản MMO Store của bạn.',
  });

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    telegram: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Telegram linking state
  const [telegramStatus, setTelegramStatus] = useState({ isLinked: false, telegramUsername: null });
  const [telegramLink, setTelegramLink] = useState(null);
  const [loadingTelegram, setLoadingTelegram] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        telegram: user.telegram || '',
      });
    }
  }, [user]);

  // Fetch Telegram status on mount
  useEffect(() => {
    fetchTelegramStatus();
  }, []);

  const fetchTelegramStatus = async () => {
    try {
      const res = await profileApi.getTelegramLinkStatus();
      if (res.data?.success) {
        setTelegramStatus({
          isLinked: res.data.data.isLinked,
          telegramUsername: res.data.data.telegramUsername,
        });
      }
    } catch (error) {
      console.error('Failed to fetch Telegram status:', error);
    }
  };

  const handleGenerateTelegramLink = async () => {
    try {
      setLoadingTelegram(true);
      const res = await profileApi.generateTelegramLink();
      if (res.data?.success) {
        setTelegramLink(res.data.data);
        toast.success(t('profile.telegram_link_generated'));
      }
    } catch (error) {
      console.error('Failed to generate Telegram link:', error);
      toast.error(error.response?.data?.message || t('profile.telegram_link_failed'));
    } finally {
      setLoadingTelegram(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!window.confirm(t('profile.telegram_unlink_confirm') || 'Bạn có chắc muốn hủy liên kết Telegram?')) {
      return;
    }
    try {
      setLoadingTelegram(true);
      await profileApi.unlinkTelegram();
      setTelegramStatus({ isLinked: false, telegramUsername: null });
      setTelegramLink(null);
      toast.success(t('profile.telegram_unlinked'));
      await refresh();
    } catch (error) {
      console.error('Failed to unlink Telegram:', error);
      toast.error(error.response?.data?.message || t('profile.telegram_unlink_failed'));
    } finally {
      setLoadingTelegram(false);
    }
  };

  const openTelegramLink = () => {
    if (telegramLink?.deepLink) {
      window.open(telegramLink.deepLink, '_blank');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.updateProfile(form);
      toast.success(t('profile.update_success'));
      await refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || t('profile.update_failed'));
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(t('profile.change_password_success') || 'Đổi mật khẩu thành công!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || t('profile.change_password_failed') || 'Có lỗi xảy ra';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Password strength calculator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { label: 'Rất yếu', color: 'bg-red-500' },
      { label: 'Yếu', color: 'bg-orange-500' },
      { label: 'Trung bình', color: 'bg-yellow-500' },
      { label: 'Mạnh', color: 'bg-green-500' },
      { label: 'Rất mạnh', color: 'bg-emerald-500' },
    ];
    return { strength, ...levels[strength - 1] || levels[0] };
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  const tabs = [
    { id: 'profile', labelKey: 'profile.profile_tab', icon: 'user' },
    { id: 'security', labelKey: 'profile.security_tab', icon: 'shield' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <svg className="w-7 h-7 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {t('profile.personal_profile')}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{t('profile.manage_account')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium text-sm transition-all relative ${
              activeTab === tab.id
                ? 'text-neon-cyan'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t(tab.labelKey)}
            {activeTab === tab.id && (
              <motion.div
                layoutId="profileTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan"
              />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 space-y-6"
        >
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={t('profile.avatar_preview')}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center text-white text-3xl font-bold">
                  {(user?.name || user?.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-neon-cyan rounded-full flex items-center justify-center cursor-pointer hover:bg-neon-cyan/80 transition">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{user?.name || user?.email}</h3>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                {t('profile.joined')} {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Telegram Linking Card */}
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.325.015.093.034.306.019.471z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  {t('profile.telegram_linking')}
                  {telegramStatus.isLinked && (
                    <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                      {t('profile.telegram_linked')}
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-400 mt-1">
                  {t('profile.telegram_description')}
                </p>

                {telegramStatus.isLinked ? (
                  // Linked state
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.325.015.093.034.306.019.471z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          @{telegramStatus.telegramUsername || 'Telegram User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('profile.telegram_connected')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleUnlinkTelegram}
                      disabled={loadingTelegram}
                      className="px-4 py-2 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {loadingTelegram ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {t('profile.processing')}
                        </span>
                      ) : (
                        t('profile.telegram_unlink')
                      )}
                    </button>
                  </div>
                ) : (
                  // Not linked state
                  <div className="mt-4 space-y-3">
                    {telegramLink ? (
                      // Has generated link
                      <div className="space-y-3">
                        <div className="p-3 bg-white/5 rounded-lg">
                          <p className="text-sm text-gray-400 mb-2">{t('profile.telegram_step1')}</p>
                          <p className="text-sm text-gray-400 mb-2">{t('profile.telegram_step2')}</p>
                        </div>
                        <button
                          onClick={openTelegramLink}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.325.015.093.034.306.019.471z"/>
                          </svg>
                          {t('profile.telegram_open_bot')}
                        </button>
                        <button
                          onClick={() => setTelegramLink(null)}
                          className="w-full text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          {t('profile.telegram_cancel')}
                        </button>
                      </div>
                    ) : (
                      // No link generated yet
                      <button
                        onClick={handleGenerateTelegramLink}
                        disabled={loadingTelegram}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {loadingTelegram ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {t('profile.generating')}
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.325.015.093.034.306.019.471z"/>
                            </svg>
                            {t('profile.telegram_link_now')}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('profile.display_name')}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder={t('profile.enter_name')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('profile.email')}</label>
                <input
                  value={form.email}
                  disabled
                  className="input opacity-60 cursor-not-allowed"
                  placeholder={t('profile.email')}
                />
                <p className="text-xs text-gray-500 mt-1">{t('profile.email_cannot_change')}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('profile.phone')}</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input"
                  placeholder={t('profile.enter_phone')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('profile.telegram_label')}</label>
                <input
                  value={form.telegram}
                  onChange={(e) => setForm({ ...form, telegram: e.target.value })}
                  className="input"
                  placeholder={t('profile.telegram_placeholder')}
                />
              </div>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-2xl font-bold text-neon-cyan">
                  {(user?.balance || 0).toLocaleString('vi-VN')}
                </p>
                <p className="text-xs text-gray-400 mt-1">{t('profile.balance')}</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-2xl font-bold text-neon-gold">
                  {(user?.commissionBalance || 0).toLocaleString('vi-VN')}
                </p>
                <p className="text-xs text-gray-400 mt-1">{t('profile.commission')}</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-2xl font-bold text-neon-magenta">
                  {user?.role === 'CUSTOMER' ? t('profile.customer') : user?.role || t('profile.customer')}
                </p>
                <p className="text-xs text-gray-400 mt-1">{t('profile.level')}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-neon w-full sm:w-auto"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('profile.saving')}
                </span>
              ) : t('profile.save_changes')}
            </button>
          </form>
        </motion.div>
      )}

      {activeTab === 'security' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 space-y-6"
        >
          <h3 className="font-bold text-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-neon-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {t('profile.change_password')}
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('profile.current_password')}</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                    if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                  }}
                  className={`input pl-12 ${passwordErrors.currentPassword ? 'input-error' : ''}`}
                  placeholder={t('profile.enter_current_password')}
                  required
                />
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {passwordErrors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('profile.new_password_label')}</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                    if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: '' });
                  }}
                  className={`input pl-12 ${passwordErrors.newPassword ? 'input-error' : ''}`}
                  placeholder={t('profile.enter_new_password')}
                  required
                />
              </div>
              {passwordErrors.newPassword && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {passwordErrors.newPassword}
                </p>
              )}

              {/* Password Strength Indicator */}
              {passwordForm.newPassword && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          level <= passwordStrength.strength ? passwordStrength.color : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    Độ mạnh: <span className={passwordStrength.color.replace('bg-', 'text-').replace('-500', '-400')}>{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('profile.confirm_new_password')}</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                    if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                  }}
                  className={`input pl-12 ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                  placeholder={t('profile.enter_confirm_password')}
                  required
                />
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {passwordErrors.confirmPassword}
                </p>
              )}

              {/* Password Match Indicator */}
              {passwordForm.confirmPassword && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${
                  passwordForm.newPassword === passwordForm.confirmPassword ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {passwordForm.newPassword === passwordForm.confirmPassword ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mật khẩu khớp
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Mật khẩu không khớp
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="p-4 bg-white/5 rounded-xl space-y-2">
              <p className="text-xs text-gray-400 font-medium mb-2">Yêu cầu mật khẩu:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p className={`flex items-center gap-1 ${passwordForm.newPassword.length >= 6 ? 'text-green-400' : 'text-gray-500'}`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={passwordForm.newPassword.length >= 6 ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                  Ít nhất 6 ký tự
                </p>
                <p className={`flex items-center gap-1 ${/[a-z]/.test(passwordForm.newPassword) && /[A-Z]/.test(passwordForm.newPassword) ? 'text-green-400' : 'text-gray-500'}`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={/[a-z]/.test(passwordForm.newPassword) && /[A-Z]/.test(passwordForm.newPassword) ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                  Chữ hoa & chữ thường
                </p>
                <p className={`flex items-center gap-1 ${/\d/.test(passwordForm.newPassword) ? 'text-green-400' : 'text-gray-500'}`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={/\d/.test(passwordForm.newPassword) ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                  Ít nhất 1 số
                </p>
                <p className={`flex items-center gap-1 ${/[^a-zA-Z0-9]/.test(passwordForm.newPassword) ? 'text-green-400' : 'text-gray-500'}`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={/[^a-zA-Z0-9]/.test(passwordForm.newPassword) ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                  Ký tự đặc biệt
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-neon w-full sm:w-auto"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  {t('profile.change_password_btn') || 'Đổi mật khẩu'}
                </span>
              )}
            </button>
          </form>

          {/* 2FA Toggle Section */}
          <div className="border-t border-white/10 pt-6 mt-6">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Xác thực 2 lớp (2FA)
            </h3>

            <div className="p-4 bg-gradient-to-r from-neon-cyan/10 to-blue-500/10 rounded-xl border border-neon-cyan/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">Xác thực qua Telegram</h4>
                    {user?.twoFactorEnabled ? (
                      <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                        Đã bật
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded-full">
                        Chưa bật
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    Khi bật, mỗi lần đăng nhập bạn sẽ nhận được mã OTP qua Telegram để xác thực.
                  </p>
                  {!telegramStatus.isLinked && !user?.twoFactorEnabled && (
                    <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Bạn cần liên kết Telegram trước để bật tính năng này.
                    </p>
                  )}
                </div>
                <button
                  onClick={async () => {
                    if (user?.twoFactorEnabled) {
                      if (!window.confirm('Bạn có chắc muốn tắt xác thực 2 lớp?')) return;
                      try {
                        await authApi.toggleTwoFactor(false);
                        toast.success('Đã tắt xác thực 2 lớp');
                        await refresh();
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
                      }
                    } else {
                      if (!telegramStatus.isLinked) {
                        toast.error(t('toasts.telegram_link_required'));
                        return;
                      }
                      try {
                        await authApi.toggleTwoFactor(true);
                        toast.success('Đã bật xác thực 2 lớp!');
                        await refresh();
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
                      }
                    }
                  }}
                  disabled={!telegramStatus.isLinked && !user?.twoFactorEnabled}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    user?.twoFactorEnabled ? 'bg-neon-cyan' : 'bg-gray-600'
                  } ${!telegramStatus.isLinked && !user?.twoFactorEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      user?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
