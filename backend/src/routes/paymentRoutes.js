import { Router } from 'express';
import { cassoWebhook, cardCallback } from '../controllers/paymentController.js';

// Webhook khong qua auth JWT, tu verify chu ky/secret ben trong controller
const router = Router();
router.post('/casso/webhook', cassoWebhook);
router.post('/card/callback', cardCallback);
export default router;
