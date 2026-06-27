import repository from './repository.js';
import telegramService from '../notifications/telegram.service.js';
import prisma from '../../database/prisma.js';

class ProductService {
  async create(data) {
    const product = await repository.create(data);
    
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'product',
        resourceId: product.id,
        changes: product,
      },
    });
    
    return product;
  }

  async update(id, data, adminId = null) {
    const existing = await repository.findById(id, false);
    if (!existing) {
      throw new Error('Product not found');
    }
    
    const product = await repository.update(id, data);
    
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE',
        resource: 'product',
        resourceId: id,
        changes: { old: existing, new: data },
      },
    });
    
    return product;
  }

  async delete(id, adminId = null) {
    const product = await repository.findById(id, false);
    if (!product) {
      throw new Error('Product not found');
    }
    
    await repository.delete(id);
    
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'DELETE',
        resource: 'product',
        resourceId: id,
        changes: product,
      },
    });
    
    return true;
  }

  async getById(id) {
    const product = await repository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async getBySlug(slug) {
    const product = await repository.findBySlug(slug);
    if (!product) {
      throw new Error('Product not found');
    }
    
    await repository.incrementViewCount(product.id);
    
    return product;
  }

  async getAll(params) {
    return repository.findAll(params);
  }

  async archive(id, adminId = null) {
    const product = await repository.findById(id, false);
    if (!product) {
      throw new Error('Product not found');
    }
    
    await repository.archive(id);
    
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE',
        resource: 'product',
        resourceId: id,
        changes: { action: 'archived' },
      },
    });
    
    return true;
  }

  async restore(id, adminId = null) {
    const product = await repository.findById(id, false);
    if (!product) {
      throw new Error('Product not found');
    }
    
    await repository.restore(id);
    
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE',
        resource: 'product',
        resourceId: id,
        changes: { action: 'restored' },
      },
    });
    
    return true;
  }

  async toggleStatus(id, adminId = null) {
    const product = await repository.findById(id, false);
    if (!product) {
      throw new Error('Product not found');
    }
    
    const updated = await repository.update(id, { isActive: !product.isActive });
    
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE',
        resource: 'product',
        resourceId: id,
        changes: { action: updated.isActive ? 'activated' : 'deactivated' },
      },
    });
    
    return updated;
  }

  async bulkUpdate(ids, action, adminId = null) {
    if (!ids || ids.length === 0) {
      throw new Error('No products selected');
    }
    
    const result = await repository.bulkUpdateStatus(ids, action);
    
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE',
        resource: 'product',
        resourceId: ids.join(','),
        changes: { action },
      },
    });
    
    return result;
  }

  async bulkDelete(ids, adminId = null) {
    if (!ids || ids.length === 0) {
      throw new Error('No products selected');
    }
    
    const result = await repository.bulkDelete(ids);
    
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'DELETE',
        resource: 'product',
        resourceId: ids.join(','),
        changes: { count: result.count },
      },
    });
    
    return result;
  }

  async getFeatured(limit = 10) {
    return repository.getFeatured(limit);
  }

  async getTopSelling(limit = 10) {
    return repository.getTopSelling(limit);
  }

  async getStatistics() {
    return repository.getStatistics();
  }

  async updateStock(id, quantity, adminId = null) {
    const product = await repository.findById(id, false);
    if (!product) {
      throw new Error('Product not found');
    }
    
    const newStock = product.stock + quantity;
    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }
    
    const updated = await repository.update(id, { stock: newStock });
    
    if (updated.stock <= updated.lowStockThreshold && updated.stock > 0) {
      if (telegramService.isEnabled()) {
        telegramService.sendLowStockAlert(updated);
      }
    }
    
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE',
        resource: 'product',
        resourceId: id,
        changes: { action: 'stock_updated', old: product.stock, new: newStock },
      },
    });
    
    return updated;
  }

  async checkStockForItems(items) {
    const results = [];
    
    for (const item of items) {
      const { productId, quantity = 1 } = item;
      
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          stock: true,
          unlimitedStock: true,
          isActive: true,
        },
      });
      
      if (!product) {
        results.push({
          productId,
          available: false,
          reason: 'PRODUCT_NOT_FOUND',
          message: 'Sản phẩm không tồn tại',
          maxQuantity: 0,
        });
        continue;
      }
      
      if (!product.isActive) {
        results.push({
          productId,
          productName: product.name,
          available: false,
          reason: 'PRODUCT_INACTIVE',
          message: 'Sản phẩm đã ngừng bán',
          maxQuantity: 0,
        });
        continue;
      }
      
      // For unlimited stock products, always available
      if (product.unlimitedStock) {
        results.push({
          productId,
          productName: product.name,
          available: true,
          currentStock: Infinity,
          maxQuantity: Infinity,
          requestedQuantity: quantity,
        });
        continue;
      }
      
      const currentStock = product.stock || 0;
      
      if (currentStock === 0) {
        results.push({
          productId,
          productName: product.name,
          available: false,
          reason: 'OUT_OF_STOCK',
          message: 'Sản phẩm đã hết hàng',
          maxQuantity: 0,
          currentStock: 0,
        });
      } else if (quantity > currentStock) {
        results.push({
          productId,
          productName: product.name,
          available: true,
          warning: true,
          reason: 'INSUFFICIENT_STOCK',
          message: `Kho chỉ còn ${currentStock} sản phẩm`,
          maxQuantity: currentStock,
          currentStock,
          requestedQuantity: quantity,
        });
      } else {
        results.push({
          productId,
          productName: product.name,
          available: true,
          currentStock,
          maxQuantity: currentStock,
          requestedQuantity: quantity,
        });
      }
    }
    
    return results;
  }
}

export default new ProductService();
