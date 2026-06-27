import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import prisma from '../../database/prisma.js';
import telegramService from '../notifications/telegram.service.js';

const router = Router();

// Broadcast message to all users with Telegram (Admin only)
router.post('/broadcast', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Get all users with telegramId
    const usersWithTelegram = await prisma.user.findMany({
      where: {
        telegramId: {
          not: null,
        },
      },
      select: {
        id: true,
        telegramId: true,
        email: true,
        fullName: true,
      },
    });

    if (usersWithTelegram.length === 0) {
      return res.json({
        success: true,
        message: 'No users with Telegram linked',
        sent: 0,
      });
    }

    // Format broadcast message
    const formattedMessage = `
📢 <b>Thông báo từ MMO Store</b>

${message}

---
💬 Liên hệ hỗ trợ nếu cần: ${req.user.email}
    `.trim();

    // Send to all users
    let sentCount = 0;
    let failedCount = 0;

    for (const user of usersWithTelegram) {
      try {
        await telegramService.sendMessage(formattedMessage, user.telegramId);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${user.telegramId}:`, error.message);
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `Broadcast sent to ${sentCount} users`,
      sent: sentCount,
      failed: failedCount,
      total: usersWithTelegram.length,
    });
  } catch (error) {
    next(error);
  }
});

// Get broadcast stats (Admin only)
router.get('/broadcast/stats', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [totalUsers, usersWithTelegram, totalOrders] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { telegramId: { not: null } } }),
      prisma.order.count(),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        usersWithTelegram,
        telegramConnectRate: totalUsers > 0 ? Math.round((usersWithTelegram / totalUsers) * 100) : 0,
        totalOrders,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
