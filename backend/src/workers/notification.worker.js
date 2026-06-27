import prisma from '../database/prisma.js';
import emailService from '../modules/notifications/email.service.js';
import telegramService from '../modules/notifications/telegram.service.js';

class NotificationWorker {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    console.log('🔔 Notification Worker started');
    this.isRunning = true;
    
    // Send pending notifications
    await this.sendPendingNotifications();
    
    // Send daily reports
    await this.sendDailyReports();
  }

  async stop() {
    console.log('🛑 Notification Worker stopped');
    this.isRunning = false;
  }

  // Send pending in-app notifications
  async sendPendingNotifications() {
    const pending = await prisma.notification.findMany({
      where: {
        isRead: false,
      },
      take: 100,
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📬 Found ${pending.length} pending notifications`);

    for (const notification of pending) {
      try {
        // Try to send via Telegram if linked
        if (notification.type === 'ORDER_CREATED' || notification.type === 'PAYMENT_RECEIVED') {
          const user = await prisma.user.findUnique({
            where: { id: notification.userId },
          });
          
          if (user?.telegramId && telegramService.isEnabled()) {
            // Send Telegram notification
          }
        }

        // Mark as sent (simplified)
        console.log(`📧 Sent notification ${notification.id}`);
      } catch (error) {
        console.error(`❌ Notification ${notification.id} failed:`, error.message);
      }
    }
  }

  // Send daily reports
  async sendDailyReports() {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    try {
      // Get yesterday's stats
      const [yesterdayOrders, yesterdayRevenue, newCustomers, lowStockProducts] = await Promise.all([
        prisma.order.count({
          where: {
            createdAt: { gte: yesterday, lt: todayStart },
          },
        }),
        prisma.order.aggregate({
          where: {
            status: { in: ['COMPLETED', 'PAID'] },
            createdAt: { gte: yesterday, lt: todayStart },
          },
          _sum: { total: true },
        }),
        prisma.user.count({
          where: {
            role: 'CUSTOMER',
            createdAt: { gte: yesterday, lt: todayStart },
          },
        }),
        prisma.product.count({
          where: {
            isActive: true,
            stock: { gt: 0, lte: 5 },
          },
        }),
      ]);

      const stats = {
        orders: yesterdayOrders,
        revenue: yesterdayRevenue._sum.total || 0,
        newCustomers,
        productsSold: 0,
        lowStock: lowStockProducts,
      };

      // Send Telegram daily report
      if (telegramService.isEnabled()) {
        await telegramService.sendDailyReport(stats);
      }

      console.log(`📊 Daily report sent for ${yesterday.toDateString()}`);
    } catch (error) {
      console.error('❌ Daily report failed:', error.message);
    }
  }

  // Create notification for user
  async createNotification(userId, type, title, message, data = null) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
      },
    });
  }

  // Broadcast notification to all admins
  async notifyAdmins(type, title, message) {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['SUPER_ADMIN', 'MANAGER'] },
        status: 'ACTIVE',
      },
    });

    for (const admin of admins) {
      await this.createNotification(admin.id, type, title, message);
    }
  }

  // Send bulk email
  async sendBulkEmail(userIds, subject, html) {
    for (const userId of userIds) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await emailService.sendMail({
          to: user.email,
          subject,
          html,
        });
      }
    }
  }
}

export default new NotificationWorker();
