import { Router } from 'express';
import { listOrders, markPaid, listUsers, adjustBalance, exportOrders, broadcast, listWithdrawals, resolveWithdrawal } from '../controllers/adminController.js';
import { authRequired, adminRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired, adminRequired);
router.get('/orders', listOrders);
router.post('/orders/:id/mark-paid', markPaid);
router.get('/orders/export', exportOrders);
router.get('/users', listUsers);
router.post('/users/:id/balance', adjustBalance);
router.post('/broadcast', broadcast);
router.get('/withdrawals', listWithdrawals);
router.post('/withdrawals/:id/resolve', resolveWithdrawal);
export default router;
