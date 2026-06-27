import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import prisma from '../../database/prisma.js';

const router = Router();

// Normalize an AffiliateCode so the admin UI can read flat fields
// (fullName, email, affiliateStatus, referralCount, totalEarnings, createdAt).
const serializeAffiliate = (row) => ({
  id: row.userId,
  affiliateCodeId: row.id,
  code: row.code,
  isActive: row.isActive,
  fullName: row.user?.fullName || row.user?.username || null,
  email: row.user?.email || null,
  affiliateStatus: row.isActive ? 'active' : 'pending',
  referralCount: row.totalReferrals ?? 0,
  totalEarnings: Number(row.totalEarnings ?? 0),
  pendingEarnings: Number(row.pendingEarnings ?? 0),
  commission: Number(row.commission ?? 0),
  createdAt: row.createdAt,
});

// Normalize an AffiliateUse so it can act as a "withdrawal request" entry.
const serializeWithdrawal = (row) => ({
  id: row.id,
  userId: row.newUserId,
  user: row.newUser
    ? { fullName: row.newUser.fullName || row.newUser.username, email: row.newUser.email }
    : null,
  amount: Number(row.commission ?? 0),
  status: (row.status || 'PENDING').toLowerCase(),
  method: 'commission',
  transactionId: null,
  reason: null,
  createdAt: row.createdAt,
});

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

// Request withdrawal (for logged in affiliate)
// Without a dedicated AffiliateWithdrawal model, we record a withdrawal
// request as an AffiliateUse row with a special status. The matching
// `approve` / `reject` admin endpoints then flip the status back.
router.post('/withdraw', authenticate, async (req, res, next) => {
  try {
    const { amount, method = 'bank', details } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (!details) {
      return res.status(400).json({ success: false, message: 'Payment details required' });
    }

    const affiliateCode = await prisma.affiliateCode.findUnique({
      where: { userId: req.user.userId },
    });

    if (!affiliateCode) {
      return res.status(400).json({ success: false, message: 'No affiliate account found' });
    }

    const minWithdraw = 50000;
    if (amount < minWithdraw) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal is ${minWithdraw.toLocaleString()} VND`,
      });
    }
    if (Number(affiliateCode.totalEarnings) < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Decrement available earnings and create a pending withdrawal marker
    // by re-using the AffiliateUse model (no schema change required).
    const pendingUse = await prisma.affiliateUse.create({
      data: {
        affiliateCodeId: affiliateCode.id,
        newUserId: req.user.userId, // self-reference the requester
        orderId: null,
        commission: amount,
        status: 'WITHDRAW_PENDING',
      },
    });

    await prisma.affiliateCode.update({
      where: { id: affiliateCode.id },
      data: { pendingEarnings: { increment: amount } },
    });

    res.json({
      success: true,
      message: 'Withdrawal request submitted',
      data: { ...pendingUse, amount: Number(pendingUse.commission) },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Admin endpoints ───────────────────────────────────────────────────────

// Get all affiliates (admin)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const rows = await prisma.affiliateCode.findMany({
      orderBy: { totalEarnings: 'desc' },
      take: limit,
      include: { user: { select: { email: true, fullName: true, username: true } } },
    });
    res.json({ success: true, data: rows.map(serializeAffiliate) });
  } catch (error) {
    next(error);
  }
});

// Approve / activate an affiliate by userId (admin)
router.put('/:userId/approve', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const updated = await prisma.affiliateCode.update({
      where: { userId: req.params.userId },
      data: { isActive: true },
      include: { user: { select: { email: true, fullName: true, username: true } } },
    }).catch(() => null);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Affiliate not found' });
    }
    res.json({ success: true, data: serializeAffiliate(updated) });
  } catch (error) {
    next(error);
  }
});

// List withdrawal requests (admin)
// Until a dedicated AffiliateWithdrawal model exists, this returns
// AffiliateUse rows that the affiliate marked as WITHDRAW_PENDING.
router.get('/withdrawals', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const status = String(req.query.status || 'pending').toLowerCase();
    const where = {};
    if (status === 'pending') where.status = 'WITHDRAW_PENDING';
    else if (status === 'approved') where.status = 'WITHDRAW_APPROVED';
    else if (status === 'rejected') where.status = 'WITHDRAW_REJECTED';

    const rows = await prisma.affiliateUse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        newUser: { select: { email: true, fullName: true, username: true } },
      },
    });
    res.json({ success: true, data: rows.map(serializeWithdrawal) });
  } catch (error) {
    next(error);
  }
});

// Approve a withdrawal request (admin)
router.put('/withdrawals/:id/approve', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { transactionId } = req.body || {};
    const updated = await prisma.affiliateUse.update({
      where: { id: req.params.id },
      data: { status: 'WITHDRAW_APPROVED' },
      include: {
        newUser: { select: { email: true, fullName: true, username: true } },
      },
    }).catch(() => null);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    // Decrement earnings now that the payout has been confirmed
    await prisma.affiliateCode.update({
      where: { id: updated.affiliateCodeId },
      data: {
        pendingEarnings: { decrement: updated.commission },
      },
    }).catch(() => null);

    res.json({
      success: true,
      data: { ...serializeWithdrawal(updated), transactionId: transactionId || null },
    });
  } catch (error) {
    next(error);
  }
});

// Reject a withdrawal request (admin)
router.put('/withdrawals/:id/reject', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    const updated = await prisma.affiliateUse.update({
      where: { id: req.params.id },
      data: { status: 'WITHDRAW_REJECTED' },
      include: {
        newUser: { select: { email: true, fullName: true, username: true } },
      },
    }).catch(() => null);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    // Refund pending → available earnings
    await prisma.affiliateCode.update({
      where: { id: updated.affiliateCodeId },
      data: {
        pendingEarnings: { decrement: updated.commission },
        totalEarnings: { increment: updated.commission },
      },
    }).catch(() => null);

    res.json({
      success: true,
      data: { ...serializeWithdrawal(updated), reason: reason || null },
    });
  } catch (error) {
    next(error);
  }
});

export default router;