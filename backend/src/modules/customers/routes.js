import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';

const router = Router();

// Get all users (admin)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { default: prisma } = await import('../../database/prisma.js');
    const { page = 1, limit = 20, role, search, status } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          status: true,
          balance: true,
          totalSpent: true,
          lastLogin: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { default: prisma } = await import('../../database/prisma.js');
    
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        balance: true,
        totalSpent: true,
        riskScore: true,
        telegramId: true,
        lastLogin: true,
        createdAt: true,
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, orderNumber: true, total: true, status: true, createdAt: true },
        },
        tickets: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, ticketNumber: true, subject: true, status: true },
        },
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Update user status
router.patch('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { default: prisma } = await import('../../database/prisma.js');
    const { status } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status },
    });
    
    res.json({ success: true, message: 'User status updated', data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
