import { Router } from 'express';
import controller from './controller.js';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import { createProductValidation, updateProductValidation, productQueryValidation, bulkUpdateValidation } from './validation.js';

const router = Router();

// Public routes
router.get('/', productQueryValidation, controller.getAll);
router.get('/featured', controller.getFeatured);
router.get('/top-selling', controller.getTopSelling);
router.get('/slug/:slug', controller.getBySlug);
router.post('/stock-check', controller.checkStock);

// Protected customer routes
router.get('/:id', authenticate, controller.getById);

// Admin routes
router.post('/', authenticate, requireAdmin, createProductValidation, controller.create);
router.put('/:id', authenticate, requireAdmin, updateProductValidation, controller.update);
router.delete('/:id', authenticate, requireAdmin, controller.delete);
router.patch('/:id/archive', authenticate, requireAdmin, controller.archive);
router.patch('/:id/restore', authenticate, requireAdmin, controller.restore);
router.patch('/:id/toggle-status', authenticate, requireAdmin, controller.toggleStatus);
router.patch('/bulk/action', authenticate, requireAdmin, bulkUpdateValidation, controller.bulkAction);

export default router;
