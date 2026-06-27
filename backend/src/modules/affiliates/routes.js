import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import prisma from '../../database/prisma.js';

const router = Router();

// Get affiliate dashboard (for logged in user)
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const affiliateCode = await prisma.affiliateCode.findUnique({
      where: { userId: req.user.userId },
      include: {
        uses: {
          include: { newUser: { select: { email: true, createdAt: true } } },
        },
      },
    });

    if (!affiliateCode) {
      const code = `REF${req.user.userId.substring(0, 6).toUpperCase()}`;
      const newAffiliateCode = await prisma.affiliateCode.create({
        data: { userId: req.user.userId, code },
        include: { uses: true },
      });
      return res.json({ success: true, data: newAffiliateCode });
    }

    // Get refLink
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const refLink = `${baseUrl}/register?ref=${affiliateCode.code}`;

    res.json({
      success: true,
      data: {
        ...affiliateCode,
        refLink,
        referredCount: affiliateCode.uses?.length || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Request withdrawal
router.post('/withdraw', authenticate, async (req, res, next) => {
  try {
    const { amount, method = 'bank', details } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    if (!details) {
      return res.status(400).json({ success: false, message: 'Payment details required' });
    }

    // Get affiliate code
    const affiliateCode = await prisma.affiliateCode.findUnique({
      where: { userId: req.user.userId },
    });

    if (!affiliateCode) {
      return res.status(400).json({ success: false, message: 'No affiliate account found' });
    }

    const minWithdraw = 50000;
    if (amount < minWithdraw) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal is ${minWithdraw.toLocaleString()} VND` });
    }

    if (affiliateCode.totalEarnings < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Create withdrawal request
    const withdrawal = await prisma.affiliateWithdrawal.create({
      data: {
        userId: req.user.userId,
        affiliateCodeId: affiliateCode.id,
        amount,
        method,
        details,
        status: 'PENDING',
      },
    });

    // Deduct from pending (optional - for now just create request)
    await prisma.affiliateCode.update({
      where: { id: affiliateCode.id },
      data: { totalEarnings: { decrement: amount } },
    });

    res.json({
      success: true,
      message: 'Withdrawal request submitted',
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
});

// Get all affiliates (admin)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const affiliates = await prisma.affiliateCode.findMany({
      orderBy: { totalEarnings: 'desc' },
      include: { user: { select: { email: true, fullName: true } } },
    });
    res.json({ success: true, data: affiliates });
  } catch (error) {
    next(error);
  }
});

export default router;
