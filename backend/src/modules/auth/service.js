import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../../database/prisma.js';
import config from '../../config/index.js';
import repository from './repository.js';
import { UserRole, UserStatus, isAdminRole } from './constants.js';
import emailService from '../notifications/email.service.js';
import telegramService from '../notifications/telegram.service.js';
import { createError } from '../../middlewares/error.middleware.js';

class AuthService {
  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpires }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpires }
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token) {
    return jwt.verify(token, config.jwt.accessSecret);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, config.jwt.refreshSecret);
  }

  // ============ OTP 2FA METHODS ============
  
  generateOtp(userId, type = 'LOGIN_2FA') {
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes
    
    return prisma.otpCode.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
      },
    });
  }

  async sendLoginOtp(user) {
    if (!user.telegramId) {
      throw createError(400, 'Tài khoản chưa liên kết Telegram. Vui lòng liên kết Telegram trước.');
    }

    if (!telegramService.isEnabled()) {
      throw createError(503, 'Dịch vụ Telegram chưa được kích hoạt.');
    }

    // Generate and save OTP
    const otp = await this.generateOtp(user.id);

    // Send OTP via Telegram
    await telegramService.sendLoginOtp(user, otp.code);

    return {
      requiresOtp: true,
      message: 'Mã xác thực đã được gửi qua Telegram.',
      expiresIn: 180, // 3 minutes in seconds
    };
  }

  async verifyLoginOtp(userId, code) {
    // Find valid OTP
    const otp = await prisma.otpCode.findFirst({
      where: {
        userId,
        code,
        type: 'LOGIN_2FA',
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      // Check if there's a recent attempt with wrong code to count attempts
      const recentOtp = await prisma.otpCode.findFirst({
        where: {
          userId,
          type: 'LOGIN_2FA',
          used: false,
          expiresAt: { gt: new Date() },
        },
      });
      
      if (recentOtp) {
        // Increment attempts
        await prisma.otpCode.update({
          where: { id: recentOtp.id },
          data: { attempts: { increment: 1 } },
        });
        
        if (recentOtp.attempts >= 4) {
          throw createError(429, 'Quá nhiều lần thử. Vui lòng yêu cầu mã mới.');
        }

        throw createError(400, 'Mã xác thực không đúng.');
      }

      throw createError(400, 'Mã xác thực đã hết hạn hoặc không tồn tại.');
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true, usedAt: new Date() },
    });

    // Get user and generate tokens
    const user = await repository.findUserById(userId);
    if (!user) {
      throw createError(404, 'User not found');
    }

    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async resendLoginOtp(userId) {
    const user = await repository.findUserById(userId);
    if (!user) {
      throw createError(404, 'User not found');
    }

    // Invalidate any existing OTPs
    await prisma.otpCode.updateMany({
      where: {
        userId,
        type: 'LOGIN_2FA',
        used: false,
      },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    return this.sendLoginOtp(user);
  }

  async register(data) {
    // Check if user exists
    const existingUser = await repository.findUserByEmail(data.email);
    if (existingUser) {
      throw createError(409, 'Email already registered');
    }

    if (data.username) {
      const existingUsername = await repository.findUserByUsername(data.username);
      if (existingUsername) {
        throw createError(409, 'Username already taken');
      }
    }

    // Create user
    const user = await repository.createUser(data);

    // Handle referral
    if (data.referralCode) {
      const affiliate = await repository.findAffiliateCode(data.referralCode);
      if (affiliate && affiliate.isActive) {
        await repository.createAffiliateUse(affiliate.id, user.id);
        await repository.incrementAffiliateReferrals(affiliate.id);
        
        // Notify affiliate via Telegram
        if (telegramService.isEnabled()) {
          telegramService.sendNewAffiliateNotification(affiliate.user, user);
        }
      }
    }

    // Send verification email
    if (emailService.isEnabled()) {
      await emailService.sendVerificationEmail(user);
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(email, password, ip) {
    const user = await repository.findUserByEmail(email);
    
    if (!user) {
      throw createError(401, 'Invalid email or password');
    }

    if (!user.emailVerified && isAdminRole(user.role)) {
      throw createError(403, 'Please verify your email first');
    }

    if (user.status !== UserStatus.ACTIVE) {
      if (user.status === UserStatus.SUSPENDED) {
        throw createError(403, 'Account is suspended');
      }
      if (user.status === UserStatus.BANNED) {
        throw createError(403, 'Account is banned');
      }
      throw createError(403, 'Account is inactive');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw createError(401, 'Invalid email or password');
    }

    // Update last login
    await repository.updateLastLogin(user.id, ip);

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Send OTP instead of returning tokens
      return this.sendLoginOtp(user);
    }

    // Generate tokens directly (no 2FA)
    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken) {
    // Verify token
    const decoded = this.verifyRefreshToken(refreshToken);

    // Check if token is blacklisted
    const isBlacklisted = await repository.isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw createError(401, 'Token has been revoked');
    }

    // Get user
    const user = await repository.findUserById(decoded.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw createError(401, 'User not found or inactive');
    }

    // Blacklist old refresh token
    const decodedToken = jwt.decode(refreshToken);
    const expiresAt = new Date(decodedToken.exp * 1000);
    await repository.addToBlacklist(refreshToken, expiresAt);

    // Generate new tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async logout(refreshToken) {
    try {
      const decoded = jwt.decode(refreshToken);
      const expiresAt = new Date(decoded.exp * 1000);
      await repository.addToBlacklist(refreshToken, expiresAt);
      return true;
    } catch (error) {
      return false;
    }
  }

  async forgotPassword(email) {
    const user = await repository.findUserByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists
      return true;
    }

    const token = await repository.setResetToken(email);

    if (emailService.isEnabled()) {
      await emailService.sendPasswordResetEmail(user, token);
    }

    return true;
  }

  async resetPassword(token, newPassword) {
    const user = await repository.findUserByResetToken(token);
    
    if (!user) {
      throw createError(400, 'Invalid or expired reset token');
    }

    await repository.updatePassword(user.id, newPassword);

    // Invalidate all refresh tokens for this user
    // This is simplified - in production you'd track token families

    return true;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await repository.findUserById(userId);

    if (!user) {
      throw createError(404, 'User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw createError(401, 'Current password is incorrect');
    }

    await repository.updatePassword(userId, newPassword);

    return true;
  }

  async updateProfile(userId, data) {
    const updateData = {};

    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.username !== undefined) {
      const existing = await repository.findUserByUsername(data.username);
      if (existing && existing.id !== userId) {
        throw createError(409, 'Username already taken');
      }
      updateData.username = data.username;
    }
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return this.sanitizeUser(user);
  }

  async getProfile(userId) {
    const user = await repository.findUserById(userId);
    if (!user) {
      throw createError(404, 'User not found');
    }
    return user;
  }

  async verifyEmail(userId, token) {
    const user = await repository.verifyEmail(userId, token);
    if (!user) {
      throw createError(400, 'Invalid or expired verification token');
    }
    return true;
  }

  async adminLogin(email, password, ip) {
    const user = await repository.findUserByEmail(email);
    
    if (!user) {
      throw createError(401, 'Invalid credentials');
    }

    if (!isAdminRole(user.role)) {
      throw createError(403, 'Access denied. Admin account required.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw createError(403, 'Account is not active');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw createError(401, 'Invalid credentials');
    }

    await repository.updateLastLogin(user.id, ip);

    // Log audit
    await this.createAuditLog(user.id, 'LOGIN', 'user', user.id, null, ip);

    // Check if 2FA is enabled for admin
    if (user.twoFactorEnabled) {
      return this.sendLoginOtp(user);
    }

    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ============ 2FA MANAGEMENT ============
  
  async toggleTwoFactor(userId, enabled) {
    const user = await repository.findUserById(userId);
    if (!user) {
      throw createError(404, 'User not found');
    }

    if (enabled && !user.telegramId) {
      throw createError(400, 'Bạn cần liên kết Telegram trước khi bật xác thực 2 lớp.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: enabled },
    });

    // Send notification via Telegram if enabling
    if (enabled && user.telegramId && telegramService.isEnabled()) {
      await telegramService.sendMessage(
        `🔐 <b>2FA Enabled</b>\n\nXác thực 2 lớp đã được bật cho tài khoản của bạn.\nTừ giờ bạn cần xác thực qua mã OTP Telegram khi đăng nhập.`,
        user.telegramId
      );
    }

    return { twoFactorEnabled: enabled };
  }

  async createAuditLog(userId, action, resource, resourceId, changes, ip) {
    const user = userId ? await repository.findUserById(userId) : null;
    
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail: user?.email,
        action,
        resource,
        resourceId,
        changes,
        ipAddress: ip,
      },
    });
  }

  sanitizeUser(user) {
    const { password, emailToken, emailTokenExpiry, resetToken, resetTokenExpiry, ...sanitized } = user;
    return sanitized;
  }
}

export default new AuthService();
