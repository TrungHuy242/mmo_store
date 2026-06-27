import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import cartService from './cart.service.js';
import { body } from 'express-validator';

const router = Router();

// Validation
const quantityValidation = [
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
];

// Get cart
router.get('/', authenticate, async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.userId);
    
    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
});

// Add item to cart
router.post('/items', authenticate, async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    const item = await cartService.addItem(req.user.userId, productId, quantity);
    
    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

// Update cart item quantity
router.patch('/items/:productId', authenticate, quantityValidation, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    
    const item = await cartService.updateItem(req.user.userId, req.params.productId, quantity);
    
    res.json({
      success: true,
      message: 'Cart updated',
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

// Remove item from cart
router.delete('/items/:productId', authenticate, async (req, res, next) => {
  try {
    await cartService.removeItem(req.user.userId, req.params.productId);
    
    res.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    next(error);
  }
});

// Clear cart
router.delete('/', authenticate, async (req, res, next) => {
  try {
    await cartService.clearCart(req.user.userId);
    
    res.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    next(error);
  }
});

// Apply coupon
router.post('/apply-coupon', authenticate, async (req, res, next) => {
  try {
    const { couponCode } = req.body;
    
    const result = await cartService.applyCoupon(req.user.userId, couponCode);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Sync cart (remove unavailable items)
router.post('/sync', authenticate, async (req, res, next) => {
  try {
    const cart = await cartService.syncCart(req.user.userId);
    
    res.json({
      success: true,
      message: 'Cart synced',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
