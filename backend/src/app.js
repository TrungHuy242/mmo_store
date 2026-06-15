import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { notFound, errorHandler } from './middleware/error.js';

import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import affiliateRoutes from './routes/affiliateRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import telegramRoutes from './routes/telegramRoutes.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  // Rate limit cho auth
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
  const webhookLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/payment', webhookLimiter, paymentRoutes);
  app.use('/api/affiliate', affiliateRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/telegram', telegramRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
