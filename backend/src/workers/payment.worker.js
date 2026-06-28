import prisma from '../database/prisma.js';
import paymentService from '../modules/payments/payment.service.js';

class PaymentWorker {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    console.log('🔄 Payment Worker started');
    this.isRunning = true;
    
    await this.processPendingPayments();
    await this.checkExpiredPayments();
  }

  async stop() {
    console.log('🛑 Payment Worker stopped');
    this.isRunning = false;
  }

  // Process pending payments (just logs - actual confirmation happens via webhooks)
  async processPendingPayments() {
    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PENDING',
        status: { in: ['PENDING', 'AWAITING_PAYMENT'] },
        expiresAt: { gt: new Date() },
      },
      include: {
        payment: true,
        user: true,
      },
    });

    console.log(`📋 Found ${pendingOrders.length} pending payments`);
  }

  // Check and expire old payments (with atomic update)
  async checkExpiredPayments() {
    // Use atomic transaction to prevent race conditions
    await prisma.$transaction(async (tx) => {
      // Get pending payments that have expired
      const expiredPayments = await tx.payment.findMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: new Date() },
        },
        include: { order: true },
      });

      if (expiredPayments.length > 0) {
        console.log(`⏰ Found ${expiredPayments.length} expired payments`);
      }

      // Mark payments as expired
      await tx.payment.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: new Date() },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      // Update corresponding orders
      const orderIds = expiredPayments.map(p => p.orderId);
      if (orderIds.length > 0) {
        await tx.order.updateMany({
          where: {
            id: { in: orderIds },
            status: 'PENDING',
          },
          data: {
            status: 'CANCELLED',
          },
        });
      }
    }, {
      isolationLevel: 'Serializable',
    });
  }

  // Process USDT transactions from TronGrid (placeholder - needs actual API integration)
  async processUsdtTransactions() {
    try {
      console.log('📊 Checking USDT transactions...');
      // TODO: Implement TronGrid API polling
      // 1. Query TronGrid API for transactions to deposit address
      // 2. Check against processed_webhooks table
      // 3. For each new transaction, confirm payment atomically
    } catch (error) {
      console.error('❌ USDT processing error:', error.message);
    }
  }

  // Process Casso bank transactions (placeholder - needs actual API integration)
  async processCassoTransactions() {
    try {
      console.log('🏦 Checking Casso transactions...');
      // TODO: Implement Casso API polling
      // 1. Query Casso API for new transactions
      // 2. Check against processed_webhooks table
      // 3. For each new transaction, confirm payment atomically
    } catch (error) {
      console.error('❌ Casso processing error:', error.message);
    }
  }

  // Confirm payment with optimistic locking (used by webhooks)
  async confirmPayment(orderId, paymentData) {
    try {
      // Use optimistic locking from payment service
      if (paymentData.paymentId) {
        await paymentService.confirmPaymentWithLock(paymentData.paymentId, paymentData);
      }
      
      await paymentService.confirmOrderWithLock(orderId);
      
      console.log(`✅ Order ${orderId} payment confirmed`);
      return { success: true };
    } catch (error) {
      // Check if already confirmed (idempotent)
      if (error.message?.includes('already confirmed')) {
        console.log(`⚠️ Order ${orderId} already confirmed`);
        return { success: true, alreadyDone: true };
      }
      console.error(`❌ Failed to confirm payment for order ${orderId}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new PaymentWorker();
