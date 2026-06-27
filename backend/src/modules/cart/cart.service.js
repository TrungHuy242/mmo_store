import prisma from '../../database/prisma.js';

class CartService {
  // Add item to cart
  async addItem(userId, productId, quantity = 1) {
    // Check product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive || product.isArchived) {
      throw new Error('Product is not available');
    }

    if (!product.unlimitedStock && product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    // Check if already in cart
    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      // Update quantity
      const newQuantity = existing.quantity + quantity;
      
      if (!product.unlimitedStock && newQuantity > product.stock) {
        throw new Error('Not enough stock available');
      }

      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              thumbnail: true,
              stock: true,
              unlimitedStock: true,
            },
          },
        },
      });
    }

    // Create new cart item
    return prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            thumbnail: true,
            stock: true,
            unlimitedStock: true,
          },
        },
      },
    });
  }

  // Update cart item quantity
  async updateItem(userId, productId, quantity) {
    const cartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (!cartItem) {
      throw new Error('Item not in cart');
    }

    if (quantity <= 0) {
      return this.removeItem(userId, productId);
    }

    // Check stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product.unlimitedStock && product.stock < quantity) {
      throw new Error('Not enough stock available');
    }

    return prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            thumbnail: true,
          },
        },
      },
    });
  }

  // Remove item from cart
  async removeItem(userId, productId) {
    const cartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (!cartItem) {
      throw new Error('Item not in cart');
    }

    await prisma.cartItem.delete({
      where: { id: cartItem.id },
    });

    return true;
  }

  // Get user's cart
  async getCart(userId) {
    const items = await prisma.cartItem.findMany({
      where: { userId },
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out unavailable products
    const validItems = items.filter(item => 
      item.product.isActive && 
      (item.product.unlimitedStock || item.product.stock >= item.quantity)
    );

    // Calculate totals
    const subtotal = validItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    return {
      items: validItems,
      itemCount: validItems.length,
      subtotal,
    };
  }

  // Clear cart
  async clearCart(userId) {
    await prisma.cartItem.deleteMany({
      where: { userId },
    });
    return true;
  }

  // Apply coupon to cart
  async applyCoupon(userId, couponCode) {
    const { default: couponService } = await import('../coupons/coupon.service.js');
    
    const cart = await this.getCart(userId);
    
    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    const result = await couponService.applyCoupon(couponCode, userId, cart.subtotal);
    
    return {
      coupon: result.coupon,
      discount: result.discount,
      total: cart.subtotal - result.discount,
    };
  }

  // Sync cart with stock (remove unavailable items)
  async syncCart(userId) {
    const cart = await this.getCart(userId);
    
    const unavailableItems = cart.items.filter(
      item => !item.product.isActive || 
             (!item.product.unlimitedStock && item.product.stock < item.quantity)
    );

    // Remove unavailable items
    for (const item of unavailableItems) {
      await prisma.cartItem.delete({
        where: { id: item.id },
      });
    }

    // Return updated cart
    return this.getCart(userId);
  }
}

export default new CartService();
