import { Router } from 'express';
import crypto from 'crypto';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import prisma from '../../database/prisma.js';
import paymentService from './payment.service.js';

const router = Router();

// Get payment URL for VietQR
router.post('/vietqr/create', authenticate, async (req, res, next) => {
  try {
    const { orderId, amount } = req.body;
    
    const payment = await paymentService.createVietQrPayment(orderId, amount);
    
    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
});

// USDT payment info
router.post('/usdt/create', authenticate, async (req, res, next) => {
  try {
    const { orderId, amount } = req.body;
    
    const payment = await paymentService.createUsdtPayment(orderId, amount);
    
    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
});

// Check USDT transaction status
router.get('/usdt/check/:orderId', authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    const result = await paymentService.pollUsdtTransaction(orderId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Get user balance
router.get('/balance', authenticate, async (req, res, next) => {
  try {
    const balance = await paymentService.getUserBalance(req.user.userId);
    
    res.json({
      success: true,
      data: { balance },
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Process refund
router.post('/refund/:orderId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    const result = await paymentService.processRefund(orderId, req.user.userId, reason);
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Get all transactions
router.get('/transactions', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, userId, type, startDate, endDate } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, username: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// =========================================
// DEV ONLY: Simulate Casso Webhook
// =========================================
router.post('/test/casso', async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not allowed in production' });
  }
  
  try {
    const { orderNumber, amount } = req.body;
    
    // Tạo cấu trúc payload giống hệt Casso gửi về
    const payload = {
      data: [{
        id: Math.floor(Math.random() * 1000000),
        amount: Number(amount),
        content: orderNumber, // Nội dung chuyển khoản chứa mã đơn hàng
        createdAt: new Date().toISOString(),
      }],
      signature: process.env.CASSO_WEBHOOK_SECRET, // Tự khớp chữ ký trong env
    };
    
    const result = await paymentService.processCassoWebhook(payload);
    
    res.json({
      success: true,
      message: 'Simulated Casso webhook processed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// =========================================
// DEV ONLY: Simulate USDT TRC20 Payment
// =========================================
router.post('/test/usdt', async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not allowed in production' });
  }
  
  try {
    const { depositAddress, amount } = req.body;
    
    if (!depositAddress || !amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing depositAddress or amount' 
      });
    }
    
    // Tạo payload mô phỏng webhook từ blockchain
    const payload = {
      transactionHash: '0x' + crypto.randomBytes(32).toString('hex'),
      from: 'T' + crypto.randomBytes(16).toString('hex'),
      to: depositAddress, // Địa chỉ ví nhận tiền
      amount: Number(amount),
      confirmedAt: new Date().toISOString(),
    };
    
    const result = await paymentService.processUsdtWebhook(payload);
    
    res.json({
      success: true,
      message: 'Simulated USDT TRC20 payment processed',
      data: {
        ...result,
        simulated: true,
        transactionHash: payload.transactionHash,
        from: payload.from,
        to: payload.to,
        amount: payload.amount,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
