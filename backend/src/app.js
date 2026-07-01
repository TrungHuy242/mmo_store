import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

import config from './config/index.js';
import errorHandler from './middlewares/error.middleware.js';
import notFound from './middlewares/notfound.middleware.js';
import {
  helmetMiddleware,
  corsMiddleware,
  hppMiddleware,
  apiLimiter,
  authLimiter,
} from './middlewares/security.middleware.js';
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
import locketGoldRoutes from './modules/locket-gold/routes.js';

// Import webhooks
import webhookRoutes from './webhooks/index.js';

const app = express();

// ─── Behind a proxy/load balancer (nginx, heroku, cloudflare, ...) ───────────
// Trust the first proxy hop so req.ip / express-rate-limit see the real
// client IP rather than the proxy IP. Required for accurate rate limiting.
app.set('trust proxy', 1);

// ─── Security middleware (helmet -> hpp -> cors -> sanitizers) ─────────────
//
// Order matters:
//   1. helmet      - set secure response headers first
//   2. hpp         - normalise query/body before any later parser reads it
//   3. cors        - handle preflight OPTIONS for browser clients
//   4. mongoSanitize / xss-clean - scrub input before handlers run
//
app.use(helmetMiddleware);
app.use(hppMiddleware);
app.use(corsMiddleware);
app.use(xss());
app.use(mongoSanitize());

// Compression + cookies + body parsing
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate limiting ──────────────────────────────────────────────────────────
//
// General API: 100 requests / 15 minutes per IP.
// Sensitive auth endpoints: 10 requests / 15 minutes per IP.
//
// Rate limiters are mounted BEFORE the routes so they run first.
// The webhooks mount point stays outside /api and is not rate limited
// because external services (Casso, Thesieure, ...) POST from rotating
// IPs that we cannot reliably whitelist here.
//
app.use('/api/', apiLimiter);

// 10 req / 15 min for every endpoint that can be abused to spam, brute
// force or create accounts.
const authSensitivePaths = [
  '/api/auth/login',
  '/api/auth/admin/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
];
authSensitivePaths.forEach((p) => app.use(p, authLimiter));

// ─── Health check (no rate limit, no auth) ──────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply maintenance middleware (after health check so /health still works)
app.use(maintenanceMiddleware);

// ─── API Routes ─────────────────────────────────────────────────────────────
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
app.use('/api/locket-gold', locketGoldRoutes);

// Webhooks (outside /api, intentionally not rate limited)
app.use('/webhooks', webhookRoutes);

// ─── Error handling ─────────────────────────────────────────────────────────
// Translate CORS rejections (thrown from the cors callback) into a
// proper 403 response instead of letting them fall through to the
// generic error handler.
app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, error: err.message });
  }
  return next(err);
});

app.use(notFound);
app.use(errorHandler);

export default app;