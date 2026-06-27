import prisma from '../database/prisma.js';
import WorkerLock from './lock.js';
import crypto from 'crypto';

const WORKER_ID = `worker-${crypto.randomBytes(4).toString('hex')}`;
// Reduced to 5 seconds for faster delivery processing
const WORKER_INTERVAL = 5 * 1000;

class WorkerManager {
  constructor() {
    this.interval = WORKER_INTERVAL;
    this.intervalId = null;
  }

  async startAll() {
    console.log(`🚀 Worker Manager started (ID: ${WORKER_ID}, interval: ${this.interval/1000}s)`);
    
    // Run immediately
    await this.runCycle();
    
    // Then run every interval
    this.intervalId = setInterval(() => this.runCycle(), this.interval);
  }

  async stopAll() {
    console.log('🛑 Stopping Worker Manager...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async runCycle() {
    try {
      // Payment worker tasks
      await this.runWithLock('payment-pending', async () => {
        const { default: paymentWorker } = await import('./payment.worker.js');
        await paymentWorker.processPendingPayments();
      });
      
      await this.runWithLock('payment-expired', async () => {
        const { default: paymentWorker } = await import('./payment.worker.js');
        await paymentWorker.checkExpiredPayments();
      });
      
      // Delivery worker tasks
      await this.runWithLock('delivery-pending', async () => {
        const { default: deliveryWorker } = await import('./delivery.worker.js');
        await deliveryWorker.processPendingDeliveries();
      });
      
      await this.runWithLock('delivery-retry', async () => {
        const { default: deliveryWorker } = await import('./delivery.worker.js');
        await deliveryWorker.retryFailedDeliveries();
      });
      
      await this.runWithLock('delivery-reservations', async () => {
        const { default: deliveryWorker } = await import('./delivery.worker.js');
        await deliveryWorker.releaseExpiredReservations();
      });
      
      // Notification worker tasks
      await this.runWithLock('notification-pending', async () => {
        const { default: notificationWorker } = await import('./notification.worker.js');
        await notificationWorker.sendPendingNotifications();
      });
    } catch (error) {
      console.error('Worker cycle error:', error.message);
    }
  }

  async runWithLock(lockName, taskFn) {
    const acquired = await WorkerLock.acquireLock(lockName, WORKER_ID);
    
    if (!acquired) {
      return;
    }

    try {
      await taskFn();
    } catch (error) {
      console.error(`Task "${lockName}" failed:`, error.message);
    } finally {
      await WorkerLock.releaseLock(lockName);
    }
  }

  async runOnce(workerName) {
    switch (workerName) {
      case 'payment':
        const paymentWorker = await import('./payment.worker.js');
        await paymentWorker.default.start();
        break;
      case 'delivery':
        const deliveryWorker = await import('./delivery.worker.js');
        await deliveryWorker.default.start();
        break;
      case 'notification':
        const notificationWorker = await import('./notification.worker.js');
        await notificationWorker.default.start();
        break;
      default:
        console.error(`Unknown worker: ${workerName}`);
    }
  }
}

export default new WorkerManager();
export { WORKER_ID };
