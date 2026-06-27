import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import inventoryService from './inventory.service.js';

const router = Router();

// Get inventory for product
router.get('/product/:productId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    
    const result = await inventoryService.getInventoryItems(req.params.productId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      status,
    });
    
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// Get inventory statistics
router.get('/statistics', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { productId } = req.query;
    
    const stats = await inventoryService.getInventoryStatistics(productId);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Add inventory item
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const item = await inventoryService.addInventoryItem(req.body, req.user.userId);
    
    res.status(201).json({
      success: true,
      message: 'Inventory item added',
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

// Add bulk inventory items
router.post('/bulk', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { productId, items } = req.body;
    
    // Support both formats:
    // New format: { value, type } → map to { content, extraData }
    // Old format: { content, extraData, username, password } → pass through
    const normalizedItems = (items || []).map(item => {
      if (item.value !== undefined) {
        // New format from frontend BulkAdd modal
        const { value, type } = item;
        if (type === 'ACCOUNT') {
          // Try to parse email:pass format
          const colonIdx = value.indexOf(':');
          if (colonIdx > -1) {
            return {
              content: value,
              username: value.substring(0, colonIdx),
              password: value.substring(colonIdx + 1),
              extraData: { type },
            };
          }
        }
        return {
          content: value,
          extraData: { type: type || 'LICENSE_KEY' },
        };
      }
      // Old format - pass through as-is
      return item;
    });
    
    const result = await inventoryService.addBulkInventoryItems(productId, normalizedItems, req.user.userId);
    
    res.status(201).json({
      success: true,
      message: `${result.length} items added`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Update inventory item
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const item = await inventoryService.updateInventoryItem(req.params.id, req.body, req.user.userId);
    
    res.json({
      success: true,
      message: 'Item updated',
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

// Delete inventory item
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await inventoryService.deleteInventoryItem(req.params.id, req.user.userId);
    
    res.json({
      success: true,
      message: 'Item deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
