import prisma from '../../database/prisma.js';
import crypto from 'crypto';

class LicenseService {
  async generateLicenseKey(productId, length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    
    // Format: XXXX-XXXX-XXXX-XXXX
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) key += '-';
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return prisma.licenseKey.create({
      data: {
        productId,
        key,
        status: 'INACTIVE',
      },
    });
  }

  async generateBulkKeys(productId, count, adminId) {
    const keys = [];
    
    for (let i = 0; i < count; i++) {
      const key = await this.generateLicenseKey(productId);
      keys.push(key);
    }
    
    // Increment product stock
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: count } },
    });
    
    // Log
    await this.logLicenseAction(null, 'BULK_GENERATED', `Generated ${count} keys`, adminId);
    
    return keys;
  }

  async activateLicense(keyString, userId, ipAddress = null, hwid = null) {
    const key = await prisma.licenseKey.findUnique({
      where: { key: keyString },
      include: { product: true },
    });
    
    if (!key) {
      throw new Error('License key not found');
    }
    
    if (key.status === 'BLACKLISTED') {
      throw new Error('This license key has been blacklisted');
    }
    
    if (key.status === 'ACTIVE' && key.userId !== userId) {
      throw new Error('This license key is already in use');
    }
    
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      throw new Error('This license key has expired');
    }
    
    // Check HWID if enabled
    if (key.hwid && key.hwid !== hwid) {
      throw new Error('License key is bound to another device');
    }
    
    const updated = await prisma.licenseKey.update({
      where: { id: key.id },
      data: {
        status: 'ACTIVE',
        userId,
        activatedAt: new Date(),
        ipAddress,
        hwid,
      },
    });
    
    await this.logLicenseAction(key.id, 'ACTIVATED', 'License activated', userId, null, { ipAddress, hwid });
    
    return updated;
  }

  async deactivateLicense(keyId, adminId = null) {
    const key = await prisma.licenseKey.findUnique({ where: { id: keyId } });
    
    if (!key) {
      throw new Error('License key not found');
    }
    
    const updated = await prisma.licenseKey.update({
      where: { id: keyId },
      data: {
        status: 'INACTIVE',
        userId: null,
        activatedAt: null,
        ipAddress: null,
        hwid: null,
      },
    });
    
    await this.logLicenseAction(key.id, 'DEACTIVATED', 'License deactivated', adminId);
    
    return updated;
  }

  async blacklistLicense(keyId, adminId) {
    const key = await prisma.licenseKey.findUnique({ where: { id: keyId } });
    
    if (!key) {
      throw new Error('License key not found');
    }
    
    const updated = await prisma.licenseKey.update({
      where: { id: keyId },
      data: {
        status: 'BLACKLISTED',
      },
    });
    
    await this.logLicenseAction(key.id, 'BLACKLISTED', 'License blacklisted', adminId);
    
    return updated;
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

  async getLicensesForProduct(productId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    
    const [keys, total] = await Promise.all([
      prisma.licenseKey.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.licenseKey.count({ where: { productId } }),
    ]);
    
    return {
      keys,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserLicenses(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    
    const [keys, total] = await Promise.all([
      prisma.licenseKey.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { activatedAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              thumbnail: true,
            },
          },
        },
      }),
      prisma.licenseKey.count({ where: { userId } }),
    ]);
    
    return {
      keys,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLicenseLogs(keyId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      prisma.licenseLog.findMany({
        where: { keyId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.licenseLog.count({ where: { keyId } }),
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

  async logLicenseAction(keyId, action, description, userId = null, oldData = null, newData = null) {
    return prisma.licenseLog.create({
      data: {
        keyId,
        action,
        description,
        userId,
        ipAddress: newData?.ipAddress || null,
        hwid: newData?.hwid || null,
      },
    });
  }

  async getLicenseStatistics(productId = null) {
    const where = productId ? { productId } : {};
    
    const stats = await prisma.licenseKey.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
    
    const total = stats.reduce((acc, s) => acc + s._count.id, 0);
    
    return {
      total,
      active: stats.find(s => s.status === 'ACTIVE')?._count.id || 0,
      inactive: stats.find(s => s.status === 'INACTIVE')?._count.id || 0,
      blacklisted: stats.find(s => s.status === 'BLACKLISTED')?._count.id || 0,
      expired: stats.find(s => s.status === 'EXPIRED')?._count.id || 0,
    };
  }
}

export default new LicenseService();
