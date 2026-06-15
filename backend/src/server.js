import { createApp } from './app.js';
import { config, validateConfig } from './config/env.js';
import { connectDB } from './config/db.js';
import { initBot } from './services/telegramService.js';
import { registerBotHandlers } from './telegram/botHandlers.js';
import { startCronJobs } from './jobs/cron.js';

async function start() {
  validateConfig();
  await connectDB();

  initBot();
  registerBotHandlers();
  startCronJobs();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[server] Backend chay tai http://localhost:${config.port} (${config.env})`);
  });
}

start().catch((err) => {
  console.error('[server] Loi khoi dong:', err);
  process.exit(1);
});
