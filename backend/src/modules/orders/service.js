import repository from './repository.js';
import productRepository from '../products/repository.js';
import couponService from '../coupons/coupon.service.js';
import inventoryService from '../inventory/inventory.service.js';
import paymentService from '../payments/payment.service.js';
import telegramService from '../notifications/telegram.service.js';
import deliveryService from '../../services/delivery.service.js';
import prisma from '../../database/prisma.js';

class OrderService {
  // Bulk discount configuration - MUST match frontend
  static BULK_DISCOUNT_TIERS = [
    { minQty: 10, discount: 10 }, // 10+ items = 10% off
    { minQty: 5, discount: 5 },  // 5-9 items = 5% off
  ];

  // Calculate bulk discount based on quantity
  static getBulkDiscount(quantity) {
    for (const tier of OrderService.BULK_DISCOUNT_TIERS) {
      if (quantity >= tier.minQty) {
        return tier.discount;
      }
    }
    return 0;
  }

  async create(data, userId) {
    // Get products and calculate totals
    const productIds = data.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    
    if (products.length !== productIds.length) {
      throw new Error('Some products not found');
    }
    
    // Check stock and build items
    let subtotal = 0;
    let totalBulkDiscount = 0;
    const orderItems = [];
    
    for (const item of data.items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product.isActive || product.isArchived) {
        throw new Error(`Product "${product.name}" is not available`);
      }
      
      if (!product.unlimitedStock && product.stock < (item.quantity || 1)) {
        throw new Error(`Insufficient stock for "${product.name}"`);
      }
      
      const quantity = item.quantity || 1;
      const price = product.effectivePrice || product.price;
      const itemTotal = Number(price) * quantity;
      
      // Calculate bulk discount (server-side - cannot trust client)
      const bulkDiscountPercent = OrderService.getBulkDiscount(quantity);
      const bulkDiscountAmount = itemTotal * (bulkDiscountPercent / 100);
      const itemSubtotal = itemTotal - bulkDiscountAmount;
      
      subtotal += itemTotal;
      totalBulkDiscount += bulkDiscountAmount;
      
      orderItems.push({
        productId: product.id,
        quantity,
        price,
        bulkDiscount: bulkDiscountPercent,
        bulkDiscountAmount,
        itemSubtotal,
        product,
      });
    }
    
    // Apply coupon if provided (after bulk discount)
    let discount = totalBulkDiscount; // Start with bulk discount
    let couponId = null;
    let couponCode = null;
    
    if (data.couponCode) {
      try {
        // Apply coupon to the subtotal (after bulk discount)
        const couponResult = await couponService.applyCoupon(data.couponCode, userId, subtotal - totalBulkDiscount);
        discount += couponResult.discount;
        couponId = couponResult.coupon.id;
        couponCode = couponResult.coupon.code;
      } catch (couponError) {
        console.log(`Coupon error: ${couponError.message}`);
        // Continue with bulk discount only
      }
    }
    
    const total = subtotal - discount;
    
    // Generate order number
    const orderNumber = `MMO${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Create order
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          discount,
          total,
          couponId,
          couponCode,
          paymentMethod: data.paymentMethod,
          customerNote: data.customerNote,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });
      
      // Create order items with bulk discount info
      for (const item of orderItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            bulkDiscountPercent: item.bulkDiscount,
            bulkDiscountAmount: item.bulkDiscountAmount,
          },
        });
      }
      
      return newOrder;
    });
    
    // Process payment based on method
    if (data.paymentMethod === 'BALANCE') {
      await this.processBalancePayment(order.id, userId, total);
    } else if (data.paymentMethod === 'VIETQR' || data.paymentMethod === 'BANK_TRANSFER') {
      // Create VietQR payment
      const payment = await paymentService.createVietQrPayment(order.id, total);
      await prisma.payment.update({
        where: { id: payment.id },
        data: { orderId: order.id },
      });
    } else if (data.paymentMethod === 'USDT_TRC20') {
      // Generate USDT payment
      const payment = await paymentService.createUsdtPayment(order.id, total);
      await prisma.payment.update({
        where: { id: payment.id },
        data: { orderId: order.id },
      });
    } else if (data.paymentMethod === 'CARD') {
      // Card payment via TheSieuRe - create payment record
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          method: 'CARD',
          status: 'PENDING',
        },
      });
    }
    
    // Send Telegram notification for new order
    if (telegramService.isEnabled()) {
      const fullOrder = await this.getById(order.id);
      telegramService.sendNewOrderNotification(fullOrder);
    }
    
    // Add timeline
    await repository.addTimelineEntry(order.id, 'PENDING', 'Order created');
    
    return this.getById(order.id);
  }

  async processBalancePayment(orderId, userId, total) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (Number(user.balance) < total) {
      throw new Error('Insufficient balance');
    }
    
    await prisma.$transaction(async (tx) => {
      // Deduct balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: total } },
      });
      
      // Create transaction
      await tx.transaction.create({
        data: {
          userId,
          type: 'PURCHASE',
          amount: total,
          fee: 0,
          netAmount: total,
          balanceBefore: Number(user.balance),
          balanceAfter: Number(user.balance) - total,
          reference: orderId,
          description: `Order payment`,
        },
      });
      
      // Update payment if exists
      await tx.payment.updateMany({
        where: { orderId, method: 'BALANCE' },
        data: { status: 'CONFIRMED' },
      });
    });
    
    // Confirm order and trigger delivery
    await this.confirmOrder(orderId);
  }

  async getById(id) {
    const order = await repository.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async getByOrderNumber(orderNumber) {
    const order = await repository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async getUserOrders(userId, params = {}) {
    return repository.findByUserId(userId, params);
  }

  async getAllOrders(params = {}) {
    return repository.findAll(params);
  }

  async updateStatus(id, status, note = null, adminId = null) {
    const order = await repository.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Validate status transition
    const validTransitions = {
      PENDING: ['AWAITING_PAYMENT', 'CANCELLED'],
      AWAITING_PAYMENT: ['PAID', 'CANCELLED', 'FAILED'],
      PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
      PROCESSING: ['COMPLETED', 'REFUNDED', 'CANCELLED'],
      COMPLETED: ['REFUNDED'],
    };
    
    if (!validTransitions[order.status]?.includes(status)) {
      throw new Error(`Cannot transition from ${order.status} to ${status}`);
    }
    
    // Handle status-specific logic
    if (status === 'CANCELLED') {
      await this.handleCancellation(id, adminId);
    } else if (status === 'REFUNDED') {
      await this.handleRefund(id, adminId);
    } else if (status === 'COMPLETED') {
      await this.completeOrder(id);
    }
    
    const updated = await repository.updateStatus(id, status, note, adminId);
    
    // Send Telegram notification
    if (telegramService.isEnabled()) {
      telegramService.sendOrderStatusNotification(updated);
    }
    
    return updated;
  }

  async confirmOrder(orderId, adminId = null) {
    const order = await repository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.paymentStatus === 'CONFIRMED') {
      console.log(`Order ${order.orderNumber} already confirmed`);
      return order;
    }
    
    // Update status to PAID
    await prisma.$transaction(async (tx) => {
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
    });
    
    // Update coupon usage
    if (order.couponId) {
      try {
        await couponService.incrementUsage(order.couponId);
      } catch (e) {
        console.log(`Coupon increment error: ${e.message}`);
      }
    }
    
    // Process delivery immediately
    try {
      await deliveryService.processOrderDelivery(orderId);
    } catch (deliveryError) {
      console.error(`Delivery failed for order ${order.orderNumber}:`, deliveryError.message);
      // Order is paid, delivery will be retried by worker
    }
    
    // Send notifications
    if (telegramService.isEnabled()) {
      const updatedOrder = await this.getById(orderId);
      telegramService.sendPaymentReceivedNotification(updatedOrder);
    }
    
    return this.getById(orderId);
  }

  async processDelivery(orderId) {
    return await deliveryService.processOrderDelivery(orderId);
  }

  async completeOrder(orderId) {
    await repository.updateStatus(orderId, 'COMPLETED', 'Order completed');
    
    const order = await repository.findById(orderId);
    
    // Update user total spent
    await prisma.user.update({
      where: { id: order.userId },
      data: { totalSpent: { increment: order.total } },
    });
    
    // Process affiliate commission
    await this.processAffiliateCommission(order);
    
    if (telegramService.isEnabled()) {
      telegramService.sendOrderCompletedNotification(order);
    }
  }

  async handleCancellation(orderId, adminId) {
    const order = await repository.findById(orderId);
    
    // Return stock if items were reserved
    for (const item of order.items) {
      if (item.inventoryItemId) {
        await inventoryService.releaseItem(item.inventoryItemId);
      }
      if (item.licenseKeyId) {
        await inventoryService.deactivateLicense(item.licenseKeyId);
      }
    }
    
    // Refund if paid
    if (order.paymentStatus === 'CONFIRMED') {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: order.userId },
          select: { balance: true },
        });
        
        await tx.user.update({
          where: { id: order.userId },
          data: { balance: { increment: order.total } },
        });
        
        await tx.transaction.create({
          data: {
            userId: order.userId,
            type: 'REFUND',
            amount: order.total,
            fee: 0,
            netAmount: order.total,
            balanceBefore: Number(user.balance),
            balanceAfter: Number(user.balance) + Number(order.total),
            reference: order.id,
            description: `Refund for cancelled order ${order.orderNumber}`,
          },
        });
      });
    }
    
    if (telegramService.isEnabled()) {
      telegramService.sendOrderCancelledNotification(order);
    }
  }

  async handleRefund(orderId, adminId) {
    const order = await repository.findById(orderId);
    
    // Return stock
    for (const item of order.items) {
      if (item.inventoryItemId) {
        await inventoryService.releaseItem(item.inventoryItemId);
      }
      if (item.licenseKeyId) {
        await inventoryService.deactivateLicense(item.licenseKeyId);
      }
    }
    
    // Refund to user balance
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: order.userId },
        select: { balance: true },
      });
      
      await tx.user.update({
        where: { id: order.userId },
        data: { balance: { increment: order.total } },
      });
      
      await tx.transaction.create({
        data: {
          userId: order.userId,
          type: 'REFUND',
          amount: order.total,
          fee: 0,
          netAmount: order.total,
          balanceBefore: Number(user.balance),
          balanceAfter: Number(user.balance) + Number(order.total),
          reference: order.id,
          description: `Refund for order ${order.orderNumber}`,
          adminId,
        },
      });
    });
    
    // Reverse affiliate commission if any
    if (order.affiliateId) {
      // Reverse commission logic here
    }
    
    if (telegramService.isEnabled()) {
      telegramService.sendRefundNotification(order);
    }
  }

  async processAffiliateCommission(order) {
    // Find affiliate use for this user (first order only)
    const affiliateUse = await prisma.affiliateUse.findFirst({
      where: {
        newUserId: order.userId,
        orderId: null,
      },
      include: { affiliateCode: true },
    });
    
    if (affiliateUse) {
      const commission = Number(order.total) * (Number(affiliateUse.affiliateCode.commission) / 100);
      
      // Update order with affiliate
      await prisma.order.update({
        where: { id: order.id },
        data: { affiliateId: affiliateUse.affiliateCode.id },
      });
      
      // Add commission to affiliate balance
      await prisma.affiliateCode.update({
        where: { id: affiliateUse.affiliateCode.id },
        data: {
          pendingEarnings: { increment: commission },
        },
      });
      
      // Update affiliate use
      await prisma.affiliateUse.update({
        where: { id: affiliateUse.id },
        data: {
          orderId: order.id,
          commission,
          status: 'EARNED',
        },
      });
    }
  }

  async addNote(orderId, note, adminId) {
    const order = await repository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    return repository.addNote(orderId, note, true, adminId);
  }

  async getStatistics(startDate, endDate) {
    return repository.getStatistics(startDate, endDate);
  }
}

export default new OrderService();
