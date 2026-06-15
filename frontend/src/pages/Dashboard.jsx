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

  useEffect(() => {
    api.get('/orders').then((r) => setOrders(r.data)).catch(() => {});
    api.get('/affiliate').then((r) => setAff(r.data)).catch(() => {});
  }, []);

  const copyRef = () => {
    navigator.clipboard.writeText(aff.refLink);
    toast.success('Da copy link gioi thieu');
  };

  const withdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error('Nhap so tien hop le');
    try {
      await api.post('/affiliate/withdraw', { amount: amt, method: 'bank', details });
      toast.success('Da gui yeu cau rut tien');
      setAmount(''); setDetails('');
      const r = await api.get('/affiliate'); setAff(r.data); refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'That bai');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass p-5"><p className="text-gray-400 text-sm">So du</p><p className="text-2xl font-bold text-neon-cyan">{(user?.balance || 0).toLocaleString('vi-VN')} d</p></div>
        <div className="glass p-5"><p className="text-gray-400 text-sm">Hoa hong</p><p className="text-2xl font-bold text-neon-gold">{(user?.commissionBalance || 0).toLocaleString('vi-VN')} d</p></div>
        <div className="glass p-5"><p className="text-gray-400 text-sm">Da gioi thieu</p><p className="text-2xl font-bold text-neon-magenta">{aff?.referredCount ?? 0}</p></div>
      </div>

      <div className="glass p-5">
        <h3 className="font-semibold mb-3">Link gioi thieu (hoa hong 10%)</h3>
        {aff && (
          <div className="flex gap-2">
            <input readOnly value={aff.refLink} className="input flex-1 text-sm" />
            <button onClick={copyRef} className="btn-neon">Copy</button>
          </div>
        )}
      </div>

      <div className="glass p-5">
        <h3 className="font-semibold mb-3">Rut hoa hong</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input" placeholder="So tien" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="input" placeholder="STK / thong tin nhan" value={details} onChange={(e) => setDetails(e.target.value)} />
          <button onClick={withdraw} className="btn-magenta whitespace-nowrap">Yeu cau rut</button>
        </div>
      </div>

      <div className="glass p-5">
        <h3 className="font-semibold mb-3">Lich su don hang</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-400 text-left"><th className="py-2">Ma</th><th>San pham</th><th>Tien</th><th>Trang thai</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-t border-white/5">
                  <td className="py-2 font-mono text-neon-gold">{o.code}</td>
                  <td>{o.productName}</td>
                  <td>{o.totalAmount.toLocaleString('vi-VN')} d</td>
                  <td><span className="px-2 py-0.5 rounded bg-white/5">{o.status}</span></td>
                </tr>
              ))}
              {!orders.length && <tr><td colSpan="4" className="py-4 text-center text-gray-500">Chua co don hang</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
