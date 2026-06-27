import { Router } from 'express';
import controller from './controller.js';
import { validationResult } from 'express-validator';

const router = Router();

// Product Controller (same as products but limited for admin)
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, category, search, sortBy, sortOrder } = req.query;
    
    const result = await (await import('./service.js')).default.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      category,
      search,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      includeArchived: true,
    });
    
    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
