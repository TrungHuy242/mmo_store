import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import licenseService from './license.service.js';

const router = Router();

// Get licenses for product
router.get('/product/:productId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    const result = await licenseService.getLicensesForProduct(req.params.productId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });
    
    res.json({
      success: true,
      data: result.keys,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// Get user licenses
router.get('/my-licenses', authenticate, async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    const result = await licenseService.getUserLicenses(req.user.userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    
    res.json({
      success: true,
      data: result.keys,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// Generate license keys
router.post('/generate', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { productId, count } = req.body;
    
    const keys = await licenseService.generateBulkKeys(productId, count, req.user.userId);
    
    res.status(201).json({
      success: true,
      message: `${keys.length} keys generated`,
      data: keys,
    });
  } catch (error) {
    next(error);
  }
});

// Activate license
router.post('/activate', authenticate, async (req, res, next) => {
  try {
    const { key, hwid } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    
    const result = await licenseService.activateLicense(key, req.user.userId, ip, hwid);
    
    res.json({
      success: true,
      message: 'License activated',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Deactivate license
router.post('/:id/deactivate', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const result = await licenseService.deactivateLicense(req.params.id, req.user.userId);
    
    res.json({
      success: true,
      message: 'License deactivated',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Blacklist license
router.post('/:id/blacklist', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const result = await licenseService.blacklistLicense(req.params.id, req.user.userId);
    
    res.json({
      success: true,
      message: 'License blacklisted',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Get license statistics
router.get('/statistics', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { productId } = req.query;
    
    const stats = await licenseService.getLicenseStatistics(productId);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
