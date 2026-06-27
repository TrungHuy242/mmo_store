import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Check if maintenance mode is enabled
 */
export async function isMaintenanceMode() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'maintenanceMode' }
    });
    return setting?.value === true;
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    return false;
  }
}

/**
 * Get maintenance settings
 */
export async function getMaintenanceSettings() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['maintenanceMode', 'maintenanceMessage', 'maintenanceEndTime']
        }
      }
    });

    const result = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });

    return {
      maintenanceMode: result.maintenanceMode ?? false,
      maintenanceMessage: result.maintenanceMessage ?? 'Hệ thống đang được bảo trì. Vui lòng quay lại sau.',
      maintenanceEndTime: result.maintenanceEndTime ?? null
    };
  } catch (error) {
    console.error('Error fetching maintenance settings:', error);
    return {
      maintenanceMode: false,
      maintenanceMessage: 'Hệ thống đang được bảo trì. Vui lòng quay lại sau.',
      maintenanceEndTime: null
    };
  }
}

/**
 * Maintenance mode middleware
 * Blocks non-admin users from protected routes during maintenance
 */
export function maintenanceMiddleware(req, res, next) {
  // Skip if already checked (e.g., in same request)
  if (req.skipMaintenanceCheck) {
    return next();
  }

  // Admin routes are always allowed
  if (req.path.startsWith('/api/admin') || 
      req.path.startsWith('/api/auth/admin') ||
      req.path.startsWith('/api/settings/status')) {
    return next();
  }

  // Auth routes (login/register) are always allowed
  if (req.path.startsWith('/api/auth/login') ||
      req.path.startsWith('/api/auth/register') ||
      req.path.startsWith('/api/auth/forgot-password') ||
      req.path.startsWith('/api/auth/reset-password')) {
    return next();
  }

  // Health check and webhooks are always allowed
  if (req.path === '/health' || 
      req.path.startsWith('/webhooks') ||
      req.path.startsWith('/api/payment')) {
    return next();
  }

  // Check maintenance mode asynchronously
  getMaintenanceSettings().then(settings => {
    if (settings.maintenanceMode) {
      // Check if end time has passed
      if (settings.maintenanceEndTime && new Date(settings.maintenanceEndTime) < new Date()) {
        // Maintenance period ended, continue
        return next();
      }

      // Check if user is admin
      if (req.user && ['SUPER_ADMIN', 'MANAGER', 'SUPPORT', 'FINANCE', 'INVENTORY_STAFF', 'MARKETING'].includes(req.user.role)) {
        // Admin users can still access
        return next();
      }

      return res.status(503).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: settings.maintenanceMessage,
        maintenanceMode: true,
        retryAfter: settings.maintenanceEndTime ? 
          Math.ceil((new Date(settings.maintenanceEndTime) - new Date()) / 1000) : 
          null
      });
    }
    next();
  }).catch(err => {
    console.error('Maintenance check error:', err);
    // On error, allow request to continue (fail open)
    next();
  });
}

export default router;
