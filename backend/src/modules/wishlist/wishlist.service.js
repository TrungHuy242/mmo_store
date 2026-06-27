import prisma from '../../database/prisma.js';

class WishlistService {
  // Add item to wishlist
  async addItem(userId, productId) {
    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive || product.isArchived) {
      throw new Error('Product is not available');
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      return { alreadyExists: true, item: existing };
    }

    const item = await prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            originalPrice: true,
            thumbnail: true,
            isActive: true,
          },
        },
      },
    });

    return { alreadyExists: false, item };
  }

  // Remove item from wishlist
  async removeItem(userId, productId) {
    const item = await prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (!item) {
      throw new Error('Item not in wishlist');
    }

    await prisma.wishlist.delete({
      where: { id: item.id },
    });

    return true;
  }

  // Get user's wishlist
  async getWishlist(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.wishlist.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              originalPrice: true,
              thumbnail: true,
              stock: true,
              unlimitedStock: true,
              isActive: true,
              isFeatured: true,
            },
          },
        },
      }),
      prisma.wishlist.count({ where: { userId } }),
    ]);

    // Filter out unavailable products
    const validItems = items.filter(item => item.product.isActive);

    return {
      items: validItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Check if product is in wishlist
  async isInWishlist(userId, productId) {
    const item = await prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    return !!item;
  }

  // Get wishlist count
  async getWishlistCount(userId) {
    return prisma.wishlist.count({ where: { userId } });
  }

  // Move item from wishlist to cart
  async moveToCart(userId, productId, quantity = 1) {
    const { default: cartService } = await import('../cart/cart.service.js');

    // Add to cart
    const cartItem = await cartService.addItem(userId, productId, quantity);

    // Remove from wishlist
    await this.removeItem(userId, productId);

    return cartItem;
  }

  // Clear entire wishlist
  async clearWishlist(userId) {
    await prisma.wishlist.deleteMany({
      where: { userId },
    });

    return true;
  }
}

export default new WishlistService();
