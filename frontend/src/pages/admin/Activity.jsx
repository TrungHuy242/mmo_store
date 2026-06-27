import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ActivityIcon as ActivityIconIcon, Search, RefreshCw, Filter, Clock, User, Monitor,
  Globe, FileEdit, Trash2, Plus, Eye, EyeOff, LogIn, LogOut,
  Settings, Package, ShoppingCart, CreditCard, Ticket, Key,
  ChevronDown, ChevronUp, X, Loader2, ArrowUpDown
} from 'lucide-react';
import { auditApi } from '../../api/audit.api.js';

export default function ActivityIcon() {
  const { t } = useTranslation();
  
  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ actions: [], resources: [] });
  
  // Filter state
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Date filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Expanded log
  const [expandedLog, setExpandedLog] = useState(null);

  // Load audit logs
  const loadLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 50,
      };
      
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource = resourceFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await auditApi.getAll(params);
      const data = res.data;
      
      setLogs(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      setFilters(data.filters || { actions: [], resources: [] });
    } catch (err) {
      toast.error('Không thể tải nhật ký hoạt động');
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, resourceFilter, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Get action icon
  const getActionIcon = (action) => {
    const icons = {
      CREATE: <Plus className="w-4 h-4" />,
      UPDATE: <FileEdit className="w-4 h-4" />,
      DELETE: <Trash2 className="w-4 h-4" />,
      LOGIN: <LogIn className="w-4 h-4" />,
      LOGOUT: <LogOut className="w-4 h-4" />,
      ACTIVATE: <Eye className="w-4 h-4" />,
      DEACTIVATE: <EyeOff className="w-4 h-4" />,
    };
    return icons[action] || <ActivityIcon className="w-4 h-4" />;
  };

  // Get action color
  const getActionColor = (action) => {
    const colors = {
      CREATE: 'bg-green-500/10 text-green-400 border-green-500/20',
      UPDATE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
      LOGIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      LOGOUT: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      ACTIVATE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      DEACTIVATE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return colors[action] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  // Get resource icon
  const getResourceIcon = (resource) => {
    const lower = resource?.toLowerCase() || '';
    if (lower.includes('order')) return <ShoppingCart className="w-4 h-4" />;
    if (lower.includes('product')) return <Package className="w-4 h-4" />;
    if (lower.includes('payment')) return <CreditCard className="w-4 h-4" />;
    if (lower.includes('coupon')) return <Ticket className="w-4 h-4" />;
    if (lower.includes('license')) return <Key className="w-4 h-4" />;
    if (lower.includes('user') || lower.includes('customer')) return <User className="w-4 h-4" />;
    if (lower.includes('setting')) return <Settings className="w-4 h-4" />;
    return <ActivityIcon className="w-4 h-4" />;
  };

  // Format timestamp
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('vi-VN'),
      time: date.toLocaleTimeString('vi-VN'),
      full: date.toLocaleString('vi-VN'),
      relative: getRelativeTime(date),
    };
  };

  // Get relative time
  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setActionFilter('');
    setResourceFilter('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = search || actionFilter || resourceFilter || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Nhật ký hoạt động</h1>
          <p className="text-gray-400 text-sm mt-1">Theo dõi các thao tác của quản trị viên</p>
        </div>
        <button 
          onClick={() => loadLogs()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm theo email, tài nguyên, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            Bộ lọc
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-[#111827] border border-white/5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Action Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Hành động</label>
                    <select
                      value={actionFilter}
                      onChange={(e) => { setActionFilter(e.target.value); }}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                    >
                      <option value="">Tất cả</option>
                      {filters.actions?.map(f => (
                        <option key={f.action} value={f.action}>{f.action} ({f.count})</option>
                      ))}
                    </select>
                  </div>

                  {/* Resource Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Tài nguyên</label>
                    <select
                      value={resourceFilter}
                      onChange={(e) => setResourceFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                    >
                      <option value="">Tất cả</option>
                      {filters.resources?.map(f => (
                        <option key={f.resource} value={f.resource}>{f.resource} ({f.count})</option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Từ ngày</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Đến ngày</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Xóa bộ lọc
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng logs', value: pagination.total, color: 'cyan' },
          { label: 'Trang hiện tại', value: `${pagination.page}/${pagination.totalPages || 1}`, color: 'blue' },
          { label: 'Actions', value: filters.actions?.length || 0, color: 'purple' },
          { label: 'Resources', value: filters.resources?.length || 0, color: 'green' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }}
            className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 p-4 backdrop-blur-sm"
          >
            <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
            <p className="text-xl font-bold">{loading ? '...' : stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Timeline/Table View */}
      <div className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-16">Thao tác</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Người dùng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hành động</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tài nguyên</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IP / Thiết bị</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Đang tải...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                    <ActivityIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Không có nhật ký hoạt động nào</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const time = formatTime(log.createdAt);
                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-white">{log.userEmail || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getResourceIcon(log.resource)}
                          <div>
                            <span className="text-sm text-gray-300">{log.resource}</span>
                            {log.resourceId && (
                              <span className="text-xs text-gray-500 block font-mono">
                                ID: {log.resourceId.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {log.ipAddress && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Globe className="w-3 h-3" />
                              {log.ipAddress}
                            </div>
                          )}
                          {log.userAgent && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Monitor className="w-3 h-3" />
                              {log.userAgent.slice(0, 30)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-right">
                          <span className="text-sm text-gray-300">{time.relative}</span>
                          <span className="text-xs text-gray-500 block">{time.full}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expandedLog && logs.find(l => l.id === expandedLog) && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="border-t border-white/5 overflow-hidden"
            >
              {(() => {
                const log = logs.find(l => l.id === expandedLog);
                const time = formatTime(log.createdAt);
                return (
                  <div className="p-4 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-white">Chi tiết</h4>
                      <button
                        onClick={() => setExpandedLog(null)}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ID Log</p>
                        <p className="text-xs font-mono text-gray-300">{log.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">User ID</p>
                        <p className="text-xs font-mono text-gray-300">{log.userId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Resource ID</p>
                        <p className="text-xs font-mono text-gray-300">{log.resourceId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Thời gian</p>
                        <p className="text-xs text-gray-300">{time.full}</p>
                      </div>
                    </div>
                    {log.changes && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2">Thay đổi</p>
                        <pre className="p-3 rounded-lg bg-black/30 text-xs text-gray-300 overflow-x-auto">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong {pagination.total} logs
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              Trước
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => loadLogs(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      pagination.page === pageNum
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => loadLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
