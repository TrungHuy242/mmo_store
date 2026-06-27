import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Ticket, Clock, CheckCircle, AlertTriangle, MessageSquare,
  Search, Filter, User, Clock as ClockIcon, Send, X,
  RefreshCw, ChevronLeft, ChevronRight, AlertCircle, Paperclip, Star
} from 'lucide-react';
import { adminTicketApi } from '../../api/ticket.api.js';
import { assetApi } from '../../api/asset.api.js';

// Image URL regex patterns
const IMAGE_URL_PATTERN = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?)/gi;

// Lightbox Modal Component
function LightboxModal({ src, alt, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-4xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={src}
          alt={alt || 'Attachment'}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </motion.div>
    </motion.div>
  );
}

// Extract image URLs from content
function extractImageUrls(content) {
  if (!content) return [];
  const matches = content.match(IMAGE_URL_PATTERN);
  return matches ? [...new Set(matches)] : [];
}

// Message with inline images
function AdminMessageContent({ content }) {
  const [lightboxImage, setLightboxImage] = useState(null);
  
  if (!content) return null;
  
  const imageUrls = extractImageUrls(content);
  let textContent = content;
  imageUrls.forEach(url => {
    textContent = textContent.replace(url, `[Hình ảnh đính kèm]`);
  });
  
  return (
    <>
      <p className="text-sm">{textContent}</p>
      
      {imageUrls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {imageUrls.map((url, idx) => (
            <motion.img
              key={idx}
              src={url}
              alt={`Attachment ${idx + 1}`}
              className="max-w-full max-h-32 rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-white/10"
              onClick={() => setLightboxImage(url)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              loading="lazy"
            />
          ))}
        </div>
      )}
      
      {lightboxImage && (
        <LightboxModal 
          src={lightboxImage} 
          alt="Attachment"
          onClose={() => setLightboxImage(null)} 
        />
      )}
    </>
  );
}

// File validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File quá lớn. Tối đa 5MB';
  }
  return null;
}

export default function AdminSupport() {
  const { t } = useTranslation();
  
  // State
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [replyLoading, setReplyLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [lightboxImage, setLightboxImage] = useState(null);
  
  const fileInputRef = useRef(null);
  const itemsPerPage = 10;

  // Load tickets
  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const res = await adminTicketApi.getAll(params);
      const data = res.data?.data || res.data || [];
      const pagination = res.data?.pagination || {};
      
      setTickets(Array.isArray(data) ? data : []);
      setTotal(pagination.total || 0);
      setTotalPages(pagination.totalPages || 1);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      toast.error('Không thể tải danh sách tickets');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  // Load ticket detail
  const loadTicketDetail = async (ticketId) => {
    setDetailLoading(true);
    try {
      const res = await adminTicketApi.getById(ticketId);
      setTicketDetail(res.data?.data || res.data);
    } catch (err) {
      console.error('Failed to load ticket detail:', err);
      toast.error('Không thể tải chi tiết ticket');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Handle ticket selection
  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    loadTicketDetail(ticket.id);
  };

  // Handle reply
  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return;
    
    setReplyLoading(true);
    try {
      // Upload attachments first if any
      let attachmentUrls = [];
      if (replyAttachments.length > 0) {
        for (const file of replyAttachments) {
          const formData = new FormData();
          formData.append('file', file);
          const res = await assetApi.upload(formData);
          attachmentUrls.push(res.data?.url || res.data?.data?.url);
        }
      }
      
      // Build content with image markdown
      let fullContent = reply;
      attachmentUrls.forEach(url => {
        fullContent += `\n\n![Hình ảnh đính kèm](${url})`;
      });
      
      await adminTicketApi.reply(selectedTicket.id, fullContent);
      toast.success('Đã gửi phản hồi');
      setReply('');
      setReplyAttachments([]);
      loadTicketDetail(selectedTicket.id);
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi phản hồi thất bại');
    } finally {
      setReplyLoading(false);
    }
  };

  // Handle file selection for reply
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newFiles = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }
      newFiles.push(file);
    }
    
    if (newFiles.length > 0) {
      setReplyAttachments(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle close ticket
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    
    try {
      await adminTicketApi.close(selectedTicket.id);
      toast.success('Đã đóng ticket');
      loadTicketDetail(selectedTicket.id);
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đóng ticket thất bại');
    }
  };

  // Calculate stats
  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const pendingCount = tickets.filter(t => t.status === 'PENDING').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  const statusConfig = {
    OPEN: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Mở' },
    PENDING: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Chờ xử lý' },
    RESOLVED: { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Đã giải quyết' },
    CLOSED: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'Đã đóng' },
  };

  const priorityConfig = {
    HIGH: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Cao' },
    MEDIUM: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Trung bình' },
    LOW: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'Thấp' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.support_center')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('admin.manage_tickets')}</p>
        </div>
        <button 
          onClick={() => loadTickets()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.refresh')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Mở', value: openCount, color: 'blue', icon: Ticket },
          { label: 'Chờ xử lý', value: pendingCount, color: 'amber', icon: Clock },
          { label: 'Đã giải quyết', value: resolvedCount, color: 'green', icon: CheckCircle },
          { label: 'Tổng tickets', value: total, color: 'purple', icon: MessageSquare },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
              </div>
              <span className="text-3xl font-bold">{loading ? '...' : stat.value}</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
          {/* Filters */}
          <div className="p-4 border-b border-white/5 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder={t('admin.search_tickets')} 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-colors" 
              />
            </div>
            <div className="flex gap-2">
              {['all', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'].map(status => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    statusFilter === status 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {status === 'all' ? 'Tất cả' : statusConfig[status]?.label || status}
                </button>
              ))}
            </div>
          </div>
          
          {/* Ticket List */}
          <div className="divide-y divide-white/5 max-h-[450px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p>Đang tải...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Không có ticket nào</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} onClick={() => handleSelectTicket(ticket)}
                  className={`p-4 cursor-pointer hover:bg-white/5 transition-all ${selectedTicket?.id === ticket.id ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-sm text-blue-400">#{ticket.id?.slice(0, 8)}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${statusConfig[ticket.status]?.color || 'bg-gray-500/10 text-gray-400'}`}>
                      {statusConfig[ticket.status]?.label || ticket.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-1 line-clamp-1">{ticket.subject}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate">{ticket.user?.email || ticket.customerEmail || 'Khách hàng'}</span>
                    <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Trang {currentPage}/{totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Ticket Detail */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-[#111827] to-[#0f172a] rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm flex flex-col">
          {selectedTicket ? (
            <>
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-blue-400">#{selectedTicket.id?.slice(0, 8)}</span>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${statusConfig[selectedTicket.status]?.color || ''}`}>
                      {statusConfig[selectedTicket.status]?.label || selectedTicket.status}
                    </span>
                    {selectedTicket.priority && (
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${priorityConfig[selectedTicket.priority]?.color || ''}`}>
                        {priorityConfig[selectedTicket.priority]?.label || selectedTicket.priority}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-medium">{selectedTicket.subject}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Tạo bởi: {selectedTicket.user?.email || selectedTicket.customerEmail || 'Không rõ'}
                </p>

                {/* Customer Rating Display */}
                {ticketDetail?.status === 'CLOSED' && ticketDetail?.rating && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-gradient-to-r from-neon-gold/10 to-neon-magenta/10 border border-neon-gold/20 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 fill-neon-gold text-neon-gold" />
                      <span className="text-xs font-medium text-neon-gold">Đánh giá từ khách hàng</span>
                    </div>
                    <div className="flex gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= ticketDetail.rating
                              ? 'fill-neon-gold text-neon-gold'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-white font-semibold">{ticketDetail.rating}/5</span>
                    </div>
                    {ticketDetail.feedback && (
                      <p className="text-xs text-gray-400 italic">"{ticketDetail.feedback}"</p>
                    )}
                  </motion.div>
                )}
              </div>
              
              {/* Messages */}
              <div className="flex-1 p-4 space-y-4 max-h-[350px] overflow-y-auto">
                {detailLoading ? (
                  <div className="text-center text-gray-500 py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                  </div>
                ) : ticketDetail?.replies?.length > 0 ? (
                  ticketDetail.replies.map((msg, idx) => (
                    <div key={msg.id || idx} className={`flex gap-3 ${msg.isAdmin || msg.user?.role === 'ADMIN' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        msg.isAdmin || msg.user?.role === 'ADMIN' 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                          : 'bg-white/10'
                      }`}>
                        {msg.isAdmin || msg.user?.role === 'ADMIN' ? 'A' : (msg.user?.username?.[0]?.toUpperCase() || 'U')}
                      </div>
                      <div className={`flex-1 ${msg.isAdmin || msg.user?.role === 'ADMIN' ? 'text-right' : ''}`}>
                        <div className={`inline-block max-w-[80%] p-3 rounded-xl ${
                          msg.isAdmin || msg.user?.role === 'ADMIN' 
                            ? 'bg-blue-500/20 text-blue-300' 
                            : 'bg-white/5 text-gray-300'
                        }`}>
                          <AdminMessageContent content={msg.content} />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleString('vi-VN') : ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa có phản hồi nào</p>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="p-4 border-t border-white/5 space-y-3">
                {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <input
                      type="text"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                      placeholder={t('admin.type_reply')}
                      className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                      title="Đính kèm hình ảnh"
                    >
                      <Paperclip className="w-5 h-5 text-gray-400" />
                    </button>
                    <button 
                      onClick={handleReply}
                      disabled={(!reply.trim() && replyAttachments.length === 0) || replyLoading}
                      className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {replyLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {t('common.send')}
                    </button>
                  </div>
                )}
                
                {/* Attachments Preview */}
                {replyAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {replyAttachments.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded-lg border border-white/10"
                        />
                        <button
                          onClick={() => removeAttachment(idx)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-end">
                  {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
                    <button 
                      onClick={handleCloseTicket}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Đóng Ticket
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('admin.select_ticket')}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
