import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import categoryService from './category.service.js';
import { cacheMiddleware } from '../../middlewares/cache.middleware.js';
import { body } from 'express-validator';

const router = Router();

// Validation
const createValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be 2-100 characters'),
];

// Public routes — all GETs are cached (admin mutations auto-invalidate)
router.get('/', cacheMiddleware({ ttl: 600 }), async (req, res, next) => {
  try {
    const { hierarchical, includeInactive } = req.query;
    
    const categories = await categoryService.getAll({
      hierarchical: hierarchical === 'true',
      includeInactive: includeInactive === 'true',
    });
    
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/slug/:slug', cacheMiddleware({ ttl: 600 }), async (req, res, next) => {
  try {
    const category = await categoryService.getBySlug(req.params.slug);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const category = await categoryService.getById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/statistics/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await categoryService.getStatistics();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Admin routes
router.post('/', authenticate, requireAdmin, createValidation, async (req, res, next) => {
  try {
    const category = await categoryService.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Category created',
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const category = await categoryService.update(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'Category updated',
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await categoryService.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Category deleted',
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/toggle', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const category = await categoryService.toggleStatus(req.params.id);
    
    res.json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'}`,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/reorder', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { categories } = req.body;
    await categoryService.reorder(categories);
    
    res.json({
      success: true,
      message: 'Categories reordered',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
