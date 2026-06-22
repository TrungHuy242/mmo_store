import dotenv from 'dotenv';

dotenv.config();

const required = ['JWT_SECRET', 'ENCRYPTION_KEY'];

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  dbType: process.env.DB_TYPE?.toLowerCase() || 'postgres',
  mongoUri: process.env.MONGO_URI,
  databaseUrl: process.env.DATABASE_URL || '',

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  encryptionKey: process.env.ENCRYPTION_KEY,

  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '',
    useWebhook: process.env.TELEGRAM_USE_WEBHOOK === 'true',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  },

  usdt: {
    trongridApiKey: process.env.TRONGRID_API_KEY || '',
    walletAddress: process.env.USDT_WALLET_ADDRESS || '',
    pollIntervalMs: parseInt(process.env.USDT_POLL_INTERVAL_MS || '60000', 10),
  },

  bank: {
    bankId: process.env.BANK_ID || '',
    accountNo: process.env.BANK_ACCOUNT_NO || '',
    accountName: process.env.BANK_ACCOUNT_NAME || '',
    cassoWebhookSecret: process.env.CASSO_WEBHOOK_SECRET || '',
  },

  thesieure: {
    partnerId: process.env.THESIEURE_PARTNER_ID || '',
    partnerKey: process.env.THESIEURE_PARTNER_KEY || '',
    apiUrl: process.env.THESIEURE_API_URL || 'https://thesieure.com/chargingws/v2',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'MMO Store <no-reply@mmostore.com>',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@mmostore.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  },
};

export function validateConfig() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.warn(`[config] Thiếu biến môi trường: ${missing.join(', ')}. Kiểm tra file .env`);
  }

  if (config.dbType === 'mongo' && !config.mongoUri) {
    console.warn('[config] DB_TYPE=mongo yêu cầu MONGO_URI. Kiểm tra file backend/.env');
  }
  if (config.dbType === 'postgres' && !config.databaseUrl) {
    console.warn('[config] DB_TYPE=postgres yêu cầu DATABASE_URL. Kiểm tra file backend/.env');
  }

  if (config.encryptionKey && config.encryptionKey.length !== 32) {
    console.warn('[config] ENCRYPTION_KEY nên dài đúng 32 ký tự (256-bit) cho AES-256.');
  }
}
