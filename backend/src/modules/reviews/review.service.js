import prisma from '../../database/prisma.js';

class ReviewService {
  // Create review
  async create(userId, productId, data) {
    // Check if user purchased the product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'COMPLETED',
        },
      },
    });

    // Check if already reviewed
    const existing = await prisma.review.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      throw new Error('You have already reviewed this product');
    }

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: data.rating,
        content: data.content,
        isVerifiedPurchase: !!hasPurchased,
      },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
      },
    });

    // Update product rating
    await this.updateProductRating(productId);

    return review;
  }

  // Update review
  async update(id, userId, data) {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('You can only update your own reviews');
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        rating: data.rating,
        content: data.content,
      },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
      },
    });

    await this.updateProductRating(review.productId);

    return updated;
  }

  // Delete review
  async delete(id, userId, isAdmin = false) {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new Error('Review not found');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new Error('You can only delete your own reviews');
    }

    await prisma.review.delete({ where: { id } });

    await this.updateProductRating(review.productId);

    return true;
  }

  // Get reviews for product
  async getProductReviews(productId, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;

    const [reviews, total, verifiedReviews] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, fullName: true } },
        },
      }),
      prisma.review.count({ where: { productId } }),
      prisma.review.count({
        where: { productId, isVerifiedPurchase: true },
      }),
    ]);

    // Calculate rating distribution
    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: true,
    });

    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    };
    distribution.forEach(d => {
      ratingDistribution[d.rating] = d._count;
    });

    return {
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        totalReviews: total,
        verifiedReviews,
        averageRating: 0,
        distribution: ratingDistribution,
      },
    };
  }

  // Get user's reviews
  async getUserReviews(userId, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, thumbnail: true } },
        },
      }),
      prisma.review.count({ where: { userId } }),
    ]);

    return {
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Update product rating
  async updateProductRating(productId) {
    const stats = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count,
      },
    });
  }

  // Get review by ID
  async getById(id) {
    return prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
        product: { select: { id: true, name: true, thumbnail: true } },
      },
    });
  }

  // Report review
  async reportReview(id, userId, reason) {
    const review = await prisma.review.findUnique({ where: { id } });
    
    if (!review) {
      throw new Error('Review not found');
    }

    // Create audit log or notification
    // For now, just log it
    console.log(`Review ${id} reported by user ${userId}: ${reason}`);

    return { success: true };
  }
}

export default new ReviewService();
