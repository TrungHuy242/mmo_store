import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user, refresh } = useAuth();
  const [orders, setOrders] = useState([]);
  const [aff, setAff] = useState(null);
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/orders').catch(() => ({ data: [] })),
      api.get('/affiliate').catch(() => ({ data: null })),
    ]).then(([ordersRes, affRes]) => {
      setOrders(ordersRes.data);
      setAff(affRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const copyRef = () => {
    if (aff?.refLink) {
      navigator.clipboard.writeText(aff.refLink);
      toast.success('Đã copy link giới thiệu');
    }
  };

  const withdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error('Nhập số tiền hợp lệ');
    if (!details.trim()) return toast.error('Nhập thông tin nhận tiền');
    try {
      await api.post('/affiliate/withdraw', { amount: amt, method: 'bank', details });
      toast.success('Đã gửi yêu cầu rút tiền');
      setAmount('');
      setDetails('');
      const r = await api.get('/affiliate');
      setAff(r.data);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thất bại');
    }
  };

  const statusColors = {
    pending: 'badge-warning',
    paid: 'badge-cyan',
    delivered: 'badge-success',
    cancelled: 'badge-danger',
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-6"
    >
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Xin chào, {user?.name || user?.email?.split('@')[0]}!</h1>
        <p className="text-gray-400">Quản lý tài khoản và đơn hàng của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-400">Số dư tài khoản</span>
          </div>
          <p className="stat-value text-neon-cyan">{(user?.balance || 0).toLocaleString('vi-VN')} đ</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-neon-gold/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-neon-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-400">Hoa hồng chờ rút</span>
          </div>
          <p className="stat-value text-neon-gold">{(user?.commissionBalance || 0).toLocaleString('vi-VN')} đ</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-neon-magenta/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-neon-magenta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-400">Người đã giới thiệu</span>
          </div>
          <p className="stat-value text-neon-magenta">{aff?.referredCount ?? 0}</p>
        </motion.div>
      </div>

      {/* Affiliate Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">Link giới thiệu của bạn</h3>
            <p className="text-xs text-gray-400">Nhận 10% hoa hồng khi người khác đăng ký qua link của bạn</p>
          </div>
        </div>
        
        {aff && (
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              readOnly 
              value={aff.refLink || ''} 
              className="input flex-1 text-sm font-mono" 
            />
            <button onClick={copyRef} className="btn-neon whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Sao chép
            </button>
          </div>
        )}
      </motion.div>

      {/* Withdraw Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-neon-gold/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-neon-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">Rút hoa hồng</h3>
            <p className="text-xs text-gray-400">Tối thiểu 50,000đ - Xử lý trong 24h</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input 
              className="input" 
              placeholder="Số tiền muốn rút (VNĐ)" 
              type="number"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
            />
          </div>
          <div className="flex-1">
            <input 
              className="input" 
              placeholder="Số tài khoản / STK nhận tiền" 
              value={details} 
              onChange={(e) => setDetails(e.target.value)} 
            />
          </div>
          <button 
            onClick={withdraw} 
            className="btn-gold whitespace-nowrap"
            disabled={!amount || !details}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            Rút tiền
          </button>
        </div>
      </motion.div>

      {/* Orders History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-semibold">Lịch sử đơn hàng</h3>
          </div>
          <span className="text-sm text-gray-400">{orders.length} đơn hàng</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : orders.length ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Sản phẩm</th>
                  <th>Số tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-neon-gold">{o.code}</td>
                    <td>{o.productName}</td>
                    <td>{o.totalAmount?.toLocaleString('vi-VN')} đ</td>
                    <td className="capitalize">{o.paymentMethod}</td>
                    <td>
                      <span className={`badge ${statusColors[o.status] || 'badge-warning'}`}>
                        {o.status === 'pending' ? 'Chờ xử lý' : 
                         o.status === 'paid' ? 'Đã thanh toán' : 
                         o.status === 'delivered' ? 'Đã giao' : 'Đã hủy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-400">Chưa có đơn hàng nào</p>
            <a href="/" className="text-neon-cyan text-sm hover:underline mt-2 inline-block">
              Khám phá sản phẩm
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
