import prisma from '../../database/prisma.js';
import { v4 as uuidv4 } from 'uuid';

class OrderRepository {
  generateOrderNumber() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'MMO';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async findById(id) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            telegramId: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                thumbnail: true,
                price: true,
                productType: true,
              },
            },
          },
        },
        coupon: true,
        payment: true,
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByOrderNumber(orderNumber) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
        timeline: true,
      },
    });
  }

  async findByUserId(userId, { page = 1, limit = 20, status } = {}) {
    const skip = (page - 1) * limit;
    
    const where = { userId };
    if (status) {
      where.status = status;
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  thumbnail: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);
    
    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAll({ page = 1, limit = 20, status, userId, search, startDate, endDate }) {
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (status) where.status = status;
    if (userId) where.userId = userId;
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              fullName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  thumbnail: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);
    
    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data) {
    const orderNumber = this.generateOrderNumber();
    
    return prisma.order.create({
      data: {
        orderNumber,
        userId: data.userId,
        subtotal: data.subtotal,
        discount: data.discount || 0,
        total: data.total,
        couponId: data.couponId,
        couponCode: data.couponCode,
        paymentMethod: data.paymentMethod,
        customerNote: data.customerNote,
        expiresAt: data.paymentMethod === 'BALANCE' 
          ? new Date(Date.now() + 15 * 60 * 1000) // 15 min for balance
          : new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h for others
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity || 1,
            price: item.price,
          })),
        },
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async update(id, data) {
    return prisma.order.update({
      where: { id },
      data,
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async updateStatus(id, status, note = null, adminId = null) {
    const updateData = { status };
    
    if (status === 'PAID') {
      updateData.paidAt = new Date();
      updateData.paymentStatus = 'CONFIRMED';
    }
    
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.deliveredAt = new Date();
    }
    
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    
    // Add timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        status,
        message: note,
        adminId,
      },
    });
    
    return order;
  }

  async addTimelineEntry(orderId, status, message, adminId = null) {
    return prisma.orderTimeline.create({
      data: {
        orderId,
        status,
        message,
        adminId,
      },
    });
  }

  async addNote(orderId, note, isAdmin = false, adminId = null) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        adminNote: isAdmin ? note : undefined,
        customerNote: !isAdmin ? note : undefined,
      },
    });
  }

  async getStatistics(startDate, endDate) {
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    const [
      totalOrders,
      totalRevenue,
      completedOrders,
      pendingOrders,
      refundedOrders,
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where: { ...where, status: { in: ['COMPLETED', 'PAID'] } },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.order.count({ where: { ...where, status: { in: ['PENDING', 'AWAITING_PAYMENT'] } } }),
      prisma.order.count({ where: { ...where, status: 'REFUNDED' } }),
    ]);
    
    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      completedOrders,
      pendingOrders,
      refundedOrders,
    };
  }
}

export default new OrderRepository();
