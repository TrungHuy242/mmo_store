import { body, query, param } from 'express-validator';

export const createProductValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be 3-200 characters'),
  body('categoryId')
    .isUUID()
    .withMessage('Valid category ID required'),
  body('price')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Valid price required'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a positive number'),
  body('description')
    .optional(),
  body('images')
    .optional()
    .isArray(),
  body('productType')
    .optional()
    .isIn(['digital', 'physical', 'license', 'account']),
];

export const updateProductValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid product ID required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }),
  body('price')
    .optional()
    .isDecimal({ decimal_digits: '0,2' }),
  body('stock')
    .optional()
    .isInt({ min: 0 }),
];

export const productQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }),
  query('category')
    .optional()
    .isUUID(),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }),
  query('minPrice')
    .optional()
    .isDecimal(),
  query('maxPrice')
    .optional()
    .isDecimal(),
  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'createdAt', 'salesCount', 'viewCount']),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']),
];

export const bulkUpdateValidation = [
  body('productIds')
    .isArray({ min: 1 })
    .withMessage('At least one product ID required'),
  body('action')
    .isIn(['activate', 'deactivate', 'archive', 'delete'])
    .withMessage('Valid action required'),
];
