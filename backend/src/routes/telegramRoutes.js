import { Router } from 'express';
import { config } from '../config/env.js';
import { getBot } from '../services/telegramService.js';

const router = Router();

// Endpoint nhan update tu Telegram (webhook). Bao ve bang secret trong URL.
router.post('/webhook/:secret', (req, res) => {
  if (req.params.secret !== config.telegram.webhookSecret) {
    return res.status(401).json({ message: 'Secret không hợp lệ' });
  }
  const bot = getBot();
  if (bot) bot.processUpdate(req.body);
  res.sendStatus(200);
});

export default router;
