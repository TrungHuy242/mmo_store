import prisma from '../../database/prisma.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

class AuthRepository {
  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        balance: true,
        totalSpent: true,
        telegramId: true,
        lastLogin: true,
        createdAt: true,
      },
    });
  }

  async findUserByUsername(username) {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async createUser(data) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const emailToken = crypto.randomBytes(32).toString('hex');
    
    return prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        username: data.username,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role || 'CUSTOMER',
        emailToken,
        emailTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  async updateUser(id, data) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    return prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }

  async setResetToken(email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });
    
    return token;
  }

  async findUserByResetToken(token) {
    return prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });
  }

  async verifyEmail(userId, token) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        emailToken: token,
        emailTokenExpiry: {
          gt: new Date(),
        },
      },
    });
    
    if (!user) return null;
    
    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailToken: null,
        emailTokenExpiry: null,
      },
    });
  }

  async addToBlacklist(token, expiresAt) {
    return prisma.blacklistToken.create({
      data: {
        token,
        expiresAt,
      },
    });
  }

  async isTokenBlacklisted(token) {
    const blacklisted = await prisma.blacklistToken.findUnique({
      where: { token },
    });
    
    if (!blacklisted) return false;
    
    // Clean up expired tokens
    if (new Date() > blacklisted.expiresAt) {
      await prisma.blacklistToken.delete({
        where: { id: blacklisted.id },
      });
      return false;
    }
    
    return true;
  }

  async updateLastLogin(userId, ip) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: new Date(),
        loginIp: ip,
      },
    });
  }

  async findAffiliateCode(code) {
    return prisma.affiliateCode.findUnique({
      where: { code },
      include: { user: true },
    });
  }

  async createAffiliateUse(affiliateCodeId, newUserId) {
    return prisma.affiliateUse.create({
      data: {
        affiliateCodeId,
        newUserId,
      },
    });
  }

  async incrementAffiliateReferrals(affiliateCodeId) {
    return prisma.affiliateCode.update({
      where: { id: affiliateCodeId },
      data: {
        totalReferrals: { increment: 1 },
      },
    });
  }

  async updateBalance(userId, amount) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: amount },
      },
    });
  }

  async updateTotalSpent(userId, amount) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        totalSpent: { increment: amount },
      },
    });
  }
}

export default new AuthRepository();
