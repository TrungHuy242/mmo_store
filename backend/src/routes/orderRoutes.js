import { Router } from 'express';
import { createOrder, myOrders, getOrder } from '../controllers/orderController.js';
import { checkUsdt, chargeCardOrder } from '../controllers/paymentController.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema } from '../validators/schemas.js';

const router = Router();
router.post('/', authRequired, validate(createOrderSchema), createOrder);
router.get('/', authRequired, myOrders);
router.get('/:id', authRequired, getOrder);
router.post('/:id/check-usdt', authRequired, checkUsdt);
router.post('/:id/charge-card', authRequired, chargeCardOrder);
export default router;
