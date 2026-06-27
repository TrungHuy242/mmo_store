import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { UserPlus, DollarSign, TrendingUp, Users, Copy, ExternalLink, CheckCircle, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';
import { SkeletonTable } from '../../components/ui';

export default function AdminAffiliates() {
  const { t } = useTranslation();
  const [affiliates, setAffiliates] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('affiliates');
  const [actionLoading, setActionLoading] = useState(null);
  const [copied, setCopied] = useState(false);
  const baseUrl = window.location.origin;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Use Promise.allSettled so a single failing endpoint (e.g. backend
      // restart or missing route) does not prevent the other list from
      // rendering. Previously Promise.all would reject on the first 404 and
      // both tables ended up empty even when only one route was broken.
      const responses = await Promise.allSettled([
        adminApi.getAffiliates({ limit: 50 }),
        adminApi.getWithdrawals('pending'),
      ]);

      const [affResult, withResult] = responses;
      if (affResult.status === 'fulfilled') {
        const affRes = affResult.value;
        setAffiliates(affRes.data?.data || affRes.data || []);
      } else {
        console.error('Affiliates load failed:', affResult.reason);
        setAffiliates([]);
        toast.error(t('admin.load_affiliates_failed', 'Không thể tải danh sách cộng tác viên'));
      }

      if (withResult.status === 'fulfilled') {
        const withRes = withResult.value;
        setWithdrawals(withRes.data?.data || withRes.data || []);
      } else {
        console.error('Withdrawals load failed:', withResult.reason);
        setWithdrawals([]);
        toast.error(t('admin.load_withdrawals_failed', 'Không thể tải yêu cầu rút tiền'));
      }
    } catch (err) {
      console.error('Failed to load affiliate data:', err);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApproveWithdrawal = async (id, txId) => {
    setActionLoading(id);
    try {
      await adminApi.approveWithdrawal(id, txId);
      toast.success('Đã duyệt yêu cầu rút tiền');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Duyệt thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectWithdrawal = async (id, reason) => {
    setActionLoading(id);
    try {
      await adminApi.rejectWithdrawal(id, reason);
      toast.success('Đã từ chối yêu cầu');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Từ chối thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalReferrals = affiliates.reduce((sum, a) => sum + (a.referralCount || 0), 0);
  const totalEarnings = affiliates.reduce((sum, a) => sum + (a.totalEarnings || 0), 0);
  const pendingPayouts = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + (w.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.affiliates')}</h1>
          <p className="text-gray-300 text-sm mt-1">{t('admin.manage_affiliates')}</p>
        </div>
        <button onClick={() => loadData()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors" aria-label="Làm mới">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { labelKey: 'admin.total_affiliates', value: affiliates.length, icon: Users, color: 'blue' },
          { labelKey: 'admin.total_referrals', value: totalReferrals, icon: UserPlus, color: 'purple' },
          { labelKey: 'admin.total_earnings_paid', value: totalEarnings, icon: DollarSign, color: 'green' },
          { labelKey: 'admin.pending_payouts', value: pendingPayouts, icon: TrendingUp, color: 'amber' },
        ].map((stat, i) => (
          <motion.div key={stat.labelKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-[#111827] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`} style={{ color: stat.color === 'amber' ? '#f59e0b' : `var(--${stat.color}-400)` }}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-300">{t(stat.labelKey)}</p>
                <p className="text-2xl font-bold">{loading ? '...' : stat.value.toLocaleString('vi-VN')}₫</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-[#111827] rounded-2xl border border-white/5 p-6">
        <h2 className="text-base font-semibold mb-2">{t('admin.referral_link')}</h2>
        <p className="text-sm text-gray-300 mb-4">{t('admin.share_earn_commission')}</p>
        <div className="flex gap-3">
          <input readOnly value={baseUrl + '/register?ref=YOUR_CODE'} className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-mono" aria-label="Link giới thiệu" />
          <button onClick={copyLink} className={`px-6 py-3 rounded-xl font-medium transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`} aria-label="Sao chép link giới thiệu">
            {copied ? <CheckCircle className="w-5 h-5" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/5">
        <button onClick={() => setActiveTab('affiliates')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'affiliates' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
          Cộng tác viên ({affiliates.length})
        </button>
        <button onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'withdrawals' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
          Yêu cầu rút tiền ({withdrawals.filter(w => w.status === 'pending').length})
        </button>
      </div>

      {activeTab === 'affiliates' ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.affiliate')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.referrals')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.earnings')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ngày tham gia</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={5}><div className="py-8"><SkeletonTable rows={6} cols={5} /></div></td></tr>
                ) : affiliates.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-300">Chưa có cộng tác viên nào</td></tr>
                ) : affiliates.map((aff) => (
                  <tr key={aff.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold" aria-hidden="true">
                          {aff.fullName?.charAt(0) || aff.email?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{aff.fullName || aff.email}</p>
                          <p className="text-xs text-gray-300">{aff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><span className="text-lg font-bold">{aff.referralCount || 0}</span></td>
                    <td className="px-4 py-4"><span className="text-green-400 font-medium">{(aff.totalEarnings || 0).toLocaleString('vi-VN')}₫</span></td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${aff.affiliateStatus === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {aff.affiliateStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-4"><span className="text-xs text-gray-300">{aff.createdAt ? new Date(aff.createdAt).toLocaleDateString('vi-VN') : '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Cộng tác viên</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Số tiền</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ngày yêu cầu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{t('admin.status')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">{t('admin.actions')}</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-300">Đang tải...</td></tr>
                ) : withdrawals.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-300">Không có yêu cầu rút tiền nào</td></tr>
                ) : withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-medium">{w.user?.fullName || w.user?.email || '—'}</p>
                    </td>
                    <td className="px-4 py-4"><span className="text-amber-400 font-medium">{Number(w.amount || 0).toLocaleString('vi-VN')}₫</span></td>
                    <td className="px-4 py-4"><span className="text-xs text-gray-300">{w.createdAt ? new Date(w.createdAt).toLocaleString('vi-VN') : '—'}</span></td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        w.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                        w.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>{w.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      {w.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => {
                            const txId = prompt('Nhập mã giao dịch (Transaction ID):');
                            if (txId) handleApproveWithdrawal(w.id, txId);
                          }} disabled={actionLoading === w.id}
                            className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50">
                            Duyệt
                          </button>
                          <button onClick={() => {
                            const reason = prompt('Lý do từ chối:');
                            if (reason) handleRejectWithdrawal(w.id, reason);
                          }} disabled={actionLoading === w.id}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50">
                            Từ chối
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
