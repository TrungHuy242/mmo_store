import { Router } from 'express';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct, replenishStock } from '../controllers/productController.js';
import { authRequired, adminRequired } from '../middleware/auth.js';

const router = Router();
router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', authRequired, adminRequired, createProduct);
router.put('/:id', authRequired, adminRequired, updateProduct);
router.post('/:id/replenish', authRequired, adminRequired, replenishStock);
router.delete('/:id', authRequired, adminRequired, deleteProduct);
export default router;
