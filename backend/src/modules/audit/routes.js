import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import prisma from '../../database/prisma.js';

const router = Router();

// Get audit logs with pagination and search
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, resource, userId, search, startDate, endDate } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const skip = (pageNum - 1) * limitNum;
    
    // Build where clause
    const where = {};
    
    if (action) {
      where.action = action;
    }
    
    if (resource) {
      where.resource = { contains: resource, mode: 'insensitive' };
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (search) {
      where.OR = [
        { userEmail: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { resourceId: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);
    
    // Get distinct actions for filter
    const actions = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: { id: true },
    });
    
    // Get distinct resources for filter
    const resources = await prisma.auditLog.groupBy({
      by: ['resource'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      filters: {
        actions: actions.map(a => ({ action: a.action, count: a._count.id })),
        resources: resources.map(r => ({ resource: r.resource, count: r._count.id })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get audit log by ID
router.get('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const log = await prisma.auditLog.findUnique({
      where: { id: req.params.id },
    });
    
    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }
    
    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

// Get audit logs for specific resource
router.get('/resource/:resource/:resourceId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const skip = (pageNum - 1) * limitNum;
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          resource: req.params.resource,
          resourceId: req.params.resourceId,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({
        where: {
          resource: req.params.resource,
          resourceId: req.params.resourceId,
        },
      }),
    ]);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get audit log statistics
router.get('/stats/summary', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const [total, byAction, recentLogs] = await Promise.all([
      prisma.auditLog.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: startDate } },
        _count: { id: true },
      }),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        byAction: byAction.map(a => ({ action: a.action, count: a._count.id })),
        recentLogs,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
