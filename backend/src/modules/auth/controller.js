import service from './service.js';
import { validationResult } from 'express-validator';

class AuthController {
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await service.register(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      
      const result = await service.login(email, password, ip);
      
      // If 2FA is enabled, response will have requiresOtp flag
      res.json({
        success: true,
        message: result.requiresOtp ? 'Mã xác thực đã được gửi qua Telegram' : 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyLoginOtp(req, res, next) {
    try {
      const { userId, code } = req.body;
      
      if (!userId || !code) {
        return res.status(400).json({ error: 'userId and code are required' });
      }

      const result = await service.verifyLoginOtp(userId, code);
      
      res.json({
        success: true,
        message: 'Xác thực thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async resendLoginOtp(req, res, next) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const result = await service.resendLoginOtp(userId);
      
      res.json({
        success: true,
        message: result.message,
        data: { expiresIn: result.expiresIn },
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleTwoFactor(req, res, next) {
    try {
      const { enabled } = req.body;
      const userId = req.user.userId;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'enabled must be a boolean' });
      }

      const result = await service.toggleTwoFactor(userId, enabled);
      
      res.json({
        success: true,
        message: enabled ? 'Đã bật xác thực 2 lớp' : 'Đã tắt xác thực 2 lớp',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async adminLogin(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      
      const result = await service.adminLogin(email, password, ip);
      
      res.json({
        success: true,
        message: 'Admin login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }
      
      const result = await service.refreshToken(refreshToken);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await service.logout(refreshToken);
      }
      
      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      
      await service.forgotPassword(email);
      
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;
      
      await service.resetPassword(token, password);
      
      res.json({
        success: true,
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;
      
      await service.changePassword(userId, currentPassword, newPassword);
      
      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const user = await service.getProfile(userId);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.userId;
      const user = await service.updateProfile(userId, req.body);
      
      res.json({
        success: true,
        message: 'Profile updated',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { userId, token } = req.params;
      
      await service.verifyEmail(userId, token);
      
      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
