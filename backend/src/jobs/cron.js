import cron from 'node-cron';
import { notifyAdmin } from '../services/telegramService.js';
import { findOrdersByStatusesSince } from '../repositories/orderRepository.js';
import { listProducts } from '../repositories/productRepository.js';

export function startCronJobs() {
  // Bao cao doanh thu hang ngay luc 23:00
  cron.schedule('0 23 * * *', async () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const orders = await findOrdersByStatusesSince(['paid', 'delivered'], start);
    const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    await notifyAdmin(`📊 <b>Bao cao ngay</b>\nSo don: ${orders.length}\nDoanh thu: ${revenue.toLocaleString('vi-VN')} d`);
  });

  // Canh bao ton kho thap moi 6 gio
  cron.schedule('0 */6 * * *', async () => {
    const products = await listProducts({});
    const low = products.filter((p) => p.stock < 5);
    if (low.length) {
      await notifyAdmin(`⚠️ <b>Ton kho thap</b>\n` + low.map((p) => `- ${p.name}: ${p.stock}`).join('\n'));
    }
  });

  console.log('[cron] Đã khởi động các job định kỳ.');
}
