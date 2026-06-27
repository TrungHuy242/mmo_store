import prisma from '../database/prisma.js';
import deliveryService from '../services/delivery.service.js';
import telegramService from '../modules/notifications/telegram.service.js';
import inventoryService from '../modules/inventory/inventory.service.js';

class DeliveryWorker {
  constructor() {
    this.isRunning = false;
    this.lockAcquired = false;
    this.lockTimeout = null;
  }

  async start() {
    console.log('📦 Delivery Worker started');
    this.isRunning = true;
    
    // Acquire lock before processing
    const lock = await this.acquireLock();
    if (!lock) {
      console.log('⚠️ Could not acquire worker lock, another instance is running');
      return;
    }
    
    try {
      // Process pending deliveries
      await this.processPendingDeliveries();
      
      // Retry failed deliveries
      await this.retryFailedDeliveries();
      
      // Release expired reservations
      await this.releaseExpiredReservations();
      
      // Check for manual delivery requests
      await this.checkManualDeliveries();
    } finally {
      await this.releaseLock();
    }
  }

  async stop() {
    console.log('🛑 Delivery Worker stopped');
    this.isRunning = false;
    await this.releaseLock();
  }

  async acquireLock() {
    try {
      // Try to create a lock record
      await prisma.workerLock.create({
        data: {
          name: 'delivery-worker',
          lockedAt: new Date(),
        },
      });
      this.lockAcquired = true;
      
      // Set auto-release timeout (5 minutes)
      this.lockTimeout = setTimeout(async () => {
        await this.releaseLock();
      }, 5 * 60 * 1000);
      
      return true;
    } catch (error) {
      // Lock already exists
      return false;
    }
  }

  async releaseLock() {
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
      this.lockTimeout = null;
    }
    
    if (this.lockAcquired) {
      try {
        await prisma.workerLock.delete({
          where: { name: 'delivery-worker' },
        });
      } catch (e) {
        // Lock already released
      }
      this.lockAcquired = false;
    }
  }

  // Process pending deliveries for paid orders
  async processPendingDeliveries() {
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'PAID',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    console.log(`📦 Found ${pendingOrders.length} orders pending delivery`);

    for (const order of pendingOrders) {
      try {
        await deliveryService.processOrderDelivery(order.id);
        console.log(`✅ Delivered order ${order.orderNumber}`);
      } catch (error) {
        console.error(`❌ Delivery failed for ${order.orderNumber}:`, error.message);
      }
    }
  }

  // Retry orders with failed items
  async retryFailedDeliveries() {
    // Find orders with undelivered items after payment
    const ordersWithFailedItems = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'PROCESSING'] },
        items: {
          some: {
            deliveredAt: null,
          },
        },
      },
      include: {
        items: {
          where: { deliveredAt: null },
        },
      },
    });

    for (const order of ordersWithFailedItems) {
      try {
        await deliveryService.redeliverFailedItems(order.id);
        console.log(`🔄 Retried delivery for order ${order.orderNumber}`);
      } catch (error) {
        console.error(`❌ Retry failed for ${order.orderNumber}:`, error.message);
      }
    }
  }

  // Release expired reservations
  async releaseExpiredReservations() {
    try {
      const released = await inventoryService.releaseExpiredReservations();
      if (released > 0) {
        console.log(`🔓 Released ${released} expired reservations`);
      }
    } catch (error) {
      console.error('Error releasing expired reservations:', error.message);
    }
  }

  // Check for manual delivery requests
  async checkManualDeliveries() {
    // Look for orders marked as needing manual intervention
    const manualOrders = await prisma.order.findMany({
      where: {
        status: 'PROCESSING',
        adminNote: {
          contains: '[MANUAL_DELIVERY]',
        },
      },
    });

    if (manualOrders.length > 0 && telegramService.isEnabled()) {
      await telegramService.sendAlert(
        'Manual Delivery Required',
        `${manualOrders.length} orders need manual delivery processing`
      );
    }
  }

  // Get delivery queue status
  async getQueueStatus() {
    const stats = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    const pendingDeliveries = await prisma.order.count({
      where: { status: 'PAID' },
    });

    const processedToday = await prisma.order.count({
      where: {
        status: { in: ['PROCESSING', 'COMPLETED'] },
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return {
      stats: stats.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
      pendingDeliveries,
      processedToday,
    };
  }
}

export default new DeliveryWorker();
