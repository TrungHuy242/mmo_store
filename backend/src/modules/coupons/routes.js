import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import prisma from '../../database/prisma.js';
import couponService from './coupon.service.js';

const router = Router();

// Get all coupons (admin)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orders: true } } },
    });
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
});

// Validate and apply coupon (authenticated user)
router.post('/validate', authenticate, async (req, res, next) => {
  try {
    const { code, orderTotal } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }
    
    if (!orderTotal || orderTotal <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order total' });
    }
    
    const result = await couponService.applyCoupon(code, req.user.userId, orderTotal);
    
    res.json({
      success: true,
      discount: result.discount,
      coupon: result.coupon,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Create coupon
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { code, type, value, minOrderAmount, maxDiscount, usageLimit, userLimit, startsAt, expiresAt } = req.body;
    
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        minOrderAmount,
        maxDiscount,
        usageLimit,
        userLimit: userLimit || 1,
        startsAt: new Date(startsAt),
        expiresAt: new Date(expiresAt),
        createdById: req.user.userId,
      },
    });
    
    res.status(201).json({ success: true, message: 'Coupon created', data: coupon });
  } catch (error) {
    next(error);
  }
});

// Delete coupon
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
