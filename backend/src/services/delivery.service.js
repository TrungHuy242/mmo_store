import prisma from '../database/prisma.js';
import licenseService from '../modules/licenses/license.service.js';
import inventoryService from '../modules/inventory/inventory.service.js';
import assetService from '../modules/assets/asset.service.js';
import telegramService from '../modules/notifications/telegram.service.js';
import emailService from '../modules/notifications/email.service.js';

class DeliveryService {
  // Process delivery for an order
  async processOrderDelivery(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const deliveryResults = [];

    for (const item of order.items) {
      const result = await this.deliverOrderItem(item, order.user);
      deliveryResults.push(result);
    }

    // Update order status
    const allSuccess = deliveryResults.length > 0 && deliveryResults.every(r => r.success);

    if (allSuccess) {
      // Import dynamically to avoid circular dependency
      const orderService = (await import('../modules/orders/service.js')).default;
      await orderService.completeOrder(orderId);
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PROCESSING',
          deliveredAt: new Date(),
        },
      });

      // Add timeline entry
      await prisma.orderTimeline.create({
        data: {
          orderId,
          status: 'PROCESSING',
          message: 'Digital delivery initiated (some items failed or partial delivery)',
        },
      });
    }

    // Send notifications
    await this.sendDeliveryNotifications(order, deliveryResults);

    return deliveryResults;
  }

  // Deliver a single order item
  async deliverOrderItem(orderItem, user) {
    const product = orderItem.product;

    switch (product.productType) {
      case 'license':
        return await this.deliverLicense(orderItem, user);
      
      case 'account':
        return await this.deliverAccount(orderItem, user);
      
      case 'digital':
      default:
        return await this.deliverDigital(orderItem, user);
    }
  }

  // Deliver license key
  async deliverLicense(orderItem, user) {
    // Get available license key
    const license = await licenseService.getLicenseKeyForOrder(orderItem.productId);

    if (!license) {
      return {
        success: false,
        type: 'license',
        productName: orderItem.product.name,
        message: 'No license keys available',
      };
    }

    // Activate license for user
    await prisma.licenseKey.update({
      where: { id: license.id },
      data: {
        status: 'ACTIVE',
        userId: user.id,
        orderId: orderItem.orderId,
        orderItemId: orderItem.id,
        activatedAt: new Date(),
      },
    });

    // Log
    await prisma.licenseLog.create({
      data: {
        keyId: license.id,
        action: 'ACTIVATED',
        description: `License activated for order item ${orderItem.id}`,
        userId: user.id,
      },
    });

    // Update order item with license
    await prisma.orderItem.update({
      where: { id: orderItem.id },
      data: {
        licenseKeyId: license.id,
        deliveryData: license.content || license.key,
        deliveredAt: new Date(),
      },
    });

    // Update product sales count
    await prisma.product.update({
      where: { id: orderItem.productId },
      data: {
        salesCount: { increment: orderItem.quantity },
      },
    });

    return {
      success: true,
      type: 'license',
      productName: orderItem.product.name,
      deliveryData: {
        key: license.key,
        content: license.content,
      },
    };
  }

  // Deliver account/inventory item
  async deliverAccount(orderItem, user) {
    // Get available inventory item
    const inventoryItem = await inventoryService.getInventoryItemForOrder(orderItem.productId);

    if (!inventoryItem) {
      return {
        success: false,
        type: 'account',
        productName: orderItem.product.name,
        message: 'No accounts available',
      };
    }

    // Mark inventory as sold
    await prisma.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: {
        status: 'SOLD',
        orderId: orderItem.orderId,
        orderItemId: orderItem.id,
        purchasedAt: new Date(),
        soldAt: new Date(),
      },
    });

    // Log inventory action
    await prisma.inventoryLog.create({
      data: {
        itemId: inventoryItem.id,
        action: 'SOLD',
        description: `Sold via order item ${orderItem.id}`,
      },
    });

    // Update order item with inventory
    await prisma.orderItem.update({
      where: { id: orderItem.id },
      data: {
        inventoryItemId: inventoryItem.id,
        deliveryData: inventoryItem.content,
        deliveredAt: new Date(),
      },
    });

    // Update product sales count and decrement stock
    await prisma.product.update({
      where: { id: orderItem.productId },
      data: {
        salesCount: { increment: orderItem.quantity },
        stock: { decrement: 1 },
      },
    });

    return {
      success: true,
      type: 'account',
      productName: orderItem.product.name,
      deliveryData: {
        content: inventoryItem.content,
        username: inventoryItem.username,
      },
    };
  }

  // Deliver digital file
  async deliverDigital(orderItem, user) {
    // Get product assets
    const assets = await prisma.digitalAsset.findMany({
      where: {
        productId: orderItem.productId,
        isActive: true,
      },
    });

    if (assets.length === 0) {
      return {
        success: false,
        type: 'digital',
        productName: orderItem.product.name,
        message: 'No download files available',
      };
    }

    // Generate download URLs for each asset
    const downloadUrls = [];
    
    for (const asset of assets) {
      const url = await assetService.getSecureDownloadUrl(asset.id, user.id);
      downloadUrls.push({
        assetId: asset.id,
        name: asset.originalName,
        ...url,
      });
    }

    // Update order item
    await prisma.orderItem.update({
      where: { id: orderItem.id },
      data: {
        deliveryData: JSON.stringify({ assets: downloadUrls }),
        deliveredAt: new Date(),
      },
    });

    // Update product sales count
    await prisma.product.update({
      where: { id: orderItem.productId },
      data: {
        salesCount: { increment: orderItem.quantity },
      },
    });

    return {
      success: true,
      type: 'digital',
      productName: orderItem.product.name,
      deliveryData: {
        assets: downloadUrls,
      },
    };
  }

  // Send delivery notifications
  async sendDeliveryNotifications(order, deliveryResults) {
    const hasSuccess = deliveryResults.some(r => r.success);

    if (!hasSuccess) return;

    // Send beautiful HTML email
    if (emailService.isEnabled()) {
      try {
        await emailService.sendOrderDeliveryEmail(order, deliveryResults);
      } catch (emailError) {
        console.error('Failed to send delivery email:', emailError.message);
      }
    } else {
      // Fallback to text email if SMTP not configured
      console.log('[Email] SMTP not configured, skipping delivery email for order:', order.orderNumber);
    }

    // Send Telegram notification
    if (telegramService.isEnabled()) {
      try {
        let message = `📦 <b>Delivery Ready</b>\n\n`;
        message += `Order: <code>${order.orderNumber}</code>\n`;
        message += `Customer: ${order.user.email}\n\n`;
        
        const successCount = deliveryResults.filter(r => r.success).length;
        const failCount = deliveryResults.filter(r => !r.success).length;
        
        if (successCount > 0) {
          message += `✅ Delivered: ${successCount}\n`;
        }
        if (failCount > 0) {
          message += `⚠️ Failed: ${failCount}\n`;
        }

        await telegramService.sendMessage(message);
      } catch (telegramError) {
        console.error('Failed to send Telegram notification:', telegramError.message);
      }
    }
  }

  // Get delivery status for an order
  async getDeliveryStatus(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        productType: item.product.productType,
        quantity: item.quantity,
        delivered: !!item.deliveredAt,
        deliveryData: item.deliveryData,
      })),
    };
  }

  // Re-deliver failed items
  async redeliverFailedItems(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { deliveredAt: null },
          include: { product: true },
        },
        user: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const results = [];
    
    for (const item of order.items) {
      const result = await this.deliverOrderItem(item, order.user);
      results.push(result);
    }

    return results;
  }
}

export default new DeliveryService();
