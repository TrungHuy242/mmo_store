import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Zap, Plus, Trash2, Edit, ToggleLeft, ToggleRight, RefreshCw,
  Activity, Key, LogOut, Settings, AlertCircle, Check, X,
  ChevronLeft, ChevronRight, Search, Loader2, Copy, CheckCircle,
  XCircle, Clock, Users, BarChart3, Send, Eye, EyeOff, Play,
  Pause, RotateCcw
} from 'lucide-react';
import { locketGoldApi } from '../../api/locketGold.api.js';
import { getErrorMessage } from '../../utils/errorMessage';
import { SkeletonTable } from '../../components/ui';

export default function LocketGoldAdmin() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLimit] = useState(20);
  const [logFilter, setLogFilter] = useState({ status: '', from: '', to: '' });
  const [queueState, setQueueState] = useState(null);

  // Token form
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [tokenForm, setTokenForm] = useState({
    name: '', fetchToken: '', appTransaction: '', hashParams: '', hashHeaders: '', isSandbox: false,
  });
  const [tokenSubmitting, setTokenSubmitting] = useState(false);

  // Config form
  const [configForm, setConfigForm] = useState({ isEnabled: true, numWorkers: 2, dailyLimit: 5 });
  const [configSubmitting, setConfigSubmitting] = useState(false);

  // Broadcast
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // Load data
  const loadStats = useCallback(async () => {
    try {
      const [statsRes, configRes, tokensRes] = await Promise.all([
        locketGoldApi.getStats(),
        locketGoldApi.getConfig(),
        locketGoldApi.getTokens(),
      ]);
      setStats(statsRes.data.data);
      setConfig(configRes.data.data);
      setConfigForm({
        isEnabled: configRes.data.data.isEnabled,
        numWorkers: configRes.data.data.numWorkers,
        dailyLimit: configRes.data.data.dailyLimit,
      });
      setTokens(tokensRes.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'errors.unknown_error'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQueue = useCallback(async () => {
    try {
      const res = await locketGoldApi.getQueueState();
      setQueueState(res.data.data);
    } catch { /* silent */ }
  }, []);

  const loadLogs = useCallback(async (page = 1) => {
    try {
      const params = { page, limit: logsLimit, ...logFilter };
      const res = await locketGoldApi.getLogs(params);
      setLogs(res.data.data.rows);
      setLogsPage(page);
      setLogsTotal(res.data.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err, 'errors.unknown_error'));
    }
  }, [logsLimit, logFilter]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (activeTab === 'dashboard') { loadStats(); loadQueue(); } }, [activeTab, loadStats, loadQueue]);
  useEffect(() => { if (activeTab === 'logs') loadLogs(logsPage); }, [activeTab, logsPage, loadLogs]);
  useEffect(() => { if (activeTab === 'tokens') loadStats(); }, [activeTab, loadStats]);

  // Token CRUD
  const openCreateToken = () => { setEditingToken(null); setTokenForm({ name: '', fetchToken: '', appTransaction: '', hashParams: '', hashHeaders: '', isSandbox: false }); setShowTokenModal(true); };
  const openEditToken = (token) => {
    setEditingToken(token);
    setTokenForm({
      name: token.name, fetchToken: token.fetchToken, appTransaction: token.appTransaction,
      hashParams: token.hashParams || '', hashHeaders: token.hashHeaders || '', isSandbox: token.isSandbox,
    });
    setShowTokenModal(true);
  };
  const submitToken = async () => {
    if (!tokenForm.fetchToken || !tokenForm.appTransaction) { toast.error('fetchToken and appTransaction are required'); return; }
    setTokenSubmitting(true);
    try {
      if (editingToken) await locketGoldApi.updateToken(editingToken.id, tokenForm);
      else await locketGoldApi.createToken(tokenForm);
      toast.success(editingToken ? 'Token updated' : 'Token created');
      setShowTokenModal(false);
      loadStats();
    } catch (err) {
      toast.error(getErrorMessage(err, 'errors.unknown_error'));
    } finally {
      setTokenSubmitting(false);
    }
  };
  const toggleToken = async (token) => {
    try {
      await locketGoldApi.updateToken(token.id, { isActive: !token.isActive });
      loadStats();
    } catch (err) { toast.error(getErrorMessage(err, 'errors.unknown_error')); }
  };
  const deleteToken = async (token) => {
    if (!confirm(`Delete token "${token.name}"?`)) return;
    try {
      await locketGoldApi.deleteToken(token.id);
      toast.success('Token deleted');
      loadStats();
    } catch (err) { toast.error(getErrorMessage(err, 'errors.unknown_error')); }
  };

  // Save config
  const saveConfig = async () => {
    setConfigSubmitting(true);
    try {
      await locketGoldApi.updateConfig(configForm);
      toast.success('Settings saved');
      loadStats();
    } catch (err) { toast.error(getErrorMessage(err, 'errors.unknown_error')); }
    finally { setConfigSubmitting(false); }
  };

  // Restart workers
  const restartWorkers = async () => {
    try {
      await locketGoldApi.restartWorkers();
      toast.success('Workers restarted');
    } catch (err) { toast.error(getErrorMessage(err, 'errors.unknown_error')); }
  };

  // Broadcast
  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcasting(true);
    try {
      const res = await locketGoldApi.broadcast(broadcastMsg);
      toast.success(`Sent to ${res.data.data.sent}/${res.data.data.total} users`);
      setBroadcastMsg('');
    } catch (err) { toast.error(getErrorMessage(err, 'errors.unknown_error')); }
    finally { setBroadcasting(false); }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'tokens', label: 'Token Sets', icon: Key },
    { id: 'logs', label: 'Usage Logs', icon: LogOut },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const totalPages = Math.ceil(logsTotal / logsLimit);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Locket Gold</h1>
            <p className="text-xs text-gray-500">RevenueCat bypass + NextDNS anti-revoke service</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config?.isEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {config?.isEnabled ? 'ENABLED' : 'DISABLED'}
          </span>
          <button onClick={restartWorkers} className="btn-outline text-xs flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Restart Workers
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Activations', value: stats?.total || 0, color: 'text-neon-cyan', icon: Zap },
              { label: 'Today', value: stats?.todayCount || 0, color: 'text-amber-400', icon: Clock },
              { label: 'Success Rate', value: `${stats?.successRate || 0}%`, color: 'text-green-400', icon: CheckCircle },
              { label: 'Queue Size', value: stats?.queueSize || 0, color: 'text-purple-400', icon: Users },
            ].map(({ label, value, color, icon: Icon }, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{label}</span>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                {loading ? (
                  <div className="h-8 w-20 bg-white/5 rounded animate-pulse" />
                ) : (
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Token Status */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" /> Token Sets
              </h3>
              <button onClick={openCreateToken} className="btn-primary text-xs flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Token
              </button>
            </div>
            <div className="space-y-2">
              {(stats?.tokenSets || tokens).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No tokens configured</p>
              ) : (
                (stats?.tokenSets || tokens).map((token) => (
                  <div key={token.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${token.isActive ? 'bg-green-400' : 'bg-gray-600'}`} />
                      <div>
                        <p className="text-sm font-medium text-white">{token.name}</p>
                        <p className="text-xs text-gray-500">
                          {token.isSandbox ? 'Sandbox' : 'Production'} | Used {token.useCount}×
                          {token.lastUsedAt && ` | Last: ${new Date(token.lastUsedAt).toLocaleString('vi-VN')}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleToken(token)}
                      className={`p-1.5 rounded-lg ${token.isActive ? 'text-green-400 hover:bg-green-500/20' : 'text-gray-500 hover:bg-white/10'}`}
                    >
                      {token.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Queue */}
          {queueState && queueState.size > 0 && (
            <div className="bg-white/5 border border-amber-500/20 rounded-xl p-4">
              <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-amber-400" /> Live Queue ({queueState.size})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {queueState.items.map((item) => (
                  <div key={item.userId} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    <div className={`w-2 h-2 rounded-full ${
                      item.status === 'WAITING' ? 'bg-amber-400 animate-pulse' :
                      item.status === 'PROCESSING' ? 'bg-blue-400 animate-pulse' :
                      item.status === 'SUCCESS' ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">@{item.username}</p>
                      <p className="text-xs text-gray-500 font-mono truncate">{item.uid}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      item.status === 'WAITING' ? 'bg-amber-500/20 text-amber-400' :
                      item.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-400' :
                      item.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {item.position > 0 ? `#${item.position}` : item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Token Sets */}
      {activeTab === 'tokens' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openCreateToken} className="btn-primary flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Token Set
            </button>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-gray-500 text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Use Count</th>
                  <th className="px-4 py-3 font-medium">Last Used</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tokens.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">No token sets. Add one to enable activation.</td></tr>
                ) : tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-white font-medium">{token.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${token.isSandbox ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {token.isSandbox ? 'Sandbox' : 'Production'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{token.useCount}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleString('vi-VN') : 'Never'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleToken(token)} className={`flex items-center gap-1 ${token.isActive ? 'text-green-400' : 'text-gray-500'}`}>
                        {token.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        {token.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditToken(token)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteToken(token)} className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={logFilter.status}
              onChange={(e) => setLogFilter(f => ({ ...f, status: e.target.value }))}
              className="input py-1.5 text-sm"
            >
              <option value="">All Status</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAIL">FAIL</option>
              <option value="PROCESSING">PROCESSING</option>
            </select>
            <input
              type="date"
              value={logFilter.from}
              onChange={(e) => setLogFilter(f => ({ ...f, from: e.target.value }))}
              className="input py-1.5 text-sm"
            />
            <input
              type="date"
              value={logFilter.to}
              onChange={(e) => setLogFilter(f => ({ ...f, to: e.target.value }))}
              className="input py-1.5 text-sm"
            />
            <button onClick={() => loadLogs(1)} className="btn-outline text-sm">Filter</button>
          </div>

          {/* Table */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-gray-500 text-left">
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">UID</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Error</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">No logs found</td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-white font-mono">@{log.username}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.uid}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                        log.status === 'FAIL' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>{log.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-red-400 max-w-[200px] truncate">{log.errorMsg || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{logsTotal} total records</p>
              <div className="flex items-center gap-2">
                <button
                  disabled={logsPage <= 1}
                  onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400">Page {logsPage} / {totalPages}</span>
                <button
                  disabled={logsPage >= totalPages}
                  onClick={() => setLogsPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Config */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-white">Service Settings</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Service Enabled</p>
                <p className="text-xs text-gray-500">Enable/disable the Locket Gold service</p>
              </div>
              <button
                onClick={() => setConfigForm(f => ({ ...f, isEnabled: !f.isEnabled }))}
                className={`p-1.5 rounded-lg ${configForm.isEnabled ? 'text-green-400' : 'text-gray-500'}`}
              >
                {configForm.isEnabled ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Workers</label>
              <input
                type="number"
                min={1}
                max={10}
                value={configForm.numWorkers}
                onChange={(e) => setConfigForm(f => ({ ...f, numWorkers: parseInt(e.target.value) || 1 }))}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Daily Limit (per user)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={configForm.dailyLimit}
                onChange={(e) => setConfigForm(f => ({ ...f, dailyLimit: parseInt(e.target.value) || 5 }))}
                className="input w-full"
              />
            </div>
            <button onClick={saveConfig} disabled={configSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {configSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Settings
            </button>
          </div>

          {/* Broadcast */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-neon-cyan" /> Broadcast to Users
            </h3>
            <p className="text-xs text-gray-500">
              Gửi tin nhắn đến tất cả người dùng đã liên kết Telegram.
            </p>
            <textarea
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="Nhập tin nhắn muốn gửi..."
              rows={4}
              className="input w-full resize-none"
            />
            <button onClick={handleBroadcast} disabled={!broadcastMsg.trim() || broadcasting} className="btn-primary w-full flex items-center justify-center gap-2">
              {broadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send to All Users
            </button>
          </div>
        </div>
      )}

      {/* Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{editingToken ? 'Edit Token' : 'Add Token Set'}</h3>
              <button onClick={() => setShowTokenModal(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input value={tokenForm.name} onChange={e => setTokenForm(f => ({ ...f, name: e.target.value }))} className="input w-full" placeholder="Token 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Fetch Token *</label>
                <input value={tokenForm.fetchToken} onChange={e => setTokenForm(f => ({ ...f, fetchToken: e.target.value }))} className="input w-full font-mono text-xs" placeholder="ey..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">App Transaction *</label>
                <input value={tokenForm.appTransaction} onChange={e => setTokenForm(f => ({ ...f, appTransaction: e.target.value }))} className="input w-full font-mono text-xs" placeholder="ey..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Hash Params (optional)</label>
                <input value={tokenForm.hashParams} onChange={e => setTokenForm(f => ({ ...f, hashParams: e.target.value }))} className="input w-full font-mono text-xs" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Hash Headers (optional)</label>
                <input value={tokenForm.hashHeaders} onChange={e => setTokenForm(f => ({ ...f, hashHeaders: e.target.value }))} className="input w-full font-mono text-xs" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Sandbox Mode</p>
                  <p className="text-xs text-gray-500">Use RevenueCat sandbox environment</p>
                </div>
                <button onClick={() => setTokenForm(f => ({ ...f, isSandbox: !f.isSandbox }))}>
                  {tokenForm.isSandbox ? <ToggleRight className="w-7 h-7 text-blue-400" /> : <ToggleLeft className="w-7 h-7 text-gray-600" />}
                </button>
              </div>
              <button onClick={submitToken} disabled={tokenSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                {tokenSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingToken ? 'Update Token' : 'Create Token'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
