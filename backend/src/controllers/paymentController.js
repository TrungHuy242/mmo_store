import { fulfillOrder } from '../services/deliveryService.js';
import { verifyCassoToken, extractOrderCode } from '../services/payment/vietqrService.js';
import { getRecentUsdtTransfers, matchTransfer } from '../services/payment/usdtService.js';
import { chargeCard } from '../services/payment/cardService.js';
import { findOrderByCodeStatus, findOrderByIdAndUser, findOrderByCode, updateOrder } from '../repositories/orderRepository.js';

// ===== Webhook Casso (VietQR / bank transfer auto-check) =====
// Casso gui header Secure-Token de verify.
export async function cassoWebhook(req, res) {
  const token = req.headers['secure-token'] || req.headers['x-secure-token'];
  if (!verifyCassoToken(token)) {
    return res.status(401).json({ error: 1, message: 'Secure token không hợp lệ' });
  }
  const records = req.body?.data || [];
  let matched = 0;
  for (const r of records) {
    const code = extractOrderCode(r.description);
    if (!code) continue;
    const order = await findOrderByCodeStatus(code, 'pending', 'bank');
    if (!order) continue;
    if (Number(r.amount) >= order.totalAmount) {
      const updated = await updateOrder(order.id, {
        status: 'paid',
        paymentMeta: { ...order.paymentMeta, cassoTid: r.tid, amount: r.amount },
      });
      await fulfillOrder(updated);
      matched++;
    }
  }
  res.json({ error: 0, message: `Đã xử lý ${matched} đơn` });
}

// ===== Kiem tra USDT TRC20 thu cong (user bam 'da chuyen') =====
export async function checkUsdt(req, res) {
  const order = await findOrderByIdAndUser(req.params.id, req.user.id);
  if (!order || order.paymentMethod !== 'usdt') return res.status(404).json({ message: 'Không tìm thấy đơn' });
  if (order.status !== 'pending') return res.json({ order, message: 'Đơn đã xử lý' });

  const transfers = await getRecentUsdtTransfers(40);
  const match = matchTransfer(transfers, order.totalAmount);
  if (match) {
    const updated = await updateOrder(order.id, {
      status: 'paid',
      paymentMeta: { ...order.paymentMeta, txid: match.txid, from: match.from },
    });
    await fulfillOrder(updated);
    return res.json({ order: updated, paid: true });
  }
  res.json({ order, paid: false, message: 'Chưa nhận được thanh toán' });
}

// ===== Nap the cao (TheSieuRe) =====
export async function chargeCardOrder(req, res) {
  const order = await findOrderByIdAndUser(req.params.id, req.user.id);
  if (!order || order.paymentMethod !== 'card') return res.status(404).json({ message: 'Không tìm thấy đơn' });
  const { telco, code, serial } = req.body;

  const result = await chargeCard({
    telco, code, serial, amount: order.totalAmount, requestId: order.code,
  });

  if (result.fallback) {
    const updated = await updateOrder(order.id, {
      paymentMeta: { ...order.paymentMeta, card: { telco, serial }, pendingManual: true },
    });
    return res.json({ order: updated, pendingManual: true, message: result.message });
  }
  const updated = await updateOrder(order.id, {
    paymentMeta: { ...order.paymentMeta, cardResult: result.data || result.error },
  });
  res.json({ order: updated, message: 'Đã gửi yêu cầu gạch thẻ, chờ kết quả callback.' });
}

// Callback tu TheSieuRe (sau khi gach the xong)
export async function cardCallback(req, res) {
  const { verifyCardCallback } = await import('../services/payment/cardService.js');
  if (!verifyCardCallback(req.body)) {
    return res.status(401).json({ message: 'Chữ ký không hợp lệ' });
  }
  const { request_id, status } = req.body;
  const order = await findOrderByCode(request_id);
  if (order && String(status) === '1' && order.status === 'pending' && order.paymentMethod === 'card') {
    const updated = await updateOrder(order.id, { status: 'paid' });
    await fulfillOrder(updated);
  }
  res.json({ message: 'OK' });
}
