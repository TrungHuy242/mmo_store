import { body } from 'express-validator';

export const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item required'),
  body('items.*.productId')
    .isUUID()
    .withMessage('Valid product ID required'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 }),
  body('paymentMethod')
    .isIn(['BALANCE', 'USDT_TRC20', 'VIETQR', 'BANK_TRANSFER', 'CARD'])
    .withMessage('Valid payment method required'),
  body('couponCode')
    .optional()
    .trim(),
];

export const updateOrderStatusValidation = [
  body('status')
    .isIn(['PENDING', 'AWAITING_PAYMENT', 'PAID', 'PROCESSING', 'COMPLETED', 'REFUNDED', 'CANCELLED', 'FAILED'])
    .withMessage('Valid status required'),
  body('note')
    .optional()
    .trim(),
];

export const addOrderNoteValidation = [
  body('note')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note must be 1-1000 characters'),
  body('isInternal')
    .optional()
    .isBoolean(),
];
