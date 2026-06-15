import Order from '../models/Order.js';
import User from '../models/User.js';
import { fulfillOrder } from '../services/deliveryService.js';
import { verifyCassoToken, extractOrderCode } from '../services/payment/vietqrService.js';
import { getRecentUsdtTransfers, matchTransfer } from '../services/payment/usdtService.js';
import { chargeCard } from '../services/payment/cardService.js';

// ===== Webhook Casso (VietQR / bank transfer auto-check) =====
// Casso gui header Secure-Token de verify.
export async function cassoWebhook(req, res) {
  const token = req.headers['secure-token'] || req.headers['x-secure-token'];
  if (!verifyCassoToken(token)) {
    return res.status(401).json({ error: 1, message: 'Secure token khong hop le' });
  }
  const records = req.body?.data || [];
  let matched = 0;
  for (const r of records) {
    const code = extractOrderCode(r.description);
    if (!code) continue;
    const order = await Order.findOne({ code, status: 'pending', paymentMethod: 'bank' });
    if (!order) continue;
    if (Number(r.amount) >= order.totalAmount) {
      order.status = 'paid';
      order.paymentMeta = { ...order.paymentMeta, cassoTid: r.tid, amount: r.amount };
      await order.save();
      await fulfillOrder(order);
      matched++;
    }
  }
  res.json({ error: 0, message: `Da xu ly ${matched} don` });
}

// ===== Kiem tra USDT TRC20 thu cong (user bam 'da chuyen') =====
export async function checkUsdt(req, res) {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id, paymentMethod: 'usdt' });
  if (!order) return res.status(404).json({ message: 'Khong tim thay don' });
  if (order.status !== 'pending') return res.json({ order, message: 'Don da xu ly' });

  const transfers = await getRecentUsdtTransfers(40);
  const match = matchTransfer(transfers, order.totalAmount);
  if (match) {
    order.status = 'paid';
    order.paymentMeta = { ...order.paymentMeta, txid: match.txid, from: match.from };
    await order.save();
    await fulfillOrder(order);
    return res.json({ order, paid: true });
  }
  res.json({ order, paid: false, message: 'Chua nhan duoc thanh toan' });
}

// ===== Nap the cao (TheSieuRe) =====
export async function chargeCardOrder(req, res) {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id, paymentMethod: 'card' });
  if (!order) return res.status(404).json({ message: 'Khong tim thay don' });
  const { telco, code, serial } = req.body;

  const result = await chargeCard({
    telco, code, serial, amount: order.totalAmount, requestId: order.code,
  });

  if (result.fallback) {
    order.paymentMeta = { ...order.paymentMeta, card: { telco, serial }, pendingManual: true };
    await order.save();
    return res.json({ order, pendingManual: true, message: result.message });
  }
  order.paymentMeta = { ...order.paymentMeta, cardResult: result.data || result.error };
  await order.save();
  res.json({ order, message: 'Da gui yeu cau gach the, cho ket qua callback.' });
}

// Callback tu TheSieuRe (sau khi gach the xong)
export async function cardCallback(req, res) {
  const { verifyCardCallback } = await import('../services/payment/cardService.js');
  if (!verifyCardCallback(req.body)) {
    return res.status(401).json({ message: 'Chu ky khong hop le' });
  }
  const { request_id, status } = req.body;
  const order = await Order.findOne({ code: request_id, paymentMethod: 'card' });
  if (order && String(status) === '1' && order.status === 'pending') {
    order.status = 'paid';
    await order.save();
    await fulfillOrder(order);
  }
  res.json({ message: 'OK' });
}
