import prisma from '../../database/prisma.js';
import axios from 'axios';
import config from '../../config/index.js';
import orderService from '../orders/service.js';
import telegramService from '../notifications/telegram.service.js';

class OptimisticLockError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OptimisticLockError';
  }
}

class PaymentService {
  // ==================== USDT TRC20 ====================
  
  async createUsdtPayment(orderId, amount) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    const depositAddress = config.tronGrid.depositAddress;
    
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount,
        method: 'USDT_TRC20',
        depositAddress,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    
    return {
      id: payment.id,
      amount,
      method: 'USDT_TRC20',
      depositAddress,
      qrCode: `trx:${depositAddress}?amount=${amount}`,
      expiresAt: payment.expiresAt,
    };
  }

  async checkUsdtTransaction(trxHash) {
    try {
      const response = await axios.get(
        `https://api.trongrid.io/v1/transactions/${trxHash}/info`,
        {
          headers: {
            'TRON-PRO-API-KEY': config.tronGrid.apiKey,
          },
        }
      );
      
      const txInfo = response.data;
      
      if (txInfo && txInfo.block_timestamp) {
        const toAddress = txInfo.raw_data?.contract?.[0]?.parameter?.value?.to_address;
        const amount = txInfo.raw_data?.contract?.[0]?.parameter?.value?.amount;
        const usdtAmount = amount / 1000000;
        
        return {
          valid: toAddress === config.tronGrid.depositAddress,
          amount: usdtAmount,
          confirmed: true,
          timestamp: new Date(txInfo.block_timestamp),
        };
      }
      
      return { valid: false };
    } catch (error) {
      console.error('USDT transaction check error:', error.message);
      return { valid: false, error: error.message };
    }
  }

  // ==================== VietQR ====================
  
  async createVietQrPayment(orderId, amount) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    const qrData = {
      bankId: config.vietqr.bankId,
      accountNo: config.vietqr.accountNumber,
      accountName: config.vietqr.accountName,
      amount,
      orderNumber: order.orderNumber,
    };
    
    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount,
        method: 'VIETQR',
        status: 'PENDING',
        qrCode: JSON.stringify(qrData),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    
    const qrUrl = `https://img.vietqr.io/image/${config.vietqr.bankId}-${config.vietqr.accountNumber}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(order.orderNumber)}`;
    
    return {
      id: payment.id,
      amount,
      method: 'VIETQR',
      qrCode: qrUrl,
      transferNote: order.orderNumber,
      expiresAt: payment.expiresAt,
    };
  }

  // ==================== Refunds (Atomic) ====================
  
  async processRefund(orderId, adminId, reason) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payment: true },
      });
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      if (!['COMPLETED', 'PAID', 'PROCESSING'].includes(order.status)) {
        throw new Error('Order cannot be refunded');
      }
      
      // Get user with current balance
      const user = await tx.user.findUnique({
        where: { id: order.userId },
        select: { balance: true },
      });
      
      // Update payment
      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: 'REFUNDED' },
        });
      }
      
      // Refund to user balance
      const newBalance = Number(user.balance) + Number(order.total);
      
      await tx.user.update({
        where: { id: order.userId },
        data: { balance: newBalance },
      });
      
      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: order.userId,
          type: 'REFUND',
          amount: order.total,
          fee: 0,
          netAmount: order.total,
          balanceBefore: Number(user.balance),
          balanceAfter: newBalance,
          reference: order.id,
          description: `Refund for order ${order.orderNumber}: ${reason}`,
        },
      });
      
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' },
      });
      
      // Add timeline
      await tx.orderTimeline.create({
        data: {
          orderId,
          status: 'REFUNDED',
          message: `Refund processed: ${reason}`,
          adminId,
        },
      });
      
      return { success: true };
    }, {
      isolationLevel: 'Serializable',
    });
  }

  // ==================== Balance (Atomic) ====================
  
  async addBalance(userId, amount, description = 'Balance deposit') {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });
      
      const newBalance = Number(user.balance) + amount;
      
      await tx.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      });
      
      await tx.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount,
          fee: 0,
          netAmount: amount,
          balanceBefore: Number(user.balance),
          balanceAfter: newBalance,
          description,
        },
      });
      
      return true;
    }, {
      isolationLevel: 'Serializable',
    });
  }

  async getUserBalance(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    return user?.balance || 0;
  }

  // ==================== Optimistic Lock Helpers ====================
  
  async confirmPaymentWithLock(paymentId, updateData) {
    const maxRetries = 3;
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        return await this._confirmPaymentAttempt(paymentId, updateData);
      } catch (error) {
        if (error.code === 'P2034' || error.message.includes('version')) {
          attempts++;
          console.log(`Optimistic lock conflict on payment ${paymentId}, retry ${attempts}/${maxRetries}`);
          if (attempts >= maxRetries) {
            throw new OptimisticLockError(`Failed to update payment after ${maxRetries} attempts`);
          }
          await new Promise(resolve => setTimeout(resolve, 100 * attempts));
        } else {
          throw error;
        }
      }
    }
  }
  
  async _confirmPaymentAttempt(paymentId, updateData) {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      if (payment.status === 'CONFIRMED') {
        return { success: false, message: 'Payment already confirmed', alreadyDone: true };
      }
      
      await tx.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          ...updateData,
          status: 'CONFIRMED',
        },
      });
      
      return { success: true, alreadyDone: false };
    }, {
      isolationLevel: 'Serializable',
    });
  }
  
  async confirmOrderWithLock(orderId, adminId = null) {
    const maxRetries = 3;
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        return await this._confirmOrderAttempt(orderId, adminId);
      } catch (error) {
        if (error.code === 'P2034' || error.message.includes('version')) {
          attempts++;
          console.log(`Optimistic lock conflict on order ${orderId}, retry ${attempts}/${maxRetries}`);
          if (attempts >= maxRetries) {
            throw new OptimisticLockError(`Failed to update order after ${maxRetries} attempts`);
          }
          await new Promise(resolve => setTimeout(resolve, 100 * attempts));
        } else {
          throw error;
        }
      }
    }
  }
  
  async _confirmOrderAttempt(orderId, adminId) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } }, user: true },
      });
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      if (order.paymentStatus === 'CONFIRMED') {
        return { success: false, message: 'Order already confirmed', alreadyDone: true };
      }
      
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentStatus: 'CONFIRMED',
          paidAt: new Date(),
        },
      });
      
      await tx.orderTimeline.create({
        data: {
          orderId,
          status: 'PAID',
          message: 'Payment confirmed',
          adminId,
        },
      });
      
      return { success: true, alreadyDone: false, order };
    }, {
      isolationLevel: 'Serializable',
    });
  }

  // ==================== Casso Webhook (VietQR) ====================
  
  async processCassoWebhook(payload) {
    const { data, signature } = payload;
    
    if (signature !== config.casso.webhookSecret) {
      throw new Error('Invalid webhook signature');
    }
    
    const results = [];
    
    for (const transaction of data) {
      const webhookId = transaction.id;
      
      // Check deduplication
      const existing = await prisma.processedWebhook.findUnique({
        where: {
          provider_webhookId: {
            provider: 'casso',
            webhookId: String(webhookId),
          },
        },
      });
      
      if (existing) {
        console.log(`Casso webhook ${webhookId} already processed, skipping`);
        results.push({ webhookId, success: true, skipped: true });
        continue;
      }
      
      // Extract order number from transfer note
      const orderNumber = transaction.content;
      
      if (!orderNumber || !orderNumber.startsWith('MMO')) {
        continue;
      }
      
      // Find pending order
      const order = await prisma.order.findFirst({
        where: {
          orderNumber,
          paymentStatus: 'PENDING',
          paymentMethod: { in: ['VIETQR', 'BANK_TRANSFER'] },
        },
        include: { payment: true },
      });
      
      if (!order) {
        console.log(`Order ${orderNumber} not found or not pending`);
        continue;
      }
      
      // Verify amount
      const transactionAmount = transaction.amount;
      if (Number(order.total) !== transactionAmount) {
        console.log(`Amount mismatch for order ${orderNumber}: expected ${order.total}, got ${transactionAmount}`);
        continue;
      }
      
      try {
        // Confirm payment
        await this.confirmPaymentWithLock(order.payment?.id, {
          transferNote: transaction.content,
        });
        
        // Confirm order atomically
        const confirmResult = await this.confirmOrderWithLock(order.id);
        
        // Mark webhook as processed
        await prisma.processedWebhook.create({
          data: {
            provider: 'casso',
            webhookId: String(webhookId),
            response: { orderId: order.id },
          },
        });
        
        results.push({
          webhookId,
          orderNumber,
          orderId: order.id,
          success: true,
        });
      } catch (error) {
        console.error(`Failed to process Casso webhook ${webhookId}:`, error.message);
        results.push({
          webhookId,
          orderNumber,
          orderId: order.id,
          success: false,
          error: error.message,
        });
      }
    }
    
    return results;
  }

  // ==================== TheSieuRe Webhook (Card Payment) ====================
  
  async processTheSieuReWebhook(webhookData) {
    const { trans_id, status, amount, order_id } = webhookData;
    
    // Check deduplication
    const existing = await prisma.processedWebhook.findUnique({
      where: {
        provider_webhookId: {
          provider: 'thesieure',
          webhookId: String(trans_id),
        },
      },
    });
    
    if (existing) {
      console.log(`TheSieuRe webhook ${trans_id} already processed`);
      return { success: true, skipped: true };
    }
    
    // Find order
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: order_id,
        paymentStatus: 'PENDING',
        paymentMethod: 'CARD',
      },
      include: { payment: true },
    });
    
    if (!order) {
      console.log(`Order ${order_id} not found for card payment`);
      // Still mark webhook as processed to avoid retries
      await prisma.processedWebhook.create({
        data: {
          provider: 'thesieure',
          webhookId: String(trans_id),
          response: webhookData,
        },
      });
      return { success: false, error: 'Order not found' };
    }
    
    // Verify amount (with small tolerance for card processing fees)
    if (Number(order.total) > Number(amount) * 1.05) {
      console.log(`Amount mismatch for order ${order_id}: expected ~${order.total}, got ${amount}`);
      await prisma.processedWebhook.create({
        data: {
          provider: 'thesieure',
          webhookId: String(trans_id),
          response: webhookData,
        },
      });
      return { success: false, error: 'Amount mismatch' };
    }
    
    try {
      // Confirm payment
      if (order.payment) {
        await this.confirmPaymentWithLock(order.payment.id, {
          transferNote: `Card payment ${trans_id}`,
        });
      }
      
      // Confirm order
      await this.confirmOrderWithLock(order.id);
      
      // Mark webhook as processed
      await prisma.processedWebhook.create({
        data: {
          provider: 'thesieure',
          webhookId: String(trans_id),
          response: { orderId: order.id },
        },
      });
      
      return { success: true, orderId: order.id, orderNumber: order.orderNumber };
    } catch (error) {
      console.error(`Failed to process TheSieuRe webhook ${trans_id}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // ==================== USDT Webhook (TRC20) ====================
  
  async processUsdtWebhook(webhookData) {
    const { transactionHash, from, to, amount } = webhookData;
    
    // Check deduplication
    const existing = await prisma.processedWebhook.findUnique({
      where: {
        provider_webhookId: {
          provider: 'usdt',
          webhookId: String(transactionHash),
        },
      },
    });
    
    if (existing) {
      console.log(`USDT webhook ${transactionHash} already processed`);
      return { success: true, skipped: true };
    }
    
    // Verify transaction on TronGrid
    const txInfo = await this.checkUsdtTransaction(transactionHash);
    
    if (!txInfo.valid) {
      console.log(`Invalid USDT transaction ${transactionHash}`);
      return { success: false, error: 'Invalid transaction' };
    }
    
    // Find pending order with matching deposit address
    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PENDING',
        paymentMethod: 'USDT_TRC20',
      },
      include: { 
        payment: true,
        user: true,
      },
    });
    
    // Find the order that matches this deposit address
    let matchedOrder = null;
    for (const order of pendingOrders) {
      if (order.payment?.depositAddress === to && Number(order.total) <= amount) {
        matchedOrder = order;
        break;
      }
    }
    
    if (!matchedOrder) {
      console.log(`No matching order found for USDT deposit to ${to}`);
      // Mark as processed to avoid retry
      await prisma.processedWebhook.create({
        data: {
          provider: 'usdt',
          webhookId: String(transactionHash),
          response: { error: 'No matching order' },
        },
      });
      return { success: false, error: 'No matching order' };
    }
    
    try {
      // Confirm payment
      await this.confirmPaymentWithLock(matchedOrder.payment.id, {
        transferNote: `USDT TX: ${transactionHash}`,
      });
      
      // Confirm order
      await this.confirmOrderWithLock(matchedOrder.id);
      
      // Mark webhook as processed
      await prisma.processedWebhook.create({
        data: {
          provider: 'usdt',
          webhookId: String(transactionHash),
          response: { orderId: matchedOrder.id },
        },
      });
      
      return { success: true, orderId: matchedOrder.id, orderNumber: matchedOrder.orderNumber };
    } catch (error) {
      console.error(`Failed to process USDT webhook ${transactionHash}:`, error.message);
      return { success: false, error: error.message };
    }
  }
  
  // ==================== Poll USDT Transaction (for frontend) ====================
  
  async pollUsdtTransaction(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    
    if (!order || order.paymentStatus === 'CONFIRMED') {
      return { confirmed: true, order };
    }
    
    // Get pending USDT transactions for this deposit address
    // This is a simplified version - in production you'd query TronGrid API
    // For now, just return current status
    return { confirmed: order.paymentStatus === 'CONFIRMED', order };
  }
}

export default new PaymentService();
