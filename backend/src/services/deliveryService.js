import { decrypt } from '../utils/crypto.js';
import { findProductById, getAvailableStockItems, markStockItemsSold } from '../repositories/productRepository.js';
import { findUserById } from '../repositories/userRepository.js';
import { updateOrder } from '../repositories/orderRepository.js';
import { sendEmail, buildDeliveryEmail } from './emailService.js';
import { sendTelegram, notifyAdmin } from './telegramService.js';
import { payCommission } from './affiliateService.js';

// Giao hang tu dong khi don chuyen sang 'paid'.
// Lay stock item chua ban, ma hoa -> giai ma, gui email + telegram.
export async function fulfillOrder(order) {
  if (order.status === 'delivered') return order;

  const product = await findProductById(order.productId || order.product);
  if (!product) throw new Error('San pham khong ton tai');

  const available = await getAvailableStockItems(product.id, order.quantity);
  if (available.length < order.quantity) {
    throw new Error('Het hang truoc khi kip giao');
  }

  const delivered = available.slice(0, order.quantity).map((item) => decrypt(item.payload_enc));
  await markStockItemsSold(available.slice(0, order.quantity).map((item) => item.id), order.id);

  const updatedOrder = await updateOrder(order.id, {
    status: 'delivered',
    deliveredItems: delivered,
    deliveredAt: new Date(),
  });

  await payCommission(updatedOrder);

  const buyer = await findUserById(order.userId || order.user);
  if (buyer?.email) {
    await sendEmail({
      to: buyer.email,
      subject: `[MMO Store] Don hang #${order.code} da giao`,
      html: buildDeliveryEmail(updatedOrder, delivered),
    });
  }
  if (buyer?.telegramId) {
    const text = `<b>Don #${order.code} da giao!</b>\nSan pham: ${order.productName}\n\n` +
      delivered.map((d) => `<code>${d}</code>`).join('\n');
    await sendTelegram(buyer.telegramId, text);
  }

  const remaining = Math.max(product.stock - order.quantity, 0);
  if (remaining < 5) {
    await notifyAdmin(`⚠️ San pham <b>${product.name}</b> sap het hang (con ${remaining}).`);
  }

  return updatedOrder;
}
