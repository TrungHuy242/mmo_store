import config from '../../config/index.js';
import prisma from '../../database/prisma.js';

let bot = null;
let isListening = false;

class TelegramService {
  isEnabled() {
    return config.telegram.notificationsEnabled && config.telegram.botToken;
  }

  async getBot() {
    if (!this.isEnabled()) return null;
    
    if (!bot) {
      const TelegramBot = (await import('node-telegram-bot-api')).default;
      bot = new TelegramBot(config.telegram.botToken, { polling: true });
    }
    
    return bot;
  }

  // Initialize bot listener for incoming messages (link commands)
  async initBotListener() {
    if (!this.isEnabled() || isListening) return;
    
    try {
      const telegramBot = await this.getBot();
      if (!telegramBot) return;

      // Handle /start command with link code
      telegramBot.onText(/\/start link_(.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const linkCode = match[1];

        console.log(`📱 Telegram link request: ${linkCode} from user ${msg.from.username || msg.from.id}`);

        try {
          // Find user with this link code that hasn't expired
          const user = await prisma.user.findFirst({
            where: {
              telegramLinkCode: linkCode,
              telegramLinkedAt: null,
            },
          });

          if (!user) {
            await telegramBot.sendMessage(chatId, 
              '❌ Mã liên kết đã hết hạn hoặc không tồn tại. Vui lòng lấy mã mới ở trang Profile và thử lại.'
            );
            return;
          }

          // Check if code has expired (24 hours)
          const codeAge = Date.now() - new Date(user.telegramLinkCodeGeneratedAt).getTime();
          const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
          
          if (user.telegramLinkCodeGeneratedAt && codeAge > EXPIRY_MS) {
            await telegramBot.sendMessage(chatId, 
              '❌ Mã liên kết đã hết hạn (sau 24 giờ). Vui lòng lấy mã mới ở trang Profile và thử lại.'
            );
            return;
          }

          // Update user with Telegram info
          await prisma.user.update({
            where: { id: user.id },
            data: {
              telegramId: msg.from.id.toString(),
              telegramUsername: msg.from.username || null,
              telegramLinkedAt: new Date(),
              telegramLinkCode: null,
              telegramLinkCodeGeneratedAt: null,
            },
          });

          await telegramBot.sendMessage(chatId, 
            '🎉 Chúc mừng! Tài khoản MMO-Store của bạn đã liên kết thành công với Telegram.\n\n' +
            'Từ giờ bạn sẽ nhận được thông báo đơn hàng qua Telegram.'
          );

          console.log(`✅ User ${user.email} linked with Telegram @${msg.from.username}`);

        } catch (error) {
          console.error('Telegram link error:', error);
          await telegramBot.sendMessage(chatId, 
            '❌ Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.'
          );
        }
      });

      // Handle /start without link code
      telegramBot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        await telegramBot.sendMessage(chatId, 
          '👋 Chào mừng đến với MMO-Store Bot!\n\n' +
          'Để liên kết tài khoản, hãy vào trang Profile và nhấn "Lấy mã liên kết Telegram".\n' +
          'Sau đó quay lại đây và nhấn /start với mã được cung cấp.'
        );
      });

      // Handle /help command
      telegramBot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        await telegramBot.sendMessage(chatId, 
          '📖 <b>Trợ giúp</b>\n\n' +
          '• /start - Bắt đầu hoặc liên kết tài khoản\n' +
          '• /me - Xem số dư và license keys\n' +
          '• /status - Kiểm tra trạng thái liên kết\n' +
          '• /help - Xem trợ giúp\n\n' +
          'Liên hệ hỗ trợ nếu cần giúp đỡ.',
          { parse_mode: 'HTML' }
        );
      });

      // Handle /status command
      telegramBot.onText(/\/status/, async (msg) => {
        const chatId = msg.chat.id;
        const telegramId = msg.from.id.toString();

        const user = await prisma.user.findFirst({
          where: { telegramId },
        });

        if (user) {
          await telegramBot.sendMessage(chatId, 
            `✅ <b>Tài khoản đã liên kết</b>\n\n` +
            `📧 Email: ${user.email}\n` +
            `👤 Username: @${user.telegramUsername || 'N/A'}\n` +
            `📅 Liên kết: ${user.telegramLinkedAt ? new Date(user.telegramLinkedAt).toLocaleDateString('vi-VN') : 'N/A'}`,
            { parse_mode: 'HTML' }
          );
        } else {
          await telegramBot.sendMessage(chatId, 
            '❌ Tài khoản chưa được liên kết.\n\n' +
            'Vào trang Profile để lấy mã liên kết.'
          );
        }
      });

      // Handle /me command - Check balance & active license keys
      telegramBot.onText(/\/me/, async (msg) => {
        const chatId = msg.chat.id;
        const telegramId = msg.from.id.toString();

        try {
          // Find user with this telegram ID
          const user = await prisma.user.findFirst({
            where: { telegramId },
          });

          if (!user) {
            const linkGuide = `
❌ <b>Tài khoản chưa liên kết</b>

Bạn chưa liên kết tài khoản Telegram với MMO-Store.

📋 <b>Hướng dẫn liên kết:</b>
1. Đăng nhập vào MMO-Store
2. Vào trang <b>Profile</b>
3. Nhấn nút <b>"Lấy mã liên kết Telegram"</b>
4. Quay lại đây và nhấn <b>/start</b> với mã được cung cấp

🔗 ${config.frontendUrl}/profile
            `.trim();

            await telegramBot.sendMessage(chatId, linkGuide, { parse_mode: 'HTML' });
            return;
          }

          // Get user's active license keys
          const licenseKeys = await prisma.licenseKey.findMany({
            where: { 
              userId: user.id,
              status: 'ACTIVE',
            },
            include: {
              product: {
                select: { name: true },
              },
            },
            orderBy: { activatedAt: 'desc' },
          });

          // Get user's order count
          const orderCount = await prisma.order.count({
            where: { userId: user.id },
          });

          // User is linked - build response
          const balance = Number(user.balance || 0);

          // Format license keys
          let keysText = '';
          if (licenseKeys.length > 0) {
            keysText = licenseKeys.map((lk, index) => {
              const expiryText = lk.expiresAt 
                ? ` (hết hạn: ${new Date(lk.expiresAt).toLocaleDateString('vi-VN')})`
                : ' (không giới hạn)';
              return `  ${index + 1}. <code>${lk.key}</code>\n     📦 ${lk.product?.name || 'Unknown'}${expiryText}`;
            }).join('\n\n');
          } else {
            keysText = '  Chưa có key nào đang hoạt động';
          }

          const response = `
👤 <b>Tài khoản của bạn</b>

📧 Email: <code>${user.email}</code>
💰 Số dư: <b>${this.formatCurrency(balance)}</b>

🔑 <b>License Keys đang hoạt động</b> (${licenseKeys.length})

${keysText}

─────────────────────
📊 Thống kê:
• Tổng chi tiêu: ${this.formatCurrency(Number(user.totalSpent || 0))}
• Số đơn hàng: ${orderCount}
            `.trim();

          await telegramBot.sendMessage(chatId, response, { 
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          });

        } catch (error) {
          console.error('Telegram /me error:', error);
          await telegramBot.sendMessage(chatId, 
            '❌ Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.'
          );
        }
      });

      isListening = true;
      console.log('✅ Telegram bot listener started');

    } catch (error) {
      console.error('❌ Failed to initialize Telegram bot listener:', error.message);
    }
  }

  // Stop bot polling
  stopBot() {
    if (bot) {
      bot.stopPolling();
      bot = null;
      isListening = false;
      console.log('🛑 Telegram bot polling stopped');
    }
  }

  async sendMessage(text, chatId = config.telegram.adminChatId) {
    try {
      const telegramBot = await this.getBot();
      if (!telegramBot) return;
      
      await telegramBot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    } catch (error) {
      console.error('Telegram send error:', error.message);
    }
  }

  // Send Login OTP via Telegram
  async sendLoginOtp(user, code) {
    if (!user.telegramId) return;
    
    const message = `
🔐 <b>Xác thực đăng nhập</b>

📧 Email: ${user.email}
🔑 Mã xác thực: <code>${code}</code>

⏰ Mã có hiệu lực trong 3 phút.

⚠️ Nếu không phải bạn, hãy bỏ qua tin nhắn này.
    `.trim();

    await this.sendMessage(message, user.telegramId);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
  }

  // New Order Notification
  async sendNewOrderNotification(order) {
    const message = `
🛒 <b>New Order</b>

📋 Order: <code>${order.orderNumber}</code>
👤 Customer: ${order.user.fullName || order.user.email}
💰 Amount: ${this.formatCurrency(Number(order.total))}
💳 Payment: ${order.paymentMethod}

📦 Items:
${order.items.map(item => `  • ${item.product.name} x${item.quantity}`).join('\n')}
    `.trim();

    await this.sendMessage(message);
  }

  // Payment Received Notification
  async sendPaymentReceivedNotification(order) {
    const message = `
✅ <b>Payment Received</b>

📋 Order: <code>${order.orderNumber}</code>
💰 Amount: ${this.formatCurrency(Number(order.total))}
💳 Method: ${order.paymentMethod}
    `.trim();

    await this.sendMessage(message);
  }

  // Order Status Update
  async sendOrderStatusNotification(order) {
    const statusEmoji = {
      PENDING: '⏳',
      AWAITING_PAYMENT: '💳',
      PAID: '✅',
      PROCESSING: '🔄',
      COMPLETED: '🎉',
      REFUNDED: '💸',
      CANCELLED: '❌',
      FAILED: '⚠️',
    };

    const message = `
${statusEmoji[order.status] || '📝'} <b>Order Update</b>

📋 Order: <code>${order.orderNumber}</code>
📊 Status: ${order.status}
💰 Amount: ${this.formatCurrency(Number(order.total))}
    `.trim();

    await this.sendMessage(message);
  }

  // Order Completed Notification
  async sendOrderCompletedNotification(order) {
    const message = `
🎉 <b>Order Completed</b>

📋 Order: <code>${order.orderNumber}</code>
👤 Customer: ${order.user.fullName || order.user.email}
💰 Amount: ${this.formatCurrency(Number(order.total))}
    `.trim();

    await this.sendMessage(message);
  }

  // Order Cancelled Notification
  async sendOrderCancelledNotification(order) {
    const message = `
❌ <b>Order Cancelled</b>

📋 Order: <code>${order.orderNumber}</code>
👤 Customer: ${order.user.fullName || order.user.email}
    `.trim();

    await this.sendMessage(message);
  }

  // Refund Notification
  async sendRefundNotification(order) {
    const message = `
💸 <b>Refund Processed</b>

📋 Order: <code>${order.orderNumber}</code>
👤 Customer: ${order.user.fullName || order.user.email}
💰 Amount: ${this.formatCurrency(Number(order.total))}
    `.trim();

    await this.sendMessage(message);
  }

  // New Customer Notification
  async sendNewCustomerNotification(user) {
    const message = `
👋 <b>New Customer</b>

📧 Email: ${user.email}
👤 Name: ${user.fullName || 'N/A'}
📅 Joined: ${new Date().toLocaleDateString('vi-VN')}
    `.trim();

    await this.sendMessage(message);
  }

  // New Affiliate Notification
  async sendNewAffiliateNotification(affiliate, newUser) {
    const message = `
👥 <b>New Affiliate Referral</b>

📧 Affiliate: ${affiliate.email}
📧 New User: ${newUser.email}
📅 Date: ${new Date().toLocaleDateString('vi-VN')}
    `.trim();

    await this.sendMessage(message);
  }

  // Low Stock Alert
  async sendLowStockAlert(product) {
    const message = `
⚠️ <b>Low Stock Alert</b>

📦 Product: ${product.name}
📊 Current Stock: ${product.stock}
⚠️ Threshold: ${product.lowStockThreshold}
🔗 Link: ${config.frontendUrl}/admin/products/${product.id}
    `.trim();

    await this.sendMessage(message);
  }

  // New Ticket Notification
  async sendNewTicketNotification(ticket) {
    const priorityEmoji = {
      LOW: '🟢',
      MEDIUM: '🟡',
      HIGH: '🟠',
      URGENT: '🔴',
    };

    const message = `
🎫 <b>New Support Ticket</b>

🏷️ Ticket: <code>${ticket.ticketNumber}</code>
👤 Customer: ${ticket.user.email}
📌 Priority: ${priorityEmoji[ticket.priority]} ${ticket.priority}
📝 Subject: ${ticket.subject}

${ticket.content.substring(0, 200)}...
    `.trim();

    await this.sendMessage(message);
  }

  // Ticket Reply Notification
  async sendTicketReplyNotification(ticket, reply) {
    const message = `
💬 <b>Ticket Reply</b>

🏷️ Ticket: <code>${ticket.ticketNumber}</code>
📝 Subject: ${ticket.subject}

Reply from ${reply.isInternal ? 'Staff' : ticket.user.email}:
${reply.content.substring(0, 200)}...
    `.trim();

    await this.sendMessage(message);
  }

  // System Error Alert
  async sendSystemErrorNotification(error, context = {}) {
    const message = `
🚨 <b>System Error</b>

📝 Error: ${error.message}
📍 Context: ${JSON.stringify(context)}
⏰ Time: ${new Date().toISOString()}
    `.trim();

    await this.sendMessage(message);
  }

  // Daily Report
  async sendDailyReport(stats) {
    const message = `
📊 <b>Daily Report</b> - ${new Date().toLocaleDateString('vi-VN')}

🛒 Orders: ${stats.orders}
💰 Revenue: ${this.formatCurrency(stats.revenue)}
👥 New Customers: ${stats.newCustomers}
📦 Products Sold: ${stats.productsSold}
⚠️ Low Stock Items: ${stats.lowStock}
    `.trim();

    await this.sendMessage(message);
  }

  // Custom Alert
  async sendAlert(title, message) {
    const formattedMessage = `
🔔 <b>${title}</b>

${message}
    `.trim();

    await this.sendMessage(formattedMessage);
  }
}

export default new TelegramService();
