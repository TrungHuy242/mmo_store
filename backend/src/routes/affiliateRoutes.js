import { Router } from 'express';
import { affiliateInfo, requestWithdrawal } from '../controllers/affiliateController.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { withdrawalSchema } from '../validators/schemas.js';

const router = Router();
router.get('/', authRequired, affiliateInfo);
router.post('/withdraw', authRequired, validate(withdrawalSchema), requestWithdrawal);
export default router;
