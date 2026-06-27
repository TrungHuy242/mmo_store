import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import assetService from './asset.service.js';
import upload from '../../utils/upload.js';

const router = Router();

// Get all assets (admin - for management panel)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, productId, type, search } = req.query;
    
    const where = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    const [assets, total] = await Promise.all([
      prisma.digitalAsset.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, price: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.digitalAsset.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: assets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get asset by ID (public - for display)
router.get('/:id', async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
});

// Get product assets
router.get('/product/:productId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    const result = await assetService.getProductAssets(req.params.productId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    
    res.json({
      success: true,
      data: result.assets,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// Upload asset (admin)
router.post('/upload', authenticate, requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }
    
    const asset = await assetService.uploadAsset(productId, req.file, req.user.userId);
    
    res.status(201).json({
      success: true,
      message: 'Asset uploaded successfully',
      data: asset,
    });
  } catch (error) {
    next(error);
  }
});

// Update asset (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, isActive } = req.body;
    
    const asset = await assetService.updateAsset(req.params.id, { name, isActive });
    
    res.json({
      success: true,
      message: 'Asset updated',
      data: asset,
    });
  } catch (error) {
    next(error);
  }
});

// Delete asset (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await assetService.deleteAsset(req.params.id);
    
    res.json({
      success: true,
      message: 'Asset deleted',
    });
  } catch (error) {
    next(error);
  }
});

// Get secure download URL (authenticated - must have purchased)
router.get('/:id/download-url', authenticate, async (req, res, next) => {
  try {
    const result = await assetService.getSecureDownloadUrl(
      req.params.id,
      req.user.userId
    );
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Download asset with token (SECURED - validates token from database)
router.get('/download/:id', async (req, res, next) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Download token required' });
    }
    
    // Validate token and get file info
    const result = await assetService.downloadAsset(req.params.id, token, null);
    
    // Send file
    res.download(result.filePath, result.filename);
  } catch (error) {
    // Return appropriate error status
    if (error.message === 'Invalid download token') {
      return res.status(401).json({ error: error.message });
    }
    if (error.message === 'Download token has expired' || error.message === 'Download token has already been used') {
      return res.status(410).json({ error: error.message });
    }
    if (error.message === 'Token does not match asset') {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
});

// Get download history (admin)
router.get('/:id/downloads', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    const result = await assetService.getDownloadHistory(req.params.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });
    
    res.json({
      success: true,
      data: result.downloads,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// Get asset statistics (admin)
router.get('/stats/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { productId } = req.query;
    
    const stats = await assetService.getAssetStatistics(productId);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Toggle asset status (admin)
router.patch('/:id/toggle', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const asset = await assetService.toggleAssetStatus(req.params.id);
    
    res.json({
      success: true,
      message: `Asset ${asset.isActive ? 'activated' : 'deactivated'}`,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
});

// Get asset versions (admin)
router.get('/:id/versions', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    const versions = await assetService.getAssetVersions(
      asset.productId,
      asset.originalName
    );
    
    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    next(error);
  }
});

// Cleanup expired tokens (admin)
router.post('/cleanup', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const count = await assetService.cleanupExpiredTokens();
    
    res.json({
      success: true,
      message: `Cleaned up ${count} expired tokens`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
