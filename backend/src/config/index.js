import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5173/admin',
  
  jwt: {
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '7d',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID,
    notificationsEnabled: process.env.TELEGRAM_NOTIFICATIONS_ENABLED === 'true',
  },
  
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@mmostore.com',
  },
  
  tronGrid: {
    apiKey: process.env.TRONGRID_API_KEY,
    depositAddress: process.env.USDT_DEPOSIT_ADDRESS,
  },
  
  casso: {
    apiKey: process.env.CASSO_API_KEY,
    webhookSecret: process.env.CASSO_WEBHOOK_SECRET,
  },
  
  thesieure: {
    apiKey: process.env.THESIEURE_API_KEY,
    partnerId: process.env.THESIEURE_PARTNER_ID,
  },
  
  vietqr: {
    bankId: process.env.VIETQR_BANK_ID || '970436',
    accountNumber: process.env.VIETQR_ACCOUNT_NUMBER,
    accountName: process.env.VIETQR_ACCOUNT_NAME,
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600,
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
};
