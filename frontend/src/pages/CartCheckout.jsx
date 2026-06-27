import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../store';
import api from '../api/client.js';
import toast from 'react-hot-toast';

export default function CartCheckout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, clear } = useCartStore();
  const [method, setMethod] = useState('balance');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto glass p-8 mt-6 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h2 className="text-xl font-bold mb-2">{t('cart_checkout.empty_cart')}</h2>
        <p className="text-gray-400 mb-4">{t('cart_checkout.add_products_first')}</p>
        <button onClick={() => navigate('/')} className="btn-neon">{t('cart_checkout.continue_shopping')}</button>
      </div>
    );
  }

  const createOrders = async () => {
    setLoading(true);
    try {
      const orderPromises = items.map(item =>
        api.post('/orders', {
          productId: item.id,
          quantity: item.quantity,
          paymentMethod: method,
        })
      );
      const results = await Promise.all(orderPromises);
      const newOrders = results.map(r => r.data);
      setOrders(newOrders);

      if (method === 'balance') {
        const allPaid = newOrders.every(o => o.paid);
        if (allPaid) {
          toast.success(t('cart_checkout.payment_success'));
          clear();
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('checkout.create_order_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass p-8 mt-6 space-y-6">
      <h2 className="text-2xl font-bold">{t('checkout.checkout')}</h2>
      
      {/* Items */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 p-4 bg-white/5 rounded-xl">
            <img
              src={item.image || `https://picsum.photos/60?random=${item.id}`}
              alt={item.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-sm text-gray-400">
                {t('checkout.qty')}: {item.quantity}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">
                {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Method */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="font-semibold mb-4">{t('checkout.payment_method')}</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer">
            <input
              type="radio"
              name="method"
              value="balance"
              checked={method === 'balance'}
              onChange={(e) => setMethod(e.target.value)}
              className="w-4 h-4"
            />
            <span>{t('cart_checkout.balance_payment')}</span>
          </label>
          <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer">
            <input
              type="radio"
              name="method"
              value="qr"
              checked={method === 'qr'}
              onChange={(e) => setMethod(e.target.value)}
              className="w-4 h-4"
            />
            <span>{t('cart_checkout.qr_payment')}</span>
          </label>
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-white/10 pt-6">
        <div className="flex justify-between text-lg font-bold">
          <span>{t('common.total')}</span>
          <span>
            {items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0).toLocaleString('vi-VN')}₫
          </span>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={createOrders}
        disabled={loading}
        className="btn-neon w-full"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('common.loading')}
          </span>
        ) : (
          t('common.checkout')
        )}
      </button>
    </div>
  );
}
