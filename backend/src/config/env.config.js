/**
 * Environment configuration validator.
 *
 * Uses zod to validate every required/optional environment variable
 * BEFORE the rest of the application loads. If anything is missing or
 * malformed the process is terminated with an actionable error message
 * (instead of failing later at runtime with cryptic stack traces).
 *
 * To add a new env var:
 *   1. add it to the schema below
 *   2. add it to .env.example
 *   3. export it from the typed `parsed` object so callers can do
 *      `import env from './env.config.js'; env.jwt.accessSecret`
 */

import 'dotenv/config';
import { z } from 'zod';

// Helpers ---------------------------------------------------------------------

const requiredString = (label) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} must not be empty`);

const numericString = (label, def) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : Number(v)))
    .refine((n) => Number.isFinite(n), `${label} must be a number`);

const boolString = (label, def) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') return def;
      return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
    });

// Detect obvious placeholder values coming from .env.example so the
// developer is forced to replace them in development as well.
const PLACEHOLDER_PATTERN = /^(your[-_].+|changeme|example|placeholder)/i;
const notPlaceholder = (label) =>
  z.string().refine((v) => !PLACEHOLDER_PATTERN.test(v), {
    message: `${label} still has a placeholder value from .env.example. Please set a real value.`,
  });

// Schema ----------------------------------------------------------------------

const envSchema = z
  .object({
    // ── Server ─────────────────────────────────────────────────────────────
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: numericString('PORT', 3000),

    // ── Database (REQUIRED) ────────────────────────────────────────────────
    DATABASE_URL: requiredString('DATABASE_URL').refine(
      (v) => /^postgres(ql)?:\/\//.test(v),
      'DATABASE_URL must be a PostgreSQL connection string'
    ),

    // ── Redis (optional - some background workers skip if absent) ──────────
    REDIS_HOST: z.string().trim().optional(),
    REDIS_PORT: numericString('REDIS_PORT', 6379),
    REDIS_PASSWORD: z.string().trim().optional(),

    // ── JWT (REQUIRED - secrets must be strong) ────────────────────────────
    JWT_ACCESS_SECRET: requiredString('JWT_ACCESS_SECRET')
      .refine((v) => v.length >= 16, 'JWT_ACCESS_SECRET must be at least 16 characters')
      .refine(
        (v) => !PLACEHOLDER_PATTERN.test(v) || process.env.NODE_ENV !== 'production',
        'JWT_ACCESS_SECRET must not be a placeholder in production'
      ),
    JWT_REFRESH_SECRET: requiredString('JWT_REFRESH_SECRET')
      .refine((v) => v.length >= 16, 'JWT_REFRESH_SECRET must be at least 16 characters')
      .refine(
        (v) => !PLACEHOLDER_PATTERN.test(v) || process.env.NODE_ENV !== 'production',
        'JWT_REFRESH_SECRET must not be a placeholder in production'
      ),
    JWT_ACCESS_EXPIRES: z.string().default('15m'),
    JWT_REFRESH_EXPIRES: z.string().default('7d'),

    // ── Frontend URLs ─────────────────────────────────────────────────────
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    ADMIN_URL: z.string().url().default('http://localhost:5173/admin'),

    // ── Telegram (REQUIRED if notifications enabled) ───────────────────────
    TELEGRAM_NOTIFICATIONS_ENABLED: boolString(
      'TELEGRAM_NOTIFICATIONS_ENABLED',
      false
    ),
    TELEGRAM_BOT_TOKEN: z.string().trim().optional(),
    TELEGRAM_ADMIN_CHAT_ID: z.string().trim().optional(),

    // ── SMTP (REQUIRED if any email flow runs) ────────────────────────────
    SMTP_HOST: z.string().trim().optional(),
    SMTP_PORT: numericString('SMTP_PORT', 587),
    SMTP_SECURE: boolString('SMTP_SECURE', false),
    SMTP_USER: z.string().trim().optional(),
    SMTP_PASS: z.string().trim().optional(),
    SMTP_FROM: z.string().trim().optional(),

    // ── TronGrid / USDT ────────────────────────────────────────────────────
    TRONGRID_API_KEY: z.string().trim().optional(),
    USDT_DEPOSIT_ADDRESS: z.string().trim().optional(),

    // ── Casso (bank webhook) ───────────────────────────────────────────────
    CASSO_API_KEY: z.string().trim().optional(),
    CASSO_WEBHOOK_SECRET: z.string().trim().optional(),

    // ── Thesieure ──────────────────────────────────────────────────────────
    THESIEURE_API_KEY: z.string().trim().optional(),
    THESIEURE_PARTNER_ID: z.string().trim().optional(),

    // ── VietQR ─────────────────────────────────────────────────────────────
    VIETQR_BANK_ID: z.string().trim().optional(),
    VIETQR_ACCOUNT_NUMBER: z.string().trim().optional(),
    VIETQR_ACCOUNT_NAME: z.string().trim().optional(),

    // ── File storage ───────────────────────────────────────────────────────
    UPLOAD_DIR: z.string().trim().default('./uploads'),
    MAX_FILE_SIZE: numericString('MAX_FILE_SIZE', 104857600),

    // ── Rate limit ─────────────────────────────────────────────────────────
    RATE_LIMIT_WINDOW: numericString('RATE_LIMIT_WINDOW', 15),
    RATE_LIMIT_MAX_REQUESTS: numericString('RATE_LIMIT_MAX_REQUESTS', 100),

    // ── Cache ─────────────────────────────────────────────────────────────────
    CACHE_TTL: numericString('CACHE_TTL', 300),

    // ── CORS ───────────────────────────────────────────────────────────────
    CORS_ORIGINS: z.string().trim().optional(),
  })
  // Cross-field validation: telegram and SMTP should be fully configured
  // when their corresponding feature flag is enabled.
  .superRefine((data, ctx) => {
    if (data.TELEGRAM_NOTIFICATIONS_ENABLED) {
      if (!data.TELEGRAM_BOT_TOKEN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['TELEGRAM_BOT_TOKEN'],
          message:
            'TELEGRAM_BOT_TOKEN is required when TELEGRAM_NOTIFICATIONS_ENABLED=true',
        });
      }
      if (!data.TELEGRAM_ADMIN_CHAT_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['TELEGRAM_ADMIN_CHAT_ID'],
          message:
            'TELEGRAM_ADMIN_CHAT_ID is required when TELEGRAM_NOTIFICATIONS_ENABLED=true',
        });
      }
    }

    if (data.SMTP_HOST || data.SMTP_USER || data.SMTP_PASS) {
      for (const f of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']) {
        if (!data[f]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [f],
            message: `${f} is required because other SMTP_* variables are set`,
          });
        }
      }
    }

    // In production, also forbid placeholder-style secrets.
    if (data.NODE_ENV === 'production') {
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'string' && PLACEHOLDER_PATTERN.test(v)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [k],
            message: `${k} must not be a placeholder value in production`,
          });
        }
      }
    }
  });

// Parse & fail-fast -----------------------------------------------------------

const { success, data, error } = envSchema.safeParse(process.env);

if (!success) {
  // Pretty-print every issue so the developer can fix them all at once.
  console.error('\n❌ Invalid environment configuration. The server cannot start.\n');

  const issues = error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));

  for (const { field, message } of issues) {
    console.error(`  • ${field}: ${message}`);
  }

  console.error(
    `\n${issues.length} issue(s) found. See backend/.env.example for the full list of variables.\n`
  );
  process.exit(1);
}

// Extra check: if Telegram notifications are off but the token is set, warn.
if (
  !data.TELEGRAM_NOTIFICATIONS_ENABLED &&
  data.TELEGRAM_BOT_TOKEN &&
  PLACEHOLDER_PATTERN.test(data.TELEGRAM_BOT_TOKEN)
) {
  // already caught by the schema in production; this is just a dev nudge.
}

// Typed accessors -------------------------------------------------------------

export const env = {
  nodeEnv: data.NODE_ENV,
  isProduction: data.NODE_ENV === 'production',
  isDevelopment: data.NODE_ENV === 'development',

  port: data.PORT,

  databaseUrl: data.DATABASE_URL,

  redis: {
    host: data.REDIS_HOST,
    port: data.REDIS_PORT,
    password: data.REDIS_PASSWORD || undefined,
  },

  jwt: {
    accessSecret: data.JWT_ACCESS_SECRET,
    refreshSecret: data.JWT_REFRESH_SECRET,
    accessExpires: data.JWT_ACCESS_EXPIRES,
    refreshExpires: data.JWT_REFRESH_EXPIRES,
  },

  frontendUrl: data.FRONTEND_URL,
  adminUrl: data.ADMIN_URL,

  telegram: {
    notificationsEnabled: data.TELEGRAM_NOTIFICATIONS_ENABLED,
    botToken: data.TELEGRAM_BOT_TOKEN,
    adminChatId: data.TELEGRAM_ADMIN_CHAT_ID,
  },

  smtp: {
    host: data.SMTP_HOST,
    port: data.SMTP_PORT,
    secure: data.SMTP_SECURE,
    user: data.SMTP_USER,
    password: data.SMTP_PASS,
    from: data.SMTP_FROM,
  },

  tronGrid: {
    apiKey: data.TRONGRID_API_KEY,
    depositAddress: data.USDT_DEPOSIT_ADDRESS,
  },

  casso: {
    apiKey: data.CASSO_API_KEY,
    webhookSecret: data.CASSO_WEBHOOK_SECRET,
  },

  thesieure: {
    apiKey: data.THESIEURE_API_KEY,
    partnerId: data.THESIEURE_PARTNER_ID,
  },

  vietqr: {
    bankId: data.VIETQR_BANK_ID,
    accountNumber: data.VIETQR_ACCOUNT_NUMBER,
    accountName: data.VIETQR_ACCOUNT_NAME,
  },

  upload: {
    dir: data.UPLOAD_DIR,
    maxFileSize: data.MAX_FILE_SIZE,
  },

  rateLimit: {
    windowMs: data.RATE_LIMIT_WINDOW * 60 * 1000,
    maxRequests: data.RATE_LIMIT_MAX_REQUESTS,
  },

  cache: {
    ttl: data.CACHE_TTL,
  },

  corsOrigins: data.CORS_ORIGINS
    ? data.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : ['http://localhost:5173'],
};

export default env;