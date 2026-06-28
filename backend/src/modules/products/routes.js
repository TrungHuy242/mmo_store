import { Router } from 'express';
import controller from './controller.js';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import { createProductValidation, updateProductValidation, productQueryValidation, bulkUpdateValidation } from './validation.js';
import { cacheMiddleware } from '../../middlewares/cache.middleware.js';

const router = Router();

// Public routes — all GETs are cached (TTL from middleware defaults)
router.get('/', cacheMiddleware(), productQueryValidation, controller.getAll);
router.get('/featured', cacheMiddleware({ ttl: 600 }), controller.getFeatured);
router.get('/top-selling', cacheMiddleware({ ttl: 600 }), controller.getTopSelling);
router.get('/slug/:slug', cacheMiddleware({ ttl: 300 }), controller.getBySlug);
router.post('/stock-check', controller.checkStock);

// Protected customer routes
router.get('/:id', authenticate, cacheMiddleware({ ttl: 300 }), controller.getById);

// Admin routes — mutations invalidate relevant cache after success
router.post('/', authenticate, requireAdmin, createProductValidation, controller.create);
router.put('/:id', authenticate, requireAdmin, updateProductValidation, controller.update);
router.delete('/:id', authenticate, requireAdmin, controller.delete);
router.patch('/:id/archive', authenticate, requireAdmin, controller.archive);
router.patch('/:id/restore', authenticate, requireAdmin, controller.restore);
router.patch('/:id/toggle-status', authenticate, requireAdmin, controller.toggleStatus);
router.patch('/bulk/action', authenticate, requireAdmin, bulkUpdateValidation, controller.bulkAction);

export default router;
