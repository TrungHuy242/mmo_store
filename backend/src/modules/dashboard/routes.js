import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import prisma from '../../database/prisma.js';

const router = Router();

// Get dashboard statistics
router.get('/statistics', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [
      totalOrders,
      totalProducts,
      totalCustomers,
      todayOrders,
      todayRevenue,
      pendingOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.product.count({ where: { isArchived: false } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          status: { in: ['COMPLETED', 'PAID'] },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
    ]);

    const stats = {
      totalOrders,
      totalProducts,
      totalCustomers,
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0,
      pendingOrders,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Get revenue data
router.get('/revenue', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['COMPLETED', 'PAID'] },
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const revenueData = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Number(order.total);
      return acc;
    }, {});

    const data = Object.entries(revenueData).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Get top products
router.get('/top-products', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const products = await prisma.product.findMany({
      where: { isActive: true, isArchived: false },
      take: parseInt(limit),
      orderBy: { salesCount: 'desc' },
      select: {
        id: true,
        name: true,
        thumbnail: true,
        price: true,
        salesCount: true,
        stock: true,
      },
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
});

// Get recent orders
router.get('/recent-orders', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const orders = await prisma.order.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, username: true } },
        items: {
          take: 1,
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
