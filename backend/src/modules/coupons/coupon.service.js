import prisma from '../../database/prisma.js';

class CouponService {
  async validateCoupon(code, userId, orderTotal) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    if (coupon.status !== 'ACTIVE') {
      throw new Error('Coupon is no longer active');
    }

    if (new Date() < coupon.startsAt) {
      throw new Error('Coupon is not yet active');
    }

    if (new Date() > coupon.expiresAt) {
      throw new Error('Coupon has expired');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new Error('Coupon usage limit reached');
    }

    if (coupon.minOrderAmount && orderTotal < Number(coupon.minOrderAmount)) {
      throw new Error(`Minimum order amount is ${coupon.minOrderAmount}`);
    }

    // Check user limit
    if (coupon.userLimit) {
      const userUsageCount = await prisma.order.count({
        where: { userId, couponId: coupon.id },
      });

      if (userUsageCount >= coupon.userLimit) {
        throw new Error('You have already used this coupon');
      }
    }

    return coupon;
  }

  async applyCoupon(code, userId, orderTotal) {
    const coupon = await this.validateCoupon(code, userId, orderTotal);

    let discount = 0;

    if (coupon.type === 'PERCENTAGE') {
      discount = (orderTotal * Number(coupon.value)) / 100;
    } else {
      discount = Number(coupon.value);
    }

    // Apply max discount cap
    if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
      discount = Number(coupon.maxDiscount);
    }

    return { coupon, discount };
  }

  async incrementUsage(couponId) {
    return prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  }

  async getCouponByCode(code) {
    return prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
  }
}

export default new CouponService();
