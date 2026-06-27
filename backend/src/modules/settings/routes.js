import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../../middlewares/auth.middleware.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/settings/status
 * Get public system settings (maintenance mode, etc.)
 * This endpoint is NOT blocked by maintenance mode
 */
router.get('/status', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['maintenanceMode', 'maintenanceMessage', 'maintenanceEndTime']
        }
      }
    });

    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    return res.json({
      success: true,
      data: {
        maintenanceMode: settingsMap.maintenanceMode ?? false,
        maintenanceMessage: settingsMap.maintenanceMessage ?? 'Hệ thống đang được bảo trì. Vui lòng quay lại sau.',
        maintenanceEndTime: settingsMap.maintenanceEndTime ?? null
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch settings' 
    });
  }
});

/**
 * GET /api/settings/announcement
 * Get public announcement settings for the marquee banner
 * This endpoint is public (no auth required)
 */
router.get('/announcement', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['announcementEnabled', 'announcementContent']
        }
      }
    });

    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    const enabled = settingsMap.announcementEnabled === true || settingsMap.announcementEnabled === 'true';
    const content = settingsMap.announcementContent || '';

    return res.json({
      success: true,
      data: {
        enabled,
        content
      }
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch announcement' 
    });
  }
});

/**
 * PUT /api/settings/announcement
 * Update announcement settings (admin only)
 */
router.put('/announcement', requireAdmin, async (req, res) => {
  try {
    const { enabled, content } = req.body;

    // Update enabled setting
    await prisma.setting.upsert({
      where: { key: 'announcementEnabled' },
      update: { value: enabled === true },
      create: {
        key: 'announcementEnabled',
        value: enabled === true,
        type: 'boolean',
        group: 'announcement'
      }
    });

    // Update content setting
    await prisma.setting.upsert({
      where: { key: 'announcementContent' },
      update: { value: content || '' },
      create: {
        key: 'announcementContent',
        value: content || '',
        type: 'string',
        group: 'announcement'
      }
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'UPDATE',
        resource: 'Announcement',
        changes: { enabled, content }
      }
    });

    return res.json({
      success: true,
      data: {
        enabled: enabled === true,
        content: content || ''
      }
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update announcement' 
    });
  }
});

/**
 * GET /api/settings
 * Get all settings (admin only)
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { group: 'asc' }
    });

    return res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch settings' 
    });
  }
});

/**
 * GET /api/settings/:key
 * Get setting by key (admin only)
 */
router.get('/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await prisma.setting.findUnique({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found'
      });
    }

    return res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch setting' 
    });
  }
});

/**
 * PUT /api/settings/:key
 * Update setting by key (admin only)
 */
router.put('/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type, group } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Value is required'
      });
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { 
        value,
        ...(type && { type }),
        ...(group && { group })
      },
      create: {
        key,
        value,
        type: type || 'string',
        group: group || 'general'
      }
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'UPDATE',
        resource: 'Setting',
        resourceId: setting.id,
        changes: { key, oldValue: null, newValue: value }
      }
    });

    return res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update setting' 
    });
  }
});

/**
 * POST /api/settings/toggle-maintenance
 * Toggle maintenance mode (admin only)
 */
router.post('/toggle-maintenance', requireAdmin, async (req, res) => {
  try {
    const { enabled, message, endTime } = req.body;

    // Get current maintenance mode
    const currentSetting = await prisma.setting.findUnique({
      where: { key: 'maintenanceMode' }
    });

    const currentMode = currentSetting ? currentSetting.value : false;
    const newMode = enabled !== undefined ? enabled : !currentMode;

    // Update maintenance mode
    await prisma.setting.upsert({
      where: { key: 'maintenanceMode' },
      update: { value: newMode },
      create: {
        key: 'maintenanceMode',
        value: newMode,
        type: 'boolean',
        group: 'system'
      }
    });

    // Update maintenance message if provided
    if (message !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'maintenanceMessage' },
        update: { value: message },
        create: {
          key: 'maintenanceMessage',
          value: message,
          type: 'string',
          group: 'system'
        }
      });
    }

    // Update maintenance end time if provided
    if (endTime !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'maintenanceEndTime' },
        update: { value: endTime },
        create: {
          key: 'maintenanceEndTime',
          value: endTime,
          type: 'datetime',
          group: 'system'
        }
      });
    }

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userEmail: req.user.email,
        action: newMode ? 'ACTIVATE' : 'DEACTIVATE',
        resource: 'MaintenanceMode',
        changes: { enabled: newMode, message, endTime }
      }
    });

    return res.json({
      success: true,
      data: {
        maintenanceMode: newMode,
        maintenanceMessage: message,
        maintenanceEndTime: endTime
      }
    });
  } catch (error) {
    console.error('Error toggling maintenance mode:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to toggle maintenance mode' 
    });
  }
});

export default router;
