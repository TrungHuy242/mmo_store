/**
 * Re-exports the validated environment object produced by env.config.js.
 *
 * All environment variables are validated at import time and the process
 * is terminated immediately if anything is missing or malformed. Every
 * other module should import `config` from this file (not process.env
 * directly) so the fail-fast behaviour is guaranteed.
 */

import env from './env.config.js';

const config = {
  port: env.port,
  nodeEnv: env.nodeEnv,

  frontendUrl: env.frontendUrl,
  adminUrl: env.adminUrl,

  jwt: env.jwt,

  redis: env.redis,

  telegram: {
    botToken: env.telegram.botToken,
    adminChatId: env.telegram.adminChatId,
    notificationsEnabled: env.telegram.notificationsEnabled,
  },

  smtp: env.smtp,

  tronGrid: env.tronGrid,

  casso: env.casso,

  thesieure: env.thesieure,

  vietqr: env.vietqr,

  upload: env.upload,

  rateLimit: env.rateLimit,

  corsOrigins: env.corsOrigins,
};

export default config;
export { env };