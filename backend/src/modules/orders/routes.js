import { Router } from 'express';
import controller from './controller.js';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import { createOrderValidation, updateOrderStatusValidation, addOrderNoteValidation } from './validation.js';

const router = Router();

// Customer routes
router.post('/', authenticate, createOrderValidation, controller.create);
router.get('/my-orders', authenticate, controller.getUserOrders);
router.get('/:id', authenticate, controller.getById);
router.get('/number/:orderNumber', authenticate, controller.getByOrderNumber);
router.get('/:id/status', authenticate, controller.getOrderStatus);

// Admin routes
router.get('/', authenticate, requireAdmin, controller.getAllOrders);
router.patch('/:id/status', authenticate, requireAdmin, updateOrderStatusValidation, controller.updateStatus);
router.post('/:id/note', authenticate, requireAdmin, addOrderNoteValidation, controller.addNote);
router.get('/admin/statistics', authenticate, requireAdmin, controller.getStatistics);

export default router;
