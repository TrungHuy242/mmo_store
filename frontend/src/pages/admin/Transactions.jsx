import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Search, Download, CreditCard, DollarSign, ArrowUpRight,
  ArrowDownRight, Clock, CheckCircle, XCircle, RefreshCw,
  ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import { adminApi } from '../../services/adminApi.js';

export default function AdminTransactions() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);

  const itemsPerPage = 15;

  // Load transactions
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (search) params.search = search;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const res = await adminApi.getTransactions(params);
      const data = res.success ? res.data : (res.data?.data || res.data || []);
      const pagination = res.pagination || res.data?.pagination || {};
      
      setTransactions(Array.isArray(data) ? data : []);
      setTotal(pagination.total || data.length);
      setTotalPages(pagination.totalPages || 1);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      toast.error('Không thể tải lịch sử giao dịch');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, typeFilter, statusFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // CSV Export Function
  const exportToCSV = async () => {
    setExporting(true);
    try {
      // Fetch all transactions without pagination
      const params = {};
      if (search) params.search = search;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      params.limit = 10000; // Get all transactions
      
      const res = await adminApi.getTransactions(params);
      const allTransactions = res.success ? res.data : (res.data?.data || res.data || []);
      
      if (!allTransactions.length) {
        toast.error('Không có dữ liệu để xuất');
        return;
      }

      // CSV Headers
      const headers = [
        'Mã GD',
        'Email',
        'Loại',
        'Số tiền',
        'Phí',
        'Số dư trước',
        'Số dư sau',
        'Trạng thái',
        'Ngày tạo',
        'Mô tả'
      ];

      // Type & Status labels
      const typeLabels = {
        INCOME: 'Thu nhập',
        WITHDRAWAL: 'Rút tiền',
        REFUND: 'Hoàn tiền',
        FEE: 'Phí',
        DEPOSIT: 'Nạp tiền',
        PURCHASE: 'Mua hàng',
      };
      const statusLabels = {
        COMPLETED: 'Hoàn thành',
        PENDING: 'Đang chờ',
        FAILED: 'Thất bại',
        CANCELLED: 'Đã hủy',
      };

      // Convert data to CSV rows
      const rows = allTransactions.map(txn => [
        txn.id || '',
        txn.user?.email || 'N/A',
        typeLabels[txn.type] || txn.type || '',
        Number(txn.amount || 0),
        Number(txn.fee || 0),
        Number(txn.balanceBefore || 0),
        Number(txn.balanceAfter || 0),
        statusLabels[txn.status] || txn.status || '',
        txn.createdAt ? new Date(txn.createdAt).toLocaleString('vi-VN') : '',
        txn.description || '',
      ]);

      // Escape CSV values (handle commas, quotes, newlines)
      const escapeCSV = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Build CSV string with BOM for Vietnamese
      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      // Add BOM for UTF-8 Vietnamese support
      const BOM = '\uFEFF';
      const finalCSV = BOM + csvContent;

      // Create download link
      const blob = new Blob([finalCSV], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `transactions_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Đã xuất ${allTransactions.length} giao dịch`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Không thể xuất file CSV');
    } finally {
      setExporting(false);
    }
  };

  // Calculate stats from real data
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  
  const totalWithdraw = transactions
    .filter(t => t.type === 'WITHDRAWAL')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  
  const totalFee = transactions
    .filter(t => t.status === 'COMPLETED')
    .reduce((acc, t) => acc + Number(t.fee || 0), 0);

  // Type configs
  const typeConfig = {
    INCOME: { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Thu nhập', icon: ArrowUpRight },
    WITHDRAWAL: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Rút tiền', icon: ArrowDownRight },
    REFUND: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Hoàn tiền', icon: RefreshCw },
    FEE: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Phí', icon: DollarSign },
    DEPOSIT: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Nạp tiền', icon: CreditCard },
  };

  const statusConfig = {
    COMPLETED: { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Hoàn thành' },
    PENDING: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Đang chờ' },
    FAILED: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Thất bại' },
    CANCELLED: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'Đã hủy' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.transactions')}</h1>
          <p className="text-gray-300 text-sm mt-1">{t('admin.view_transactions')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadTransactions()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
            aria-label={t('common.refresh')}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            {t('common.refresh')}
          </button>
          <button
            onClick={() => loadTransactions()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
            aria-label={t('common.refresh')}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            {t('common.refresh')}
          </button>
          <button
            onClick={exportToCSV}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm font-medium hover:bg-neon-cyan/20 transition-colors disabled:opacity-50"
            aria-label="Xuất CSV"
          >
            {exporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="w-4 h-4" aria-hidden="true" />
            )}
            {exporting ? 'Đang xuất...' : 'Xuất CSV'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
          className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">{t('admin.total_income')}</p>
              <p className="text-2xl font-bold text-green-400">
                {loading ? '...' : totalIncome.toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} 
          className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">{t('admin.total_withdrawals')}</p>
              <p className="text-2xl font-bold text-red-400">
                {loading ? '...' : totalWithdraw.toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} 
          className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300">{t('admin.total_fees')}</p>
              <p className="text-2xl font-bold text-blue-400">
                {loading ? '...' : totalFee.toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder={t('admin.search')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
        >
          <option value="all">Tất cả loại</option>
          <option value="INCOME">Thu nhập</option>
          <option value="WITHDRAWAL">Rút tiền</option>
          <option value="REFUND">Hoàn tiền</option>
          <option value="DEPOSIT">Nạp tiền</option>
          <option value="FEE">Phí</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="PENDING">Đang chờ</option>
          <option value="FAILED">Thất bại</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.transaction_id')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.customer')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.amount')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Phí</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Đang tải...</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Không có giao dịch nào</p>
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const typeStyle = typeConfig[txn.type] || typeConfig.INCOME;
                  const statusStyle = statusConfig[txn.status] || statusConfig.PENDING;
                  const isNegative = txn.type === 'WITHDRAWAL' || txn.type === 'REFUND' || txn.type === 'FEE';
                  
                  return (
                    <tr key={txn.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-blue-400">{txn.id?.slice(0, 12)}...</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full border ${typeStyle.color}`}>
                          {typeStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="text-white">{txn.user?.username || txn.user?.email || 'Khách hàng'}</p>
                          {txn.user?.email && (
                            <p className="text-xs text-gray-500">{txn.user.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-medium ${isNegative ? 'text-red-400' : 'text-green-400'}`}>
                          {isNegative ? '-' : '+'}{Number(txn.amount || 0).toLocaleString('vi-VN')}₫
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-400">
                          {txn.fee > 0 ? `${Number(txn.fee).toLocaleString('vi-VN')}₫` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full border ${statusStyle.color}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-500">
                          {txn.createdAt ? new Date(txn.createdAt).toLocaleString('vi-VN') : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} của {total} giao dịch
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
