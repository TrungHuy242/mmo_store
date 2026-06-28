import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Settings, User, Bell, Lock, Globe, Mail, CreditCard,
  Database, Server, Key, Eye, EyeOff, Save, Shield, Loader2, Send, Users, MessageSquare,
  Building2, Wallet, AlertTriangle, CheckCircle2, RefreshCw
} from 'lucide-react';
import api from '../../api/client.js';
import { broadcastApi } from '../../api/index.js';

export default function AdminSettings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const [showApiKey, setShowApiKey] = useState(false);

  const tabs = [
    { id: 'general', labelKey: 'admin.general', icon: Settings },
    { id: 'profile', labelKey: 'admin.profile', icon: User },
    { id: 'notifications', labelKey: 'admin.notifications', icon: Bell },
    { id: 'security', labelKey: 'admin.security', icon: Lock },
    { id: 'payment', labelKey: 'admin.payment', icon: CreditCard },
    { id: 'system', labelKey: 'admin.systemConfig', icon: Server },
    { id: 'integrations', labelKey: 'admin.integrations', icon: Globe },
    { id: 'broadcast', labelKey: 'admin.broadcast', icon: Send },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('admin.adminSettings')}</h1>
        <p className="text-gray-300 text-sm mt-1">{t('admin.manage_products_title')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-[#111827] rounded-2xl border border-white/5 p-2 sticky top-24">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'payment' && <PaymentSettings showApiKey={showApiKey} setShowApiKey={setShowApiKey} />}
        {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'system' && <SystemConfigSettings />}
          {activeTab === 'integrations' && <IntegrationSettings />}
          {activeTab === 'broadcast' && <BroadcastSettings />}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111827] rounded-2xl border border-white/5 p-6 space-y-6"
    >
      <h2 className="text-lg font-semibold">{t('admin.general')}</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('admin.store_name')}</label>
          <input
            type="text"
            defaultValue="MMO Store"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('admin.store_description')}</label>
          <textarea
            rows={3}
            defaultValue="Premium digital marketplace for MMO tools and accounts"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('admin.store_logo')}</label>
          <input
            type="text"
            placeholder="https://..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-sm font-medium hover:bg-blue-600 transition-colors">
        <Save className="w-4 h-4" />
        {t('common.save')}
      </button>
    </motion.div>
  );
}

function ProfileSettings() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        const userData = res.data?.data || res.data;
        setFormData({
          fullName: userData.fullName || userData.name || '',
          username: userData.username || '',
          phone: userData.phone || '',
        });
      } catch (err) {
        toast.error(t('toasts.profile_load_failed'));
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setShowSuccess(false);

    try {
      const res = await api.put('/auth/profile', {
        fullName: formData.fullName,
        username: formData.username,
        phone: formData.phone,
      });
      
      toast.success(t('toasts.profile_updated'));
      setShowSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111827] rounded-2xl border border-white/5 p-6 space-y-6"
      >
        <h2 className="text-lg font-semibold">{t('settings.profile_title')}</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111827] rounded-2xl border border-white/5 p-6 space-y-6"
    >
      <h2 className="text-lg font-semibold">{t('dashboard.profile_info')}</h2>
      
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('dashboard.full_name')}</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('auth.email')}</label>
          <input
            type="email"
            defaultValue={formData.email}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors cursor-not-allowed"
            disabled
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('settings.username_label')}</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('auth.phone')}</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </motion.div>
  );
}

function SecuritySettings() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('toasts.password_mismatch'));
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error(t('toasts.password_too_short'));
      return;
    }
    
    setSaving(true);
    
    try {
      await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      toast.success('Đổi mật khẩu thành công!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đổi mật khẩu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111827] rounded-2xl border border-white/5 p-6 space-y-6"
    >
      <h2 className="text-lg font-semibold">{t('dashboard.change_password')}</h2>
      
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('dashboard.current_password')}</label>
          <div className="relative">
            <input
              type={showPasswords ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('dashboard.new_password')}</label>
          <input
            type={showPasswords ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('auth.confirm_password')}</label>
          <input
            type={showPasswords ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {saving ? 'Đang đổi...' : t('dashboard.update_password')}
        </button>
      </form>
    </motion.div>
  );
}

function PaymentSettings({ showApiKey, setShowApiKey }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111827] rounded-2xl border border-white/5 p-6 space-y-6"
    >
      <h2 className="text-lg font-semibold">{t('admin.payment')}</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('admin.api_key')}</label>
          <div className="flex gap-2">
            <input
              type={showApiKey ? 'text' : 'password'}
              defaultValue="sk_live_xxxxxx"
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"
            >
              {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-sm font-medium hover:bg-blue-600 transition-colors">
        <Save className="w-4 h-4" />
        {t('common.save')}
      </button>
    </motion.div>
  );
}

// System Configuration Settings - VietQR, Crypto, Store settings
function SystemConfigSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Form states
  const [vietqrConfig, setVietqrConfig] = useState({
    bankId: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });
  
  const [cryptoConfig, setCryptoConfig] = useState({
    usdtAddress: '',
  });
  
  const [storeConfig, setStoreConfig] = useState({
    storeName: '',
    storeEmail: '',
    storePhone: '',
    lowStockThreshold: 10,
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
  });

  // Announcement banner config
  const [announcementConfig, setAnnouncementConfig] = useState({
    enabled: false,
    content: '',
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/settings');
        const data = res.data?.data || res.data || {};
        
        // Populate VietQR config
        setVietqrConfig({
          bankId: data.vietqr?.bankId || data.VIETQR_BANK_ID || '',
          bankName: data.vietqr?.bankName || data.VIETQR_BANK_NAME || '',
          accountNumber: data.vietqr?.accountNumber || data.VIETQR_ACCOUNT_NUMBER || '',
          accountName: data.vietqr?.accountName || data.VIETQR_ACCOUNT_NAME || '',
        });
        
        // Populate Crypto config
        setCryptoConfig({
          usdtAddress: data.crypto?.usdtAddress || data.CRYPTO_USDT_ADDRESS || '',
        });
        
        // Populate Store config
        setStoreConfig({
          storeName: data.store?.storeName || data.STORE_NAME || 'MMO Store',
          storeEmail: data.store?.storeEmail || data.STORE_EMAIL || '',
          storePhone: data.store?.storePhone || data.STORE_PHONE || '',
          lowStockThreshold: data.store?.lowStockThreshold || data.LOW_STOCK_THRESHOLD || 10,
          currency: data.store?.currency || 'VND',
          timezone: data.store?.timezone || 'Asia/Ho_Chi_Minh',
        });

        // Populate Announcement config
        setAnnouncementConfig({
          enabled: data.announcement?.enabled || data.announcementEnabled || false,
          content: data.announcement?.content || data.announcementContent || '',
        });

        // Fetch announcement from separate endpoint if not in response
        if (!data.announcement && !data.announcementEnabled) {
          try {
            const announceRes = await api.get('/settings/announcement');
            const announceData = announceRes.data?.data || {};
            setAnnouncementConfig({
              enabled: announceData.enabled || false,
              content: announceData.content || '',
            });
          } catch (e) {
            // Ignore - will use defaults
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        toast.error(t('toasts.system_config_load_failed'));
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Handle save all settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    
    try {
      // Save main config
      const payload = {
        vietqr: vietqrConfig,
        crypto: cryptoConfig,
        store: storeConfig,
      };
      
      await api.put('/admin/settings', payload);
      
      // Save announcement config separately
      await api.put('/settings/announcement', {
        enabled: announcementConfig.enabled,
        content: announcementConfig.content,
      });
      
      toast.success(t('toasts.system_config_saved'));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error(err.response?.data?.error || 'Lưu cấu hình thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111827] rounded-2xl border border-white/5 p-6"
      >
        <h2 className="text-lg font-semibold mb-4">{t('admin.systemConfig') || 'Cấu hình hệ thống'}</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl border border-white/5 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Server className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('admin.systemConfig') || 'Cấu hình hệ thống'}</h2>
            <p className="text-sm text-gray-400">Quản lý cấu hình thanh toán và cửa hàng</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* VietQR Configuration */}
        <div className="bg-[#111827] rounded-2xl border border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Cấu hình VietQR</h3>
              <p className="text-xs text-gray-400">Thông tin tài khoản ngân hàng nhận tiền</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Mã ngân hàng <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={vietqrConfig.bankId}
                onChange={(e) => setVietqrConfig(prev => ({ ...prev, bankId: e.target.value }))}
                placeholder="VD: VPBANK"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tên ngân hàng <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={vietqrConfig.bankName}
                onChange={(e) => setVietqrConfig(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="VD: Ngân hàng TMCP Việt Nam Thịnh Vượng"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Số tài khoản <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={vietqrConfig.accountNumber}
                onChange={(e) => setVietqrConfig(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="VD: 123456789"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors font-mono"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tên tài khoản <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={vietqrConfig.accountName}
                onChange={(e) => setVietqrConfig(prev => ({ ...prev, accountName: e.target.value }))}
                placeholder="VD: CONG TY TNHH MMO STORE"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors uppercase"
              />
            </div>
          </div>
        </div>

        {/* Crypto Configuration */}
        <div className="bg-[#111827] rounded-2xl border border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Cấu hình Crypto</h3>
              <p className="text-xs text-gray-400">Ví USDT TRC20 nhận thanh toán</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Địa chỉ ví USDT (TRC20) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={cryptoConfig.usdtAddress}
                onChange={(e) => setCryptoConfig(prev => ({ ...prev, usdtAddress: e.target.value }))}
                placeholder="VD: TXqwertyuiopASDFGHJKLzxcvbnm123456"
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors font-mono break-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 32C24.837 32 32 24.837 32 16S24.837 0 16 0 0 7.163 0 16s7.163 16 16 16zm-2.005-23.925v2.305L19.76 8h-2.54L12.5 20.12V17.81L7.5 10.25h2.54l3.015 5.14 4.14-5.14h2.24l.07 2.12zm10.01 0v2.305L25.53 8H23l-5.22 12.12v-2.31l-5-7.56h2.54l3.015 5.14 4.14-5.14h2.24l.07 2.12z"/>
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Chỉ chấp nhận ví USDT trên mạng TRC20 (TRON)
            </p>
          </div>
        </div>

        {/* Store Configuration */}
        <div className="bg-[#111827] rounded-2xl border border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Settings className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Cấu hình Cửa hàng</h3>
              <p className="text-xs text-gray-400">Thông tin và cài đặt cơ bản</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tên cửa hàng <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={storeConfig.storeName}
                onChange={(e) => setStoreConfig(prev => ({ ...prev, storeName: e.target.value }))}
                placeholder="VD: MMO Store"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email liên hệ <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={storeConfig.storeEmail}
                onChange={(e) => setStoreConfig(prev => ({ ...prev, storeEmail: e.target.value }))}
                placeholder="VD: support@mmostore.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={storeConfig.storePhone}
                onChange={(e) => setStoreConfig(prev => ({ ...prev, storePhone: e.target.value }))}
                placeholder="VD: 0912345678"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Ngưỡng cảnh báo sắp hết hàng <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={storeConfig.lowStockThreshold}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 0 }))}
                  min="0"
                  placeholder="VD: 10"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">sản phẩm</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Cảnh báo khi số lượng tồn kho thấp hơn ngưỡng này
              </p>
            </div>
          </div>
        </div>

        {/* Announcement Banner Configuration */}
        <div className="bg-gradient-to-br from-neon-magenta/10 to-neon-pink/10 rounded-2xl border border-neon-magenta/20 p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-8 h-8 rounded-lg bg-neon-magenta/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-neon-magenta" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Thông báo chạy chữ</h3>
              <p className="text-xs text-gray-400">Banner chạy ngang trên đầu trang web</p>
            </div>
            {/* Toggle */}
            <div className="ml-auto">
              <button
                onClick={() => setAnnouncementConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  announcementConfig.enabled ? 'bg-neon-magenta' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    announcementConfig.enabled ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          
          <div className={announcementConfig.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Nội dung thông báo <span className="text-red-400">*</span>
            </label>
            <textarea
              value={announcementConfig.content}
              onChange={(e) => setAnnouncementConfig(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
              placeholder="VD: Khuyến mãi nạp tiền qua USDT tặng thêm 5% giá trị nạp!"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-magenta/50 transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Thông báo sẽ hiển thị dạng marquee (chạy chữ) ở đầu trang web
            </p>
            
            {/* Preview */}
            {announcementConfig.enabled && announcementConfig.content && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Xem trước:</p>
                <div className="bg-gradient-to-r from-neon-magenta via-neon-pink to-neon-magenta text-white text-sm py-2 overflow-hidden rounded-lg">
                  <div className="px-4 truncate">
                    <span className="flex items-center gap-2">
                      <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-semibold">NEW</span>
                      {announcementConfig.content}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4 pt-4">
          {saved && (
            <span className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Đã lưu thành công!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu cấu hình
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function NotificationSettings() {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111827] rounded-2xl border border-white/5 p-6 space-y-6"
    >
      <h2 className="text-lg font-semibold">{t('admin.notifications')}</h2>
      
      <div className="space-y-4">
        {[
          { key: 'new_order', label: t('admin.newOrder') },
          { key: 'low_stock', label: t('admin.lowStock') },
          { key: 'withdrawal', label: t('admin.withdrawalRequest') },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{item.label}</span>
            <button className="w-12 h-6 rounded-full bg-blue-500 relative transition-colors">
              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function IntegrationSettings() {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111827] rounded-2xl border border-white/5 p-6 space-y-6"
    >
      <h2 className="text-lg font-semibold">{t('admin.integrations')}</h2>
      
      <div className="space-y-4">
        {[
          { name: 'Telegram Bot', status: 'Connected' },
          { name: 'Email Service', status: 'Connected' },
          { name: 'Payment Gateway', status: 'Connected' },
        ].map((integration, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-sm font-medium">{integration.name}</p>
              <p className="text-xs text-green-400">{integration.status}</p>
            </div>
            <button className="px-3 py-1 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors">
              {t('admin.edit')}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function BroadcastSettings() {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const res = await broadcastApi.getStats();
      setStats(res.data?.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error(t('toasts.enter_message'));
      return;
    }

    try {
      setSending(true);
      const res = await broadcastApi.send(message);
      const data = res.data;
      
      if (data.success) {
        toast.success(`Đã gửi thông báo đến ${data.sent} người dùng Telegram`);
        setMessage('');
      } else {
        toast.error(data.message || 'Gửi thông báo thất bại');
      }
    } catch (err) {
      console.error('Broadcast error:', err);
      toast.error(err.response?.data?.message || 'Gửi thông báo thất bại');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-[#111827] rounded-2xl border border-white/5 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Send className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('admin.broadcast') || 'Gửi thông báo Telegram'}</h2>
            <p className="text-sm text-gray-400">Gửi tin nhắn hàng loạt đến người dùng đã liên kết Telegram</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#111827] rounded-2xl border border-white/5 p-4 text-center">
            <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
            <p className="text-xs text-gray-400">Tổng người dùng</p>
          </div>
          <div className="bg-[#111827] rounded-2xl border border-white/5 p-4 text-center">
            <MessageSquare className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.usersWithTelegram}</p>
            <p className="text-xs text-gray-400">Đã liên kết Telegram</p>
          </div>
          <div className="bg-[#111827] rounded-2xl border border-white/5 p-4 text-center">
            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-400 text-xs font-bold">%</span>
            </div>
            <p className="text-2xl font-bold">{stats.telegramConnectRate}%</p>
            <p className="text-xs text-gray-400">Tỷ lệ kết nối</p>
          </div>
        </div>
      )}

      {/* Broadcast Form */}
      <form onSubmit={handleSendBroadcast} className="bg-[#111827] rounded-2xl border border-white/5 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nội dung thông báo
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Nhập nội dung thông báo..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
            disabled={sending}
          />
          <p className="text-xs text-gray-500 mt-2">
            Tin nhắn sẽ được gửi đến tất cả người dùng đã liên kết tài khoản Telegram
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            {stats ? `${stats.usersWithTelegram} người dùng sẽ nhận được thông báo` : 'Đang tải...'}
          </p>
          <button
            type="submit"
            disabled={sending || !message.trim() || !stats?.usersWithTelegram}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Gửi thông báo
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
