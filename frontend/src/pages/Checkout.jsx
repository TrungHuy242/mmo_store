import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/client.js';

const METHODS = [
  { id: 'balance', label: 'So du tai khoan' },
  { id: 'bank', label: 'Chuyen khoan (VietQR)' },
  { id: 'usdt', label: 'USDT TRC20' },
  { id: 'card', label: 'The cao' },
];

export default function Checkout() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [method, setMethod] = useState('balance');
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [card, setCard] = useState({ telco: 'VIETTEL', code: '', serial: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/products/${productId}`).then((r) => setProduct(r.data)).catch(() => toast.error('Khong tai duoc san pham'));
  }, [productId]);

  const createOrder = async () => {
    setLoading(true);
    try {
      const res = await api.post('/orders', { productId, quantity: 1, paymentMethod: method });
      setOrder(res.data.order);
      setPayment(res.data.payment);
      if (res.data.paid) {
        toast.success('Thanh toan thanh cong! San pham da gui.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tao don that bai');
    } finally { setLoading(false); }
  };

  const checkUsdt = async () => {
    const res = await api.post(`/orders/${order._id}/check-usdt`);
    if (res.data.paid) { toast.success('Da nhan thanh toan! San pham da gui.'); navigate('/dashboard'); }
    else toast('Chua nhan duoc thanh toan, thu lai sau.');
  };

  const chargeCard = async () => {
    if (!card.code || !card.serial) return toast.error('Nhap ma the va serial');
    const res = await api.post(`/orders/${order._id}/charge-card`, card);
    toast(res.data.message || 'Da gui yeu cau gach the');
  };

  if (!product) return <p className="text-center text-gray-400 py-12">Dang tai...</p>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto glass p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">Thanh toan: {product.name}</h2>
      <p className="text-neon-cyan text-lg font-bold mb-4">{(product.effectivePrice ?? product.price).toLocaleString('vi-VN')} d</p>

      {!order ? (
        <>
          <p className="text-sm text-gray-400 mb-2">Chon phuong thuc thanh toan:</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {METHODS.map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)} className={`p-3 rounded-xl border text-sm transition ${method === m.id ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' : 'border-white/10 text-gray-300'}`}>{m.label}</button>
            ))}
          </div>
          <button disabled={loading} onClick={createOrder} className="btn-neon w-full">{loading ? 'Dang xu ly...' : 'Tao don hang'}</button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="text-sm">Ma don: <span className="text-neon-gold font-mono">{order.code}</span></div>

          {payment?.method === 'bank' && (
            <div className="text-center space-y-2">
              <img src={payment.qrUrl} alt="VietQR" className="mx-auto rounded-xl max-w-xs w-full" />
              <p className="text-sm text-gray-400">{payment.note}</p>
              <p className="text-xs text-gray-500">He thong tu dong xac nhan qua Casso sau khi ban chuyen khoan.</p>
            </div>
          )}

          {payment?.method === 'usdt' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">{payment.note}</p>
              <button onClick={checkUsdt} className="btn-neon w-full">Toi da chuyen, kiem tra</button>
            </div>
          )}

          {payment?.method === 'card' && (
            <div className="space-y-2">
              <select className="input" value={card.telco} onChange={(e) => setCard({ ...card, telco: e.target.value })}>
                <option value="VIETTEL">Viettel</option>
                <option value="MOBIFONE">Mobifone</option>
                <option value="VINAPHONE">Vinaphone</option>
              </select>
              <input className="input" placeholder="Ma the" value={card.code} onChange={(e) => setCard({ ...card, code: e.target.value })} />
              <input className="input" placeholder="Serial" value={card.serial} onChange={(e) => setCard({ ...card, serial: e.target.value })} />
              <button onClick={chargeCard} className="btn-neon w-full">Gach the</button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
