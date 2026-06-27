import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

import config from './config/index.js';
import errorHandler from './middlewares/error.middleware.js';
import notFound from './middlewares/notfound.middleware.js';
import { maintenanceMiddleware } from './modules/settings/maintenance.middleware.js';

// Import routes
import authRoutes from './modules/auth/routes.js';
import productRoutes from './modules/products/routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import orderRoutes from './modules/orders/routes.js';
import paymentRoutes from './modules/payments/routes.js';
import inventoryRoutes from './modules/inventory/routes.js';
import licenseRoutes from './modules/licenses/routes.js';
import customerRoutes from './modules/customers/routes.js';
import ticketRoutes from './modules/tickets/routes.js';
import couponRoutes from './modules/coupons/routes.js';
import affiliateRoutes from './modules/affiliates/routes.js';
import analyticsRoutes from './modules/analytics/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import assetRoutes from './modules/assets/asset.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import wishlistRoutes from './modules/wishlist/wishlist.routes.js';
import auditRoutes from './modules/audit/routes.js';
import broadcastRoutes from './modules/broadcast/broadcast.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import settingsRoutes from './modules/settings/routes.js';

// Import webhooks
import webhookRoutes from './webhooks/index.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());

// Compression
app.use(compression());

// Cookie parser
app.use(cookieParser());

// CORS
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.nodeEnv !== 'production', // Bỏ qua hoàn toàn rate limit khi đang dev
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many login attempts, please try again later.' },
  skip: (req) => config.nodeEnv !== 'production', // Bỏ qua rate limit login khi đang dev
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin/login', authLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply maintenance middleware (before routes, but after health check)
app.use(maintenanceMiddleware);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/admin/broadcast', broadcastRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);

// Webhooks
app.use('/webhooks', webhookRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
