import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/env.js';

let bot = null;

export function getBot() {
  return bot;
}

export function initBot() {
  if (!config.telegram.token) {
    console.warn('[telegram] Chưa cấu hình TELEGRAM_BOT_TOKEN, bot không khởi động.');
    return null;
  }
  if (config.telegram.useWebhook) {
    bot = new TelegramBot(config.telegram.token);
    const url = `${config.publicBaseUrl}/api/telegram/webhook/${config.telegram.webhookSecret}`;
    bot.setWebHook(url).then(() => console.log('[telegram] Webhook da set:', url))
      .catch((e) => console.error('[telegram] Loi set webhook:', e.message));
  } else {
    bot = new TelegramBot(config.telegram.token, { polling: true });
    console.log('[telegram] Bot chay che do polling.');
  }
  return bot;
}

export async function sendTelegram(chatId, text, options = {}) {
  if (!bot || !chatId) return false;
  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'HTML', ...options });
    return true;
  } catch (err) {
    console.error('[telegram] Loi gui tin:', err.message);
    return false;
  }
}

export async function notifyAdmin(text) {
  if (!config.telegram.adminChatId) return false;
  return sendTelegram(config.telegram.adminChatId, text);
}
