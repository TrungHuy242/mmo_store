import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import wishlistService from './wishlist.service.js';

const router = Router();

// Get wishlist
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    const result = await wishlistService.getWishlist(req.user.userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
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

// Get wishlist count
router.get('/count', authenticate, async (req, res, next) => {
  try {
    const count = await wishlistService.getWishlistCount(req.user.userId);
    
    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
});

// Check if product is in wishlist
router.get('/check/:productId', authenticate, async (req, res, next) => {
  try {
    const isInWishlist = await wishlistService.isInWishlist(
      req.user.userId,
      req.params.productId
    );
    
    res.json({
      success: true,
      data: { isInWishlist },
    });
  } catch (error) {
    next(error);
  }
});

// Add to wishlist
router.post('/items', authenticate, async (req, res, next) => {
  try {
    const { productId } = req.body;
    
    const result = await wishlistService.addItem(req.user.userId, productId);
    
    res.status(result.alreadyExists ? 200 : 201).json({
      success: true,
      message: result.alreadyExists ? 'Already in wishlist' : 'Added to wishlist',
      data: result.item,
    });
  } catch (error) {
    next(error);
  }
});

// Remove from wishlist
router.delete('/items/:productId', authenticate, async (req, res, next) => {
  try {
    await wishlistService.removeItem(req.user.userId, req.params.productId);
    
    res.json({
      success: true,
      message: 'Removed from wishlist',
    });
  } catch (error) {
    next(error);
  }
});

// Move to cart
router.post('/items/:productId/move-to-cart', authenticate, async (req, res, next) => {
  try {
    const { quantity = 1 } = req.body;
    
    const cartItem = await wishlistService.moveToCart(
      req.user.userId,
      req.params.productId,
      quantity
    );
    
    res.json({
      success: true,
      message: 'Moved to cart',
      data: cartItem,
    });
  } catch (error) {
    next(error);
  }
});

// Clear wishlist
router.delete('/', authenticate, async (req, res, next) => {
  try {
    await wishlistService.clearWishlist(req.user.userId);
    
    res.json({
      success: true,
      message: 'Wishlist cleared',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
