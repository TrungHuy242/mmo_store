import Product from '../models/Product.js';
import User from '../models/User.js';
import { sendEmail, buildDeliveryEmail } from './emailService.js';
import { sendTelegram, notifyAdmin } from './telegramService.js';
import { payCommission } from './affiliateService.js';

// Giao hang tu dong khi don chuyen sang 'paid'.
// Lay stock item chua ban, ma hoa -> giai ma, gui email + telegram.
export async function fulfillOrder(order) {
  if (order.status === 'delivered') return order;

  const product = await Product.findById(order.product);
  if (!product) throw new Error('San pham khong ton tai');

  const available = product.stockItems.filter((s) => !s.sold);
  if (available.length < order.quantity) {
    throw new Error('Het hang truoc khi kip giao');
  }

  const delivered = [];
  for (let i = 0; i < order.quantity; i++) {
    const item = available[i];
    item.sold = true;
    item.soldTo = order._id;
    delivered.push(product.decryptItem(item));
  }
  await product.save();

  order.deliveredItems = delivered;
  order.deliveredAt = new Date();
  order.status = 'delivered';

  // Chi hoa hong affiliate
  await payCommission(order);
  await order.save();

  // Gui email + telegram cho nguoi mua
  const buyer = await User.findById(order.user);
  if (buyer?.email) {
    await sendEmail({
      to: buyer.email,
      subject: `[MMO Store] Don hang #${order.code} da giao`,
      html: buildDeliveryEmail(order, delivered),
    });
  }
  if (buyer?.telegramId) {
    const text = `<b>Don #${order.code} da giao!</b>\nSan pham: ${order.productName}\n\n` +
      delivered.map((d) => `<code>${d}</code>`).join('\n');
    await sendTelegram(buyer.telegramId, text);
  }

  // Canh bao ton kho thap cho admin
  const remaining = product.stockItems.filter((s) => !s.sold).length;
  if (remaining < 5) {
    await notifyAdmin(`⚠️ San pham <b>${product.name}</b> sap het hang (con ${remaining}).`);
  }

  return order;
}
