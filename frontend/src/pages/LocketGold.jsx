import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Zap, Search, Loader2, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Info, Clock, Shield, Smartphone, Globe, Users,
  ArrowRight, Copy, Check, ExternalLink, RefreshCw, Star,
} from 'lucide-react';
import { locketGoldApi } from '../api';
import { useAuth } from '../context/AuthContext';
import useSEO from '../hooks/useSEO';
import { getErrorMessage } from '../utils/errorMessage';

const POLL_INTERVAL = 3000; // 3s polling while in queue

const STATUS_STEPS = {
  IDLE: 'idle',
  CHECKING: 'checking',
  ACTIVE: 'active',
  NOT_ACTIVE: 'not_active',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAIL: 'fail',
};

export default function LocketGold() {
  const { t } = useTranslation();
  const { user } = useAuth();
  useSEO({ title: 'Locket Gold - Kích hoạt Gold miễn phí', description: 'Kích hoạt Locket Gold miễn phí cho tài khoản Locket của bạn' });

  const [username, setUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(STATUS_STEPS.IDLE);
  const [goldStatus, setGoldStatus] = useState(null); // { active, expires }
  const [usage, setUsage] = useState(null); // { used, limit, remaining }
  const [queueItem, setQueueItem] = useState(null);
  const [activationResult, setActivationResult] = useState(null);
  const [resolvedUid, setResolvedUid] = useState(null);
  const [config, setConfig] = useState(null);
  const pollRef = useRef(null);

  // Fetch daily usage
  const fetchUsage = useCallback(async () => {
    try {
      const res = await locketGoldApi.getUsage();
      setUsage(res.data.data);
    } catch { /* silent */ }
  }, []);

  // Fetch service config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await locketGoldApi.getConfig();
      setConfig(res.data.data);
    } catch { /* silent */ }
  }, []);

  // Poll queue position
  const pollQueue = useCallback(async () => {
    if (status !== STATUS_STEPS.QUEUED && status !== STATUS_STEPS.PROCESSING) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    try {
      const res = await locketGoldApi.getQueue();
      const data = res.data.data;
      if (!data.inQueue) {
        clearInterval(pollRef.current);
        setStatus(STATUS_STEPS.IDLE);
        return;
      }
      setQueueItem(data);
      if (data.status === 'SUCCESS') {
        clearInterval(pollRef.current);
        setStatus(STATUS_STEPS.SUCCESS);
        setActivationResult(data);
        fetchUsage();
      } else if (data.status === 'FAIL') {
        clearInterval(pollRef.current);
        setStatus(STATUS_STEPS.FAIL);
        setActivationResult(data);
      } else if (data.status === 'PROCESSING') {
        setStatus(STATUS_STEPS.PROCESSING);
      }
    } catch { /* keep polling */ }
  }, [status, fetchUsage]);

  useEffect(() => {
    fetchUsage();
    fetchConfig();
  }, [fetchUsage, fetchConfig]);

  useEffect(() => {
    if (status === STATUS_STEPS.QUEUED || status === STATUS_STEPS.PROCESSING) {
      pollRef.current = setInterval(pollQueue, POLL_INTERVAL);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [status, pollQueue]);

  // Check Gold status of a username
  const checkStatus = async (u) => {
    setLoading(true);
    setStatus(STATUS_STEPS.CHECKING);
    setGoldStatus(null);
    setActivationResult(null);
    try {
      // First resolve UID
      const checkRes = await locketGoldApi.activate(u);
      const d = checkRes.data.data;
      setResolvedUid(d.uid);
      setGoldStatus({ active: d.goldActive, expires: d.goldExpires });
      setQueueItem({ position: d.queuePosition, uid: d.uid, username: d.username });
      setUsage({ used: d.dailyUsed, limit: d.dailyRemaining + d.dailyUsed, remaining: d.dailyRemaining });

      if (d.goldActive) {
        setStatus(STATUS_STEPS.ACTIVE);
      } else {
        // Check if already queued
        const queueRes = await locketGoldApi.getQueue();
        const queueData = queueRes.data.data;
        if (queueData.inQueue) {
          setQueueItem(queueData);
          if (queueData.status === 'PROCESSING') setStatus(STATUS_STEPS.PROCESSING);
          else if (queueData.status === 'SUCCESS') { setStatus(STATUS_STEPS.SUCCESS); setActivationResult(queueData); }
          else if (queueData.status === 'FAIL') { setStatus(STATUS_STEPS.FAIL); setActivationResult(queueData); }
          else setStatus(STATUS_STEPS.QUEUED);
        } else {
          setStatus(STATUS_STEPS.NOT_ACTIVE);
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'errors.unknown_error'));
      setStatus(STATUS_STEPS.IDLE);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!usernameInput.trim()) return;
    setUsername(usernameInput.trim());
    setStatus(STATUS_STEPS.CHECKING);
    await checkStatus(usernameInput.trim());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleActivate();
  };

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setUsername('');
    setUsernameInput('');
    setStatus(STATUS_STEPS.IDLE);
    setGoldStatus(null);
    setQueueItem(null);
    setActivationResult(null);
    setResolvedUid(null);
    fetchUsage();
  };

  const usagePercent = usage ? Math.round((usage.used / usage.limit) * 100) : 0;
  const isServiceEnabled = config?.isEnabled !== false;

  const StepIndicator = ({ step, current }) => {
    const active = current === step;
    const done = [
      STATUS_STEPS.SUCCESS, STATUS_STEPS.ACTIVE,
    ].includes(current);
    return (
      <div className={`flex items-center gap-2 ${active ? 'text-neon-cyan' : done ? 'text-green-400' : 'text-gray-500'}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2
          ${active ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan' :
            done ? 'border-green-400 bg-green-400/20 text-green-400' :
            'border-gray-600 text-gray-500'}`}>
          {done ? <Check className="w-3 h-3" /> : step}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-900/30 via-[#09090b] to-amber-900/10 border-b border-amber-500/20">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #f59e0b 0%, transparent 50%), radial-gradient(circle at 70% 50%, #d97706 0%, transparent 50%)' }} />
        <div className="relative max-w-2xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
          >
            <Star className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl font-bold mb-3"
          >
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">
              Locket Gold
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg text-gray-400 mb-2"
          >
            Kích hoạt Locket Gold <span className="text-amber-400 font-semibold">MIỄN PHÍ</span> cho tài khoản của bạn
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-sm text-gray-500"
          >
            Không cần thanh toán — sử dụng công nghệ bypass RevenueCat + bảo vệ DNS
          </motion.p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Service Disabled Banner */}
        {!isServiceEnabled && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">Dịch vụ Locket Gold hiện đang bảo trì. Vui lòng quay lại sau.</p>
          </div>
        )}

        {/* Daily Usage */}
        {usage && isServiceEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Yêu cầu hôm nay
              </span>
              <span className="text-sm font-semibold text-gray-300">
                {usage.used} / {usage.limit}
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                initial={{ width: 0 }}
                animate={{ width: `${usagePercent}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {usage.remaining > 0
                ? `Còn ${usage.remaining} lượt kích hoạt hôm nay`
                : 'Đã hết lượt hôm nay. Quay lại vào ngày mai!'}
            </p>
          </motion.div>
        )}

        {/* Input Form */}
        <AnimatePresence mode="wait">
          {!['SUCCESS', 'FAIL', 'QUEUED', 'PROCESSING'].includes(status) && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            >
              <div className="glass p-6 mb-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tài khoản Locket
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        className="input pl-12 pr-4 py-3 w-full"
                        placeholder="Nhập username hoặc dán link Locket..."
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        disabled={loading || !isServiceEnabled}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Ví dụ: <span className="text-neon-cyan">johndoe</span> hoặc{' '}
                      <span className="text-neon-cyan">locket.cam/johndoe</span>
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !isServiceEnabled || !usernameInput.trim()}
                    className="btn-neon w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Đang kiểm tra...</>
                    ) : (
                      <><Zap className="w-5 h-5" /> Kiểm tra & Kích hoạt Gold</>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checking State */}
        <AnimatePresence>
          {status === STATUS_STEPS.CHECKING && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="glass p-8 text-center mb-6"
            >
              <Loader2 className="w-10 h-10 mx-auto mb-4 text-neon-cyan animate-spin" />
              <p className="text-gray-400">Đang kiểm tra tài khoản <span className="text-white font-semibold">{username}</span>...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Gold */}
        <AnimatePresence>
          {status === STATUS_STEPS.ACTIVE && goldStatus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass p-6 mb-6 border-green-500/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-green-400">Tài khoản đã có Gold!</p>
                  <p className="text-sm text-gray-400">@{username}</p>
                </div>
              </div>
              {goldStatus.expires && (
                <p className="text-sm text-gray-500 mb-4">
                  Hết hạn: <span className="text-gray-300">{new Date(goldStatus.expires).toLocaleDateString('vi-VN')}</span>
                </p>
              )}
              <button onClick={handleReset} className="btn-outline w-full">
                Kiểm tra tài khoản khác
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not Active — show activate button */}
        <AnimatePresence>
          {status === STATUS_STEPS.NOT_ACTIVE && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass p-6 mb-6 border-amber-500/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Star className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-400">Chưa có Locket Gold</p>
                  <p className="text-sm text-gray-400">@{username}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="w-4 h-4 text-green-400" /> Kích hoạt Gold 1 tháng miễn phí
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="w-4 h-4 text-green-400" /> Bảo vệ DNS chống thu hồi 24h
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="w-4 h-4 text-green-400" /> Không cần thanh toán
                </div>
              </div>

              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await locketGoldApi.activate(username);
                    const d = res.data.data;
                    setQueueItem({ position: d.queuePosition, uid: d.uid, username: d.username });
                    setUsage({ used: d.dailyUsed, limit: d.dailyRemaining + d.dailyUsed, remaining: d.dailyRemaining });
                    if (d.queuePosition === 1) setStatus(STATUS_STEPS.PROCESSING);
                    else setStatus(STATUS_STEPS.QUEUED);
                  } catch (err) {
                    toast.error(getErrorMessage(err, 'errors.unknown_error'));
                    setStatus(STATUS_STEPS.IDLE);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="btn-neon w-full py-3 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                Kích hoạt Gold ngay
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Queued */}
        <AnimatePresence>
          {status === STATUS_STEPS.QUEUED && queueItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass p-6 mb-6 border-amber-500/30"
            >
              <div className="text-center mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-500/20 flex items-center justify-center"
                >
                  <Zap className="w-8 h-8 text-amber-400" />
                </motion.div>
                <p className="text-amber-400 font-bold text-lg">Đang chờ trong hàng đợi</p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Username</span>
                  <span className="text-white font-mono">@{queueItem.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Vị trí</span>
                  <span className="text-amber-400 font-bold text-lg">#{queueItem.position}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Trạng thái</span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Đang chờ xử lý
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300">
                  Hệ thống đang xử lý. Trang sẽ tự động cập nhật mỗi 3 giây.
                  Bạn có thể đóng trang — thông báo sẽ được gửi qua Telegram nếu đã liên kết.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing */}
        <AnimatePresence>
          {status === STATUS_STEPS.PROCESSING && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass p-6 mb-6 border-amber-500/30"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-500/20 flex items-center justify-center"
                >
                  <Zap className="w-8 h-8 text-amber-400" />
                </motion.div>
                <p className="text-amber-400 font-bold text-lg">Đang kích hoạt Gold...</p>
                <p className="text-sm text-gray-500 mt-1">Vui lòng chờ trong giây lát</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success */}
        <AnimatePresence>
          {status === STATUS_STEPS.SUCCESS && activationResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass p-6 mb-6 border-green-500/30"
            >
              <div className="text-center mb-4">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <CheckCircle className="w-9 h-9 text-green-400" />
                </motion.div>
                <p className="text-green-400 font-bold text-xl">Kích hoạt thành công!</p>
                <p className="text-sm text-gray-400 mt-1">@{activationResult.username}</p>
              </div>

              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-green-400" />
                  <p className="font-semibold text-green-400">Cài đặt DNS bảo vệ</p>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Để Gold không bị thu hồi sau 24h, bạn cần cài đặt DNS profile bảo vệ. Làm theo hướng dẫn:
                </p>

                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4 text-blue-400" />
                      <p className="font-medium text-blue-300 text-sm">iOS (iPhone / iPad)</p>
                    </div>
                    <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                      <li>Nhấn vào link DNS được gửi qua Telegram</li>
                      <li>Nhấn <span className="text-white">Allow</span> → Safari mở trang cài Profile</li>
                      <li>Nhấn <span className="text-white">Install</span> → Nhập passcode → Install → Done</li>
                      <li>Vào Settings → Wi-Fi → nhấn (i) → DNS → Automatic</li>
                    </ol>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-green-400" />
                      <p className="font-medium text-green-300 text-sm">Android</p>
                    </div>
                    <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                      <li>Vào Settings → Network & Internet</li>
                      <li>Chọn <span className="text-white">Private DNS</span></li>
                      <li>Chọn <span className="text-white">Private DNS provider hostname</span></li>
                      <li>Nhập: <code className="text-xs bg-white/10 px-1 py-0.5 rounded">{activationResult.nextDnsProfileId || 'profile-id'}.dns.nextdns.io</code></li>
                      <li>Nhấn Save</li>
                    </ol>
                  </div>
                </div>

                {activationResult.nextDnsProfileUrl && (
                  <a
                    href={activationResult.nextDnsProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full btn-outline flex items-center justify-center gap-2 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" /> Mở trang cài đặt DNS
                  </a>
                )}
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                <p className="text-xs text-amber-300">
                  <Info className="w-3 h-3 inline mr-1" />
                  Nếu Gold bị mất sau 24–30h, chỉ cần kích hoạt lại trên trang này (miễn phí).
                  DNS profile tự động gia hạn mỗi ngày.
                </p>
              </div>

              <button onClick={handleReset} className="btn-neon w-full">
                Kích hoạt tài khoản khác
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fail */}
        <AnimatePresence>
          {status === STATUS_STEPS.FAIL && activationResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass p-6 mb-6 border-red-500/30"
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-9 h-9 text-red-400" />
                </div>
                <p className="text-red-400 font-bold text-lg">Kích hoạt thất bại</p>
                <p className="text-sm text-gray-400 mt-1">@{activationResult.username}</p>
              </div>
              {activationResult.errorMsg && (
                <p className="text-sm text-red-300 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                  Lỗi: {activationResult.errorMsg}
                </p>
              )}
              <div className="p-3 rounded-lg bg-white/5 mb-4">
                <p className="text-xs text-gray-400">
                  Nguyên nhân thường gặp: token hết hạn, Locket thay đổi API, hoặc tài khoản không hợp lệ.
                  Thử lại sau hoặc liên hệ hỗ trợ.
                </p>
              </div>
              <button onClick={handleReset} className="btn-neon w-full flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Thử lại
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Section */}
        <AnimatePresence>
          {status === STATUS_STEPS.IDLE && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="glass p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-neon-cyan" /> Cách thức hoạt động
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Search, title: 'Nhập username Locket', desc: 'Nhập username tài khoản Locket của bạn' },
                    { icon: Zap, title: 'Hệ thống xử lý tự động', desc: 'Workers kích hoạt Gold qua API RevenueCat (bypass)' },
                    { icon: Shield, title: 'Bảo vệ bằng DNS', desc: 'NextDNS profile chặn RevenueCat, ngăn thu hồi Gold' },
                    { icon: Smartphone, title: 'Cài đặt DNS trên thiết bị', desc: 'iOS/Android cài profile DNS để bảo vệ 24h' },
                  ].map(({ icon: Icon, title, desc }, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{title}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" /> Lưu ý
                </h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    Dịch vụ miễn phí — giới hạn {config?.dailyLimit || 5} lượt/ngày
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    Kết quả sẽ được thông báo qua Telegram nếu bạn đã liên kết
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    Gold có thể bị thu hồi sau 24–30h nếu không cài DNS
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    Chỉ cần kích hoạt lại miễn phí nếu Gold bị mất
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
