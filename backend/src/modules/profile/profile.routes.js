import { Router } from 'express';
import crypto from 'crypto';
import { authenticate } from '../../middlewares/auth.middleware.js';
import prisma from '../../database/prisma.js';
import config from '../../config/index.js';

const router = Router();
const TELEGRAM_BOT_USERNAME = 'MmoStoreBot'; // Update this to your actual bot username

// Generate Telegram link code
router.post('/telegram/generate-link', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // Generate a unique link code
    const linkCode = crypto.randomBytes(16).toString('hex');
    
    // Store the link code in database with expiration (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramLinkCode: linkCode,
        telegramLinkExpiresAt: expiresAt,
      },
    });

    // Generate the Telegram deep link
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || TELEGRAM_BOT_USERNAME;
    const deepLink = `https://t.me/${botUsername}?start=link_${linkCode}`;
    
    res.json({
      success: true,
      data: {
        linkCode,
        deepLink,
        expiresIn: 15 * 60, // seconds
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get Telegram link status
router.get('/telegram/link-status', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        telegramId: true,
        telegramUsername: true,
        telegramLinkedAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        isLinked: !!user?.telegramId,
        telegramUsername: user?.telegramUsername || null,
        linkedAt: user?.telegramLinkedAt || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Unlink Telegram (user can do this themselves)
router.post('/telegram/unlink', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramId: null,
        telegramUsername: null,
        telegramLinkedAt: null,
        telegramLinkCode: null,
        telegramLinkExpiresAt: null,
      },
    });

    res.json({
      success: true,
      message: 'Telegram đã được hủy liên kết thành công',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
