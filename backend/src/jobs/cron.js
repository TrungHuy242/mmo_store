import cron from 'node-cron';
import prisma from '../database/prisma.js';
import telegramService from '../modules/notifications/telegram.service.js';

class CronJobs {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
    this.processingTasks = new Set();
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Cron jobs already running');
      return;
    }
    
    console.log('⏰ Starting cron jobs...');
    this.isRunning = true;
    
    // Every hour - Clean up expired orders (ONLY cron, NOT workers)
    this.jobs.push(
      cron.schedule('0 * * * *', async () => {
        await this.withLock('cleanup-expired-orders', this.cleanupExpiredOrders);
      })
    );

    // Every hour - Check license expirations
    this.jobs.push(
      cron.schedule('30 * * * *', async () => {
        await this.withLock('check-license-expirations', this.checkLicenseExpirations);
      })
    );

    // Every 2 hours - Check inventory levels
    this.jobs.push(
      cron.schedule('0 */2 * * *', async () => {
        await this.withLock('check-inventory-levels', this.checkInventoryLevels);
      })
    );

    // Daily at 8:00 AM - Daily revenue report
    this.jobs.push(
      cron.schedule('0 8 * * *', async () => {
        await this.withLock('daily-revenue-report', this.sendDailyRevenueReport);
      })
    );

    // Daily at 9:00 AM - Daily Telegram report
    this.jobs.push(
      cron.schedule('0 9 * * *', async () => {
        await this.withLock('daily-telegram-report', this.sendDailyTelegramReport);
      })
    );

    // Daily at midnight - Clean old audit logs (keep 90 days)
    this.jobs.push(
      cron.schedule('0 0 * * *', async () => {
        await this.withLock('cleanup-audit-logs', this.cleanupOldAuditLogs);
      })
    );

    // Weekly on Monday at 8 AM - Weekly report
    this.jobs.push(
      cron.schedule('0 8 * * 1', async () => {
        await this.withLock('weekly-report', this.sendWeeklyReport);
      })
    );

    console.log(`✅ Started ${this.jobs.length} cron jobs (report/cleanup only)`);
    console.log('📌 Worker tasks are handled by WorkerManager, not cron');
  }

  stop() {
    console.log('⏰ Stopping cron jobs...');
    this.isRunning = false;
    for (const job of this.jobs) {
      job.stop();
    }
    this.jobs = [];
  }

  // Prevent overlapping execution of the same task
  async withLock(taskName, taskFn) {
    if (this.processingTasks.has(taskName)) {
      console.log(`⏭️ Task "${taskName}" is already running, skipping...`);
      return;
    }

    this.processingTasks.add(taskName);
    
    try {
      await taskFn.call(this);
    } catch (error) {
      console.error(`❌ Cron task "${taskName}" failed:`, error.message);
    } finally {
      this.processingTasks.delete(taskName);
    }
  }

  // Clean up expired orders (older than 7 days with no payment)
  async cleanupExpiredOrders() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const expiredOrders = await prisma.order.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
        createdAt: { lt: sevenDaysAgo },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (expiredOrders.count > 0) {
      console.log(`🗑️ Cleaned up ${expiredOrders.count} expired orders`);
    }

    return expiredOrders.count;
  }

  // Check and mark expired license keys
  async checkLicenseExpirations() {
    const expiredKeys = await prisma.licenseKey.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: new Date(),
          not: null,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (expiredKeys.count > 0) {
      console.log(`🔑 Marked ${expiredKeys.count} expired license keys`);
      
      if (telegramService.isEnabled()) {
        await telegramService.sendAlert(
          'Licenses Expired',
          `${expiredKeys.count} license keys have expired`
        );
      }
    }

    return expiredKeys.count;
  }

  // Check low stock inventory and send alerts
  async checkInventoryLevels() {
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        unlimitedStock: false,
        stock: { lte: 5 },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockThreshold: true,
      },
    });

    if (lowStockProducts.length > 0) {
      console.log(`⚠️ ${lowStockProducts.length} products with low stock`);

      if (telegramService.isEnabled()) {
        let message = '⚠️ <b>Low Stock Alert</b>\n\n';
        
        for (const product of lowStockProducts.slice(0, 10)) {
          message += `📦 ${product.name}: ${product.stock} left\n`;
        }
        
        if (lowStockProducts.length > 10) {
          message += `\n...and ${lowStockProducts.length - 10} more`;
        }

        await telegramService.sendMessage(message);
      }
    }

    return lowStockProducts;
  }

  // Send daily revenue report
  async sendDailyRevenueReport() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orders, revenue, newCustomers, topProduct] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: yesterday, lt: today } },
      }),
      prisma.order.aggregate({
        where: {
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: { gte: yesterday, lt: today },
        },
        _sum: { total: true },
      }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: yesterday, lt: today },
        },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _count: true,
        orderBy: { _count: { productId: 'desc' } },
        take: 1,
      }),
    ]);

    const report = {
      date: yesterday.toISOString().split('T')[0],
      orders,
      revenue: revenue._sum.total || 0,
      newCustomers,
      topProductId: topProduct[0]?.productId,
    };

    console.log(`📊 Daily revenue report:`, report);
    return report;
  }

  // Send daily Telegram report
  async sendDailyTelegramReport() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orders, revenue, newCustomers, pendingOrders] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: yesterday, lt: today } },
      }),
      prisma.order.aggregate({
        where: {
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: { gte: yesterday, lt: today },
        },
        _sum: { total: true },
      }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: yesterday, lt: today },
        },
      }),
      prisma.order.count({
        where: { status: 'PENDING' },
      }),
    ]);

    const stats = {
      orders,
      revenue: revenue._sum.total || 0,
      newCustomers,
      productsSold: 0,
      lowStock: await prisma.product.count({
        where: { isActive: true, stock: { lte: 5 } },
      }),
      pendingOrders,
    };

    if (telegramService.isEnabled()) {
      await telegramService.sendDailyReport(stats);
    }

    return stats;
  }

  // Clean up old audit logs
  async cleanupOldAuditLogs() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deleted = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    if (deleted.count > 0) {
      console.log(`🗑️ Deleted ${deleted.count} old audit logs`);
    }

    return deleted.count;
  }

  // Send weekly report
  async sendWeeklyReport() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalOrders, totalRevenue, newCustomers, topProducts] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.order.aggregate({
        where: {
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: { gte: weekAgo },
        },
        _sum: { total: true },
      }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: weekAgo },
        },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _count: { productId: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 5,
      }),
    ]);

    const report = {
      period: `${weekAgo.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      newCustomers,
      topProducts,
    };

    if (telegramService.isEnabled()) {
      let message = '📊 <b>Weekly Report</b>\n\n';
      message += `📅 Period: ${report.period}\n\n`;
      message += `🛒 Total Orders: ${report.totalOrders}\n`;
      message += `💰 Revenue: ${new Intl.NumberFormat('vi-VN').format(report.totalRevenue)}₫\n`;
      message += `👥 New Customers: ${report.newCustomers}\n`;

      await telegramService.sendMessage(message);
    }

    return report;
  }
}

export default new CronJobs();
