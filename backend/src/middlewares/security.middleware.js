/**
 * Centralised security middleware.
 *
 * Bundles helmet (HTTP headers), CORS (strict allowlist), hpp (parameter
 * pollution protection) and the rate-limit policies for the API.
 *
 * Keeping every security knob in one file makes it easy to audit and
 * to verify the production setup at a glance.
 */

import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';

import config from '../config/index.js';

// ─── helpers ────────────────────────────────────────────────────────────────

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// In development we don't want to be locked out while testing, but we
// still log when a limiter would have blocked a request so the dev
// notices they're pushing the limits.
const skipInDev = () => config.nodeEnv !== 'production';

const formatBlocked = (scope) => (req, res /*, next, options */) => {
  // Called by express-rate-limit when the limit is exceeded.
  res.status(429).json({
    success: false,
    error: 'Too many requests',
    scope,
    message:
      scope === 'auth'
        ? 'Too many authentication attempts, please try again in 15 minutes.'
        : 'Too many requests, please try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// ─── helmet ─────────────────────────────────────────────────────────────────
//
// Helmet sets a sane default set of secure HTTP response headers. We
// tighten it a bit for a JSON API:
//   - allow cross-origin requests to /uploads/* (so the frontend can
//     display user avatars / product images served from this API)
//   - disable CSP for the API itself because we only serve JSON, no
//     inline scripts or styles (the API never returns HTML)
//
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 15552000, // 180 days
    includeSubDomains: true,
    preload: false,
  },
});

// ─── CORS ───────────────────────────────────────────────────────────────────
//
// Strict CORS:
//   - allowlist comes from config.corsOrigins (validated by env.config.js)
//   - only the configured HTTP methods and a small set of headers are
//     accepted
//   - preflight (OPTIONS) is cached for 10 minutes
//   - credentials are enabled so the cookie-based refresh-token flow
//     keeps working
//
const corsOptions = {
  origin(origin, callback) {
    // Allow same-origin requests (no Origin header) - tools like curl,
    // server-to-server webhooks, and the health check.
    if (!origin) return callback(null, true);

    if (config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS: origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Remaining'],
  maxAge: 600, // 10 minutes
};

export const corsMiddleware = cors(corsOptions);

// ─── hpp ────────────────────────────────────────────────────────────────────
//
// Protect against HTTP Parameter Pollution (e.g. ?role=admin&role=user).
// We whitelist params that legitimately need to be repeated (tags, ids).
//
const HPP_WHITELIST = ['tags', 'ids', 'categoryIds', 'productIds'];

export const hppMiddleware = hpp({
  whitelist: HPP_WHITELIST,
});

// ─── Rate limiters ──────────────────────────────────────────────────────────
//
// Spec:
//   - General /api/*        : 100 requests / 15 minutes per IP
//   - /api/auth/login       :  10 requests / 15 minutes per IP
//   - /api/auth/admin/login :  10 requests / 15 minutes per IP
//   - /api/auth/register    :  10 requests / 15 minutes per IP
//
// `standardHeaders: 'draft-7'` emits the RateLimit-* headers (RFC draft).
// `legacyHeaders: false` keeps the old X-RateLimit-* headers off so we
// don't leak information we don't need to.
//
export const apiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: skipInDev,
  handler: formatBlocked('api'),
  message: { error: 'Too many requests, please try again later.' },
});

export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: skipInDev,
  handler: formatBlocked('auth'),
  message: { error: 'Too many authentication attempts, please try again later.' },
});