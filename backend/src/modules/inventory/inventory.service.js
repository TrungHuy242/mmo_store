import prisma from '../../database/prisma.js';

class InventoryService {
  async getInventoryItems(productId, { page = 1, limit = 50, status } = {}) {
    const skip = (page - 1) * limit;
    
    const where = { productId };
    if (status) {
      where.status = status;
    }
    
    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          addedBy: { select: { id: true, email: true } },
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);
    
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLowStockProducts() {
    // Get products with low stock
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isArchived: false,
        unlimitedStock: false,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockThreshold: true,
      },
    });
    
    // Filter products that are below threshold
    return products.filter(p => p.stock <= p.lowStockThreshold);
  }

  async getInventoryForProduct(productId) {
    const stats = await prisma.inventoryItem.groupBy({
      by: ['status'],
      where: { productId },
      _count: { id: true },
    });
    
    return {
      available: stats.find(s => s.status === 'AVAILABLE')?._count.id || 0,
      reserved: stats.find(s => s.status === 'RESERVED')?._count.id || 0,
      sold: stats.find(s => s.status === 'SOLD')?._count.id || 0,
      expired: stats.find(s => s.status === 'EXPIRED')?._count.id || 0,
    };
  }

  async addInventoryItem(data, adminId) {
    const item = await prisma.inventoryItem.create({
      data: {
        productId: data.productId,
        content: data.content,
        extraData: data.extraData,
        username: data.username,
        password: data.password,
        status: 'AVAILABLE',
        addedById: adminId,
        expiresAt: data.expiresAt,
      },
      include: {
        product: true,
      },
    });
    
    // Increment product stock
    await prisma.product.update({
      where: { id: data.productId },
      data: { stock: { increment: 1 } },
    });
    
    // Log
    await this.logInventoryAction(item.id, 'ADDED', 'Item added to inventory', adminId);
    
    return item;
  }

  async addBulkInventoryItems(productId, items, adminId) {
    const createdItems = [];
    
    for (const itemData of items) {
      const item = await prisma.inventoryItem.create({
        data: {
          productId,
          content: itemData.content,
          extraData: itemData.extraData,
          username: itemData.username,
          password: itemData.password,
          status: 'AVAILABLE',
          addedById: adminId,
        },
      });
      createdItems.push(item);
    }
    
    // Increment product stock
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: items.length } },
    });
    
    // Log
    for (const item of createdItems) {
      await this.logInventoryAction(item.id, 'ADDED', 'Bulk items added', adminId);
    }
    
    return createdItems;
  }

  async updateInventoryItem(id, data, adminId) {
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        content: data.content,
        extraData: data.extraData,
        expiresAt: data.expiresAt,
      },
    });
    
    await this.logInventoryAction(id, 'UPDATED', 'Item updated', adminId, null, data);
    
    return item;
  }

  async deleteInventoryItem(id, adminId) {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    
    if (!item) {
      throw new Error('Inventory item not found');
    }
    
    if (item.status !== 'AVAILABLE') {
      throw new Error('Cannot delete non-available items');
    }
    
    await prisma.inventoryItem.delete({ where: { id } });
    
    // Decrement product stock
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: 1 } },
    });
    
    await this.logInventoryAction(id, 'DELETED', 'Item deleted', adminId, item);
    
    return true;
  }

  async getInventoryItemForOrder(productId) {
    return prisma.inventoryItem.findFirst({
      where: {
        productId,
        status: 'AVAILABLE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getLicenseKeyForOrder(productId) {
    return prisma.licenseKey.findFirst({
      where: {
        productId,
        status: 'INACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markAsSold(itemId, orderId, orderItemId) {
    const item = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        status: 'SOLD',
        purchasedAt: new Date(),
        soldAt: new Date(),
        orderId,
        orderItemId,
      },
    });
    
    await this.logInventoryAction(itemId, 'SOLD', `Sold via order item ${orderItemId}`, null);
    
    return item;
  }

  async markLicenseAsUsed(licenseId, orderId, orderItemId) {
    const license = await prisma.licenseKey.update({
      where: { id: licenseId },
      data: {
        status: 'ACTIVE',
        orderId,
        orderItemId,
        activatedAt: new Date(),
      },
    });
    
    await prisma.inventoryLog.create({
      data: {
        itemId: licenseId,
        action: 'ACTIVATED',
        description: `License activated for order item ${orderItemId}`,
      },
    });
    
    return license;
  }

  async reserveItem(itemId, orderId, orderItemId) {
    const item = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        status: 'RESERVED',
        orderId,
        orderItemId,
      },
    });
    
    await this.logInventoryAction(itemId, 'RESERVED', `Reserved for order ${orderId}`, null);
    
    return item;
  }

  async releaseItem(itemId) {
    const item = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        status: 'AVAILABLE',
        orderId: null,
        orderItemId: null,
        purchasedAt: null,
        soldAt: null,
      },
    });
    
    await this.logInventoryAction(itemId, 'RELEASED', 'Item released back to inventory');
    
    return item;
  }

  async releaseLicense(licenseId) {
    const license = await prisma.licenseKey.update({
      where: { id: licenseId },
      data: {
        status: 'INACTIVE',
        orderId: null,
        orderItemId: null,
        activatedAt: null,
      },
    });
    
    await prisma.inventoryLog.create({
      data: {
        itemId: licenseId,
        action: 'RELEASED',
        description: 'License released back to pool',
      },
    });
    
    return license;
  }

  async markAsExpired(itemId) {
    const item = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { status: 'EXPIRED' },
    });
    
    // Decrement product stock
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: 1 } },
    });
    
    await this.logInventoryAction(itemId, 'EXPIRED', 'Item marked as expired');
    
    return item;
  }

  async deactivateLicense(licenseId) {
    const license = await prisma.licenseKey.update({
      where: { id: licenseId },
      data: { status: 'INACTIVE' },
    });
    
    await prisma.inventoryLog.create({
      data: {
        itemId: licenseId,
        action: 'DEACTIVATED',
        description: 'License deactivated',
      },
    });
    
    return license;
  }

  async getInventoryLogs(itemId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where: { itemId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { id: true, email: true } },
        },
      }),
      prisma.inventoryLog.count({ where: { itemId } }),
    ]);
    
    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async logInventoryAction(itemId, action, description, adminId = null, oldData = null, newData = null) {
    return prisma.inventoryLog.create({
      data: {
        itemId,
        action,
        description,
        adminId,
        oldData,
        newData,
      },
    });
  }

  async checkAndMarkExpiredItems() {
    const expiredItems = await prisma.inventoryItem.findMany({
      where: {
        status: { in: ['AVAILABLE', 'RESERVED'] },
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    
    for (const item of expiredItems) {
      await this.markAsExpired(item.id);
    }
    
    // Also check expired licenses
    const expiredLicenses = await prisma.licenseKey.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    
    for (const license of expiredLicenses) {
      await prisma.licenseKey.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' },
      });
    }
    
    return expiredItems.length + expiredLicenses.length;
  }

  async releaseExpiredReservations() {
    // Release items that have been reserved for too long (e.g., 24 hours)
    const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const expiredReservations = await prisma.inventoryItem.findMany({
      where: {
        status: 'RESERVED',
        updatedAt: { lt: expirationTime },
      },
    });
    
    for (const item of expiredReservations) {
      await this.releaseItem(item.id);
    }
    
    return expiredReservations.length;
  }

  async getInventoryStatistics(productId = null) {
    const where = productId ? { productId } : {};
    
    const stats = await prisma.inventoryItem.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
    
    const total = stats.reduce((acc, s) => acc + s._count.id, 0);
    
    return {
      total,
      available: stats.find(s => s.status === 'AVAILABLE')?._count.id || 0,
      reserved: stats.find(s => s.status === 'RESERVED')?._count.id || 0,
      sold: stats.find(s => s.status === 'SOLD')?._count.id || 0,
      expired: stats.find(s => s.status === 'EXPIRED')?._count.id || 0,
    };
  }
}

export default new InventoryService();
