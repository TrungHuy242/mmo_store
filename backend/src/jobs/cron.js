import cron from 'node-cron';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { notifyAdmin } from '../services/telegramService.js';

export function startCronJobs() {
  // Bao cao doanh thu hang ngay luc 23:00
  cron.schedule('0 23 * * *', async () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const orders = await Order.find({ status: { $in: ['paid', 'delivered'] }, createdAt: { $gte: start } });
    const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    await notifyAdmin(`📊 <b>Bao cao ngay</b>\nSo don: ${orders.length}\nDoanh thu: ${revenue.toLocaleString('vi-VN')} d`);
  });

  // Canh bao ton kho thap moi 6 gio
  cron.schedule('0 */6 * * *', async () => {
    const products = await Product.find({ isActive: true });
    const low = products.filter((p) => p.stock < 5);
    if (low.length) {
      await notifyAdmin(`⚠️ <b>Ton kho thap</b>\n` + low.map((p) => `- ${p.name}: ${p.stock}`).join('\n'));
    }
  });

  console.log('[cron] Da khoi dong cac job dinh ky.');
}
