import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import reviewService from './review.service.js';
import { body } from 'express-validator';

const router = Router();

// Validation
const createValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('content')
    .optional()
    .trim()
    .isLength({ max: 2000 }),
];

// Public routes
router.get('/product/:productId', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    const result = await reviewService.getProductReviews(req.params.productId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    
    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
      summary: result.summary,
    });
  } catch (error) {
    next(error);
  }
});

// Auth routes
router.get('/my-reviews', authenticate, async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    const result = await reviewService.getUserReviews(req.user.userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });
    
    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, createValidation, async (req, res, next) => {
  try {
    const { productId, rating, content } = req.body;
    
    const review = await reviewService.create(req.user.userId, productId, { rating, content });
    
    res.status(201).json({
      success: true,
      message: 'Review submitted',
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { rating, content } = req.body;
    
    const review = await reviewService.update(req.params.id, req.user.userId, { rating, content });
    
    res.json({
      success: true,
      message: 'Review updated',
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await reviewService.delete(req.params.id, req.user.userId);
    
    res.json({
      success: true,
      message: 'Review deleted',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/report', authenticate, async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    await reviewService.reportReview(req.params.id, req.user.userId, reason);
    
    res.json({
      success: true,
      message: 'Review reported',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
