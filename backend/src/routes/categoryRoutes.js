import { Router } from 'express';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { authRequired, adminRequired } from '../middleware/auth.js';

const router = Router();
router.get('/', listCategories);
router.post('/', authRequired, adminRequired, createCategory);
router.put('/:id', authRequired, adminRequired, updateCategory);
router.delete('/:id', authRequired, adminRequired, deleteCategory);
export default router;
