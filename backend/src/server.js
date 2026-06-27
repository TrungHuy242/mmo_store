import app from './app.js';
import config from './config/index.js';
import prisma from './database/prisma.js';
import cronJobs from './jobs/cron.js';
import workerManager from './workers/index.js';
import telegramService from './modules/notifications/telegram.service.js';

const PORT = config.port;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start cron jobs (report/cleanup only)
    cronJobs.start();
    console.log('✅ Cron jobs started');

    // Start worker manager (payment/delivery workers with locking)
    await workerManager.startAll();
    console.log('✅ Worker manager started');

    // Initialize Telegram bot listener if enabled
    if (config.telegram?.botToken) {
      await telegramService.initBotListener();
      console.log('✅ Telegram bot listener started');
    } else {
      console.log('⚠️  Telegram bot not configured (no bot token)');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 MMO Store Backend Server                                 ║
║                                                               ║
║   Environment: ${config.nodeEnv.padEnd(42)}║
║   Port: ${String(PORT).padEnd(50)}║
║   Frontend: ${config.frontendUrl.padEnd(44)}║
║                                                               ║
║   API Endpoints:                                              ║
║   • http://localhost:${PORT}/api/auth                              ║
║   • http://localhost:${PORT}/api/products                           ║
║   • http://localhost:${PORT}/api/orders                            ║
║   • http://localhost:${PORT}/api/payments                         ║
║   • http://localhost:${PORT}/api/dashboard                        ║
║                                                               ║
║   Health Check:                                                ║
║   • http://localhost:${PORT}/health                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  telegramService.stopBot();
  workerManager.stopAll();
  cronJobs.stop();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  telegramService.stopBot();
  workerManager.stopAll();
  cronJobs.stop();
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
