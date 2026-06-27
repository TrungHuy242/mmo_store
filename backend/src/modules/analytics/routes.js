import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import prisma from '../../database/prisma.js';

const router = Router();

// Revenue analytics
router.get('/revenue', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const where = {
      status: { in: ['COMPLETED', 'PAID'] },
    };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await prisma.order.findMany({
      where,
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by period
    const groupedData = {};
    for (const order of orders) {
      let key;
      const date = order.createdAt;
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const d = new Date(date);
        d.setDate(d.getDate() - d.getDay());
        key = d.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, orders: 0 };
      }
      groupedData[key].revenue += Number(order.total);
      groupedData[key].orders += 1;
    }

    res.json({
      success: true,
      data: Object.entries(groupedData).map(([period, data]) => ({
        period,
        ...data,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Product analytics
router.get('/products', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        salesCount: true,
        viewCount: true,
        price: true,
        stock: true,
      },
      orderBy: { salesCount: 'desc' },
      take: 20,
    });
    
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

// Customer analytics
router.get('/customers', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = {
      totalCustomers: await prisma.user.count({ where: { role: 'CUSTOMER' } }),
      newThisMonth: await prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: new Date(new Date().setDate(1)) },
        },
      }),
      activeCustomers: await prisma.user.count({
        where: {
          role: 'CUSTOMER',
          lastLogin: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

export default router;
