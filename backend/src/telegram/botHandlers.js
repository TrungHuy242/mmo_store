import { getBot } from '../services/telegramService.js';
import { config } from '../config/env.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// Dang ky cac lenh cho bot. Goi sau khi initBot().
export function registerBotHandlers() {
  const bot = getBot();
  if (!bot) return;

  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text =
      `<b>Chao mung den MMO Store!</b>\n\n` +
      `Mua san pham MMO tu dong: tai khoan, proxy, tool, the cao...\n\n` +
      `Web: ${config.frontendUrl}\n\n` +
      `Lenh: /products /order [id] /status [ma] /aff /help`;
    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  });

  bot.onText(/\/help/, async (msg) => {
    await bot.sendMessage(msg.chat.id,
      `<b>Huong dan</b>\n/products - Danh sach san pham\n/order [product_id] - Tao don\n/status [ma_don] - Kiem tra don\n/aff - Link gioi thieu + hoa hong\n/help - Tro giup`,
      { parse_mode: 'HTML' });
  });

  bot.onText(/\/products/, async (msg) => {
    const products = await Product.find({ isActive: true }).limit(10).populate('category', 'name');
    if (!products.length) return bot.sendMessage(msg.chat.id, 'Chua co san pham.');
    for (const p of products) {
      await bot.sendMessage(msg.chat.id,
        `<b>${p.name}</b>\nGia: ${p.price.toLocaleString('vi-VN')} d\nCon: ${p.stock}\n${p.description || ''}`,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: 'Mua ngay', callback_data: `buy:${p._id}` }]] },
        });
    }
  });

  bot.on('callback_query', async (q) => {
    const data = q.data || '';
    if (data.startsWith('buy:')) {
      const productId = data.slice(4);
      await bot.answerCallbackQuery(q.id);
      await bot.sendMessage(q.message.chat.id,
        `De dat hang san pham nay, go: /order ${productId}\nHoac mua tren web: ${config.frontendUrl}`);
    }
  });

  bot.onText(/\/order\s+(\S+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const productId = match[1];
    const user = await User.findOne({ telegramId: String(chatId) });
    if (!user) {
      return bot.sendMessage(chatId, `Ban can lien ket tai khoan truoc. Dang nhap web va lien ket Telegram: ${config.frontendUrl}`);
    }
    const product = await Product.findById(productId).catch(() => null);
    if (!product || !product.isActive) return bot.sendMessage(chatId, 'San pham khong kha dung.');
    if (product.stock < 1) return bot.sendMessage(chatId, 'San pham da het hang.');
    await bot.sendMessage(chatId,
      `Tao don cho <b>${product.name}</b> - ${product.price.toLocaleString('vi-VN')} d.\nVui long hoan tat thanh toan tren web: ${config.frontendUrl}`,
      { parse_mode: 'HTML' });
  });

  bot.onText(/\/status\s+(\S+)/, async (msg, match) => {
    const order = await Order.findOne({ code: match[1].toUpperCase() });
    if (!order) return bot.sendMessage(msg.chat.id, 'Khong tim thay don.');
    await bot.sendMessage(msg.chat.id, `Don #${order.code}: <b>${order.status}</b>`, { parse_mode: 'HTML' });
  });

  bot.onText(/\/aff/, async (msg) => {
    const user = await User.findOne({ telegramId: String(msg.chat.id) });
    if (!user) return bot.sendMessage(msg.chat.id, `Lien ket tai khoan truoc tai: ${config.frontendUrl}`);
    await bot.sendMessage(msg.chat.id,
      `Link gioi thieu:\n${config.frontendUrl}/register?ref=${user.refCode}\n\nHoa hong hien tai: ${user.commissionBalance.toLocaleString('vi-VN')} d`);
  });
}
