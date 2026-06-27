import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ticketApi } from '../api';
import { assetApi } from '../api/asset.api.js';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Badge, Tabs, Skeleton } from '../components/ui';
import { X, Paperclip, Image, Send, Star } from 'lucide-react';

const statusColors = {
  OPEN: 'warning',
  PENDING: 'info',
  IN_PROGRESS: 'primary',
  RESOLVED: 'success',
  CLOSED: 'default',
};

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

// Message with inline images and lightbox
function MessageContent({ content }) {
  const [lightboxImage, setLightboxImage] = useState(null);
  
  if (!content) return null;
  
  const imageUrls = extractImageUrls(content);
  
  // Replace image URLs with placeholder text and render images separately
  let textContent = content;
  imageUrls.forEach(url => {
    textContent = textContent.replace(url, `[Hình ảnh đính kèm]`);
  });
  
  return (
    <>
      <p className="text-sm whitespace-pre-wrap">{textContent}</p>
      
      {imageUrls.length > 0 && (
        <div className={`mt-3 flex flex-wrap gap-2 ${imageUrls.length === 1 ? 'max-w-md' : ''}`}>
          {imageUrls.map((url, idx) => (
            <motion.img
              key={idx}
              src={url}
              alt={`Attachment ${idx + 1}`}
              className="max-w-full max-h-48 rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-white/10"
              onClick={() => setLightboxImage(url)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              loading="lazy"
            />
          ))}
        </div>
      )}
      
      <AnimatePresence>
        {lightboxImage && (
          <LightboxModal 
            src={lightboxImage} 
            alt="Attachment"
            onClose={() => setLightboxImage(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

// File attachment helper
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

export default function Support() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [replyUploading, setReplyUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createAttachments, setCreateAttachments] = useState([]);
  const [createUploading, setCreateUploading] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', content: '', priority: 'MEDIUM' });
  const [rating, setRating] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const createFileInputRef = useRef(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const res = await ticketApi.getMyTickets();
        setTickets(res.data?.data || res.data || []);
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  const fetchTicketDetails = async (ticketId) => {
    try {
      const res = await ticketApi.getById(ticketId);
      const ticket = res.data?.data || res.data;
      setSelectedTicket(ticket);
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedTicket) return;

    try {
      setSending(true);
      
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
      let fullContent = replyContent;
      attachmentUrls.forEach(url => {
        fullContent += `\n\n![Hình ảnh đính kèm](${url})`;
      });
      
      await ticketApi.reply(selectedTicket.id, fullContent);
      setReplyContent('');
      setReplyAttachments([]);
      await fetchTicketDetails(selectedTicket.id);
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle file selection for reply
  const handleReplyFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setReplyUploading(true);
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
    
    setReplyUploading(false);
    e.target.value = '';
  };

  // Remove attachment from reply
  const removeReplyAttachment = (index) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.content.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      setCreating(true);
      
      // Upload attachments first if any
      let attachmentUrls = [];
      if (createAttachments.length > 0) {
        for (const file of createAttachments) {
          const formData = new FormData();
          formData.append('file', file);
          const res = await assetApi.upload(formData);
          attachmentUrls.push(res.data?.url || res.data?.data?.url);
        }
      }
      
      // Build content with image markdown
      let fullContent = newTicket.content;
      attachmentUrls.forEach(url => {
        fullContent += `\n\n![Hình ảnh đính kèm](${url})`;
      });
      
      await ticketApi.create({
        subject: newTicket.subject,
        content: fullContent,
        priority: newTicket.priority,
      });
      
      toast.success('Tạo ticket thành công!');
      setShowCreateModal(false);
      setNewTicket({ subject: '', content: '', priority: 'MEDIUM' });
      setCreateAttachments([]);
      
      // Refresh tickets list
      const res = await ticketApi.getMyTickets();
      setTickets(res.data?.data || res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Tạo ticket thất bại');
    } finally {
      setCreating(false);
    }
  };

  // Handle file selection for new ticket
  const handleCreateFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setCreateUploading(true);
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
      setCreateAttachments(prev => [...prev, ...newFiles]);
    }
    
    setCreateUploading(false);
    e.target.value = '';
  };

  // Remove attachment from create form
  const removeCreateAttachment = (index) => {
    setCreateAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Submit rating
  const handleSubmitRating = async () => {
    if (!selectedTicket || rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }

    try {
      setSubmittingRating(true);
      await ticketApi.rate(selectedTicket.id, { rating, feedback });
      toast.success('Cảm ơn bạn đã đánh giá!');
      
      // Reset form
      setRating(0);
      setFeedback('');
      
      // Refresh ticket details
      await fetchTicketDetails(selectedTicket.id);
    } catch (error) {
      console.error('Failed to submit rating:', error);
      toast.error(error.response?.data?.error || 'Gửi đánh giá thất bại');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Reset rating when selecting different ticket
  useEffect(() => {
    if (selectedTicket) {
      setRating(0);
      setFeedback('');
      setRatingHover(0);
    }
  }, [selectedTicket?.id]);

  const tabs = [
    { id: 'all', label: `${t('common.all')} (${tickets.length})` },
    { id: 'open', label: `${t('support.open')} (${tickets.filter(t => t.status === 'OPEN' || t.status === 'PENDING').length})` },
    { id: 'resolved', label: `${t('support.resolved')} (${tickets.filter(t => t.status === 'RESOLVED').length})` },
  ];

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'all') return true;
    if (activeTab === 'open') return ticket.status === 'OPEN' || ticket.status === 'PENDING';
    if (activeTab === 'resolved') return ticket.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <section className="bg-bg-secondary border-b border-border py-8">
        <div className="container-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-text-primary mb-1">{t('support.support_center')}</h1>
            <p className="text-text-secondary">{t('support.get_help')}</p>
          </motion.div>
        </div>
      </section>

      <div className="container-lg py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">{t('support.my_tickets')}</h2>
                <Button size="sm" onClick={() => setShowCreateModal(true)}>
                  {t('support.new_ticket')}
                </Button>
              </div>
              
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
              
              <div className="mt-4 space-y-2 max-h-[500px] overflow-y-auto">
                {loading ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)
                ) : filteredTickets.length > 0 ? (
                  filteredTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        fetchTicketDetails(ticket.id);
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'hover:bg-bg-tertiary'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-mono text-xs text-primary">#{ticket.id}</span>
                        <Badge variant={statusColors[ticket.status] || 'default'}>
                          {ticket.status === 'OPEN' ? t('support.open') :
                           ticket.status === 'PENDING' ? t('support.pending') :
                           ticket.status === 'IN_PROGRESS' ? t('support.in_progress') :
                           ticket.status === 'RESOLVED' ? t('support.resolved') :
                           ticket.status === 'CLOSED' ? t('support.closed') : ticket.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-text-primary line-clamp-1">{ticket.subject}</p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-text-tertiary">
                    <p>{t('support.no_tickets')}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Ticket Detail */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {selectedTicket ? (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-text-primary">{selectedTicket.subject}</h2>
                      <p className="text-sm text-text-secondary mt-1">
                        {t('support.created')}: {new Date(selectedTicket.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={statusColors[selectedTicket.status] || 'default'}>
                      {selectedTicket.status === 'OPEN' ? t('support.open') :
                       selectedTicket.status === 'PENDING' ? t('support.pending') :
                       selectedTicket.status === 'IN_PROGRESS' ? t('support.in_progress') :
                       selectedTicket.status === 'RESOLVED' ? t('support.resolved') :
                       selectedTicket.status === 'CLOSED' ? t('support.closed') : selectedTicket.status}
                    </Badge>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Build combined messages array: original content + replies */}
                    {(() => {
                      const chatMessages = selectedTicket ? [
                        {
                          id: 'original',
                          content: selectedTicket.content,
                          createdAt: selectedTicket.createdAt,
                          isAdmin: false,
                        },
                        ...(selectedTicket.replies || []).map(reply => ({
                          ...reply,
                          isAdmin: reply.user?.role !== 'CUSTOMER'
                        }))
                      ] : [];
                      
                      return chatMessages.map((msg, i) => (
                        <div key={msg.id || i} className={`flex gap-3 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                            msg.isAdmin ? 'bg-primary text-white' : 'bg-bg-tertiary text-text-secondary'
                          }`}>
                            {msg.isAdmin ? 'A' : user?.name?.charAt(0) || 'U'}
                          </div>
                          <div className={`flex-1 ${msg.isAdmin ? 'text-right' : ''}`}>
                            <div className={`inline-block p-4 rounded-xl max-w-[85%] ${
                              msg.isAdmin 
                                ? 'bg-primary/10 text-text-primary' 
                                : 'bg-bg-tertiary text-text-primary'
                            }`}>
                              <MessageContent content={msg.content} />
                            </div>
                            <p className="text-xs text-text-tertiary mt-1">
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ));
                    })()}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Rating Section - Only show for CLOSED tickets without existing rating */}
                  {selectedTicket.status === 'CLOSED' && !selectedTicket.rating && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-gradient-to-r from-neon-magenta/10 to-neon-cyan/10 border border-neon-magenta/30 rounded-xl"
                    >
                      <div className="text-center mb-4">
                        <p className="text-white font-medium mb-1">
                          Ticket này đã được giải quyết
                        </p>
                        <p className="text-sm text-gray-400">
                          Bạn đánh giá thế nào về sự hỗ trợ của chúng tôi?
                        </p>
                      </div>

                      {/* Star Rating */}
                      <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setRatingHover(star)}
                            onMouseLeave={() => setRatingHover(0)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-8 h-8 transition-colors ${
                                star <= (ratingHover || rating)
                                  ? 'fill-neon-gold text-neon-gold'
                                  : 'text-gray-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Feedback Input */}
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Nhận xét của bạn (tùy chọn)..."
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 transition-colors resize-none mb-4"
                        rows={3}
                      />

                      <button
                        onClick={handleSubmitRating}
                        disabled={rating === 0 || submittingRating}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-magenta/20 to-neon-cyan/20 border border-neon-magenta/40 text-neon-magenta font-semibold hover:from-neon-magenta/30 hover:to-neon-cyan/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {submittingRating ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <Star className="w-5 h-5" />
                            Gửi đánh giá
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}

                  {/* Show existing rating if available */}
                  {selectedTicket.status === 'CLOSED' && selectedTicket.rating && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-5 h-5 fill-neon-gold text-neon-gold" />
                        <span className="text-white font-medium">Đánh giá của bạn</span>
                      </div>
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= selectedTicket.rating
                                ? 'fill-neon-gold text-neon-gold'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      {selectedTicket.feedback && (
                        <p className="text-sm text-gray-400 italic">{selectedTicket.feedback}</p>
                      )}
                    </motion.div>
                  )}

                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Input
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={t('support.type_message')}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                      />
                    </div>
                    
                    {/* Attachment Button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleReplyFileSelect}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl bg-bg-tertiary hover:bg-bg-primary border border-border transition-colors"
                      title="Đính kèm hình ảnh"
                    >
                      <Paperclip className="w-5 h-5 text-text-secondary" />
                    </button>
                    
                    <Button
                      onClick={handleSendReply}
                      disabled={(!replyContent.trim() && replyAttachments.length === 0) || sending}
                      loading={sending}
                    >
                      {sending ? 'Đang gửi...' : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  {/* Reply Attachments Preview */}
                  {replyAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {replyAttachments.map((file, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-16 h-16 object-cover rounded-lg border border-border"
                          />
                          <button
                            onClick={() => removeReplyAttachment(idx)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <svg className="w-16 h-16 mx-auto text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <h3 className="text-lg font-medium text-text-primary mb-2">{t('support.select_ticket')}</h3>
                  <p className="text-text-secondary">{t('support.choose_from_list')}</p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="lg:col-span-3 mt-8">
          <FAQSection />
        </div>
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1f35] rounded-2xl border border-white/10 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{t('support.create_ticket')}</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {t('support.subject')} <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder={t('support.enter_subject')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {t('support.message')} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                    rows={5}
                    value={newTicket.content}
                    onChange={(e) => setNewTicket({ ...newTicket, content: e.target.value })}
                    placeholder={t('support.describe_issue')}
                  />
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Hình ảnh đính kèm (tùy chọn)
                  </label>
                  <input
                    ref={createFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleCreateFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => createFileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:bg-white/10 transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                    Thêm hình ảnh
                  </button>
                  
                  {/* Attachments Preview */}
                  {createAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {createAttachments.map((file, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-20 h-20 object-cover rounded-lg border border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => removeCreateAttachment(idx)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                          <p className="text-xs text-gray-500 mt-1 truncate max-w-[80px]">{file.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {t('support.priority')}
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  >
                    <option value="LOW">{t('support.low')}</option>
                    <option value="MEDIUM">{t('support.medium')}</option>
                    <option value="HIGH">{t('support.high')}</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleCreateTicket}
                  disabled={!newTicket.subject.trim() || !newTicket.content.trim() || creating}
                  loading={creating}
                >
                  {t('support.create_ticket')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// FAQ Data
const faqData = [
  {
    id: 1,
    question: 'Đơn hàng của tôi bao lâu thì được bàn giao?',
    answer: 'MMO-Store tự động bàn giao key/tài khoản ngay lập tức sau khi xác nhận thanh toán thành công. Trong một số trường hợp đặc biệt, thời gian có thể kéo dài từ 5-30 phút.',
  },
  {
    id: 2,
    question: 'Chính sách bảo hành sản phẩm ra sao?',
    answer: 'Chúng tôi hỗ trợ bảo hành 1 đổi 1 trong vòng 7 ngày đối với các lỗi từ nhà sản xuất. Quý khách vui lòng gửi ticket kèm video và hình ảnh lỗi để được hỗ trợ nhanh chóng.',
  },
  {
    id: 3,
    question: 'Làm thế nào để rút tiền hoa hồng giới thiệu?',
    answer: 'Bạn vào Dashboard -> Affiliate -> Nhập số tiền tối thiểu 50k và thông tin ngân hàng để gửi yêu cầu. Yêu cầu sẽ được xử lý trong vòng 24 giờ làm việc.',
  },
  {
    id: 4,
    question: 'Tôi có thể thanh toán bằng những phương thức nào?',
    answer: 'MMO-Store hỗ trợ thanh toán qua: VietQR (chuyển khoản ngân hàng), USDT (TRC-20), và thẻ Visa/Mastercard. Tất cả thanh toán được xử lý tự động 24/7.',
  },
  {
    id: 5,
    question: 'Làm sao để trở thành đại lý của MMO-Store?',
    answer: 'Để trở thành đại lý, bạn cần có doanh số từ 5 triệu/tháng. Liên hệ bộ phận kinh doanh qua Telegram để được tư vấn chi tiết về chính sách và hoa hồng đại lý.',
  },
];

// FAQ Item Component
function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-white/5 -mx-4 px-4 rounded-lg transition-colors"
      >
        <span className="font-medium text-text-primary pr-4">{item.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-shrink-0"
        >
          <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-text-secondary text-sm leading-relaxed">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// FAQ Section Component
function FAQSection() {
  const [openId, setOpenId] = useState(null);

  const toggleItem = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-bg-secondary border border-border rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Câu hỏi thường gặp</h2>
          <p className="text-sm text-text-secondary">Giải đáp nhanh các thắc mắc phổ biến</p>
        </div>
      </div>

      <div className="space-y-0">
        {faqData.map((item) => (
          <FAQItem
            key={item.id}
            item={item}
            isOpen={openId === item.id}
            onToggle={() => toggleItem(item.id)}
          />
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-white/5">
        <p className="text-sm text-text-secondary text-center">
          Không tìm thấy câu trả lời?{' '}
          <button className="text-primary hover:underline font-medium">
            Liên hệ hỗ trợ
          </button>
        </p>
      </div>
    </motion.div>
  );
}
