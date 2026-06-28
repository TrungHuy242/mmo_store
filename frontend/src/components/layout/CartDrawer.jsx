import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../store';
import { Button } from '../ui';

export default function CartDrawer({ isOpen, onClose }) {
  const { t } = useTranslation();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  // Track stock validation
  const [stockErrors, setStockErrors] = useState({});

  // Validate stock when items change
  useEffect(() => {
    const errors = {};
    items.forEach(item => {
      const stock = item.stock ?? Infinity; // If no stock info, assume unlimited
      if (item.quantity > stock) {
        errors[item.id] = {
          available: stock,
          requested: item.quantity,
        };
      }
    });
    setStockErrors(errors);
  }, [items]);

  // Check if cart has any stock issues
  const hasStockIssues = useMemo(() => {
    return items.some(item => {
      const stock = item.stock ?? Infinity;
      return stock < 1 || item.quantity > stock;
    });
  }, [items]);

  // Check if can checkout
  const canCheckout = items.length > 0 && !hasStockIssues;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full sm:w-96 bg-bg-secondary border-l border-border z-50 flex flex-col shadow-soft-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">{t('common.shopping_cart')}</h2>
                <p className="text-sm text-text-secondary">{items.length} {t('common.items')}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <svg className="w-16 h-16 text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-text-primary mb-2">{t('common.cart_empty_title')}</h3>
                  <p className="text-sm text-text-secondary mb-6">{t('common.cart_empty_desc')}</p>
                  <Button variant="secondary" onClick={onClose}>{t('common.browse_products_btn')}</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const stock = item.stock ?? Infinity;
                    const stockError = stockErrors[item.id];
                    const isOutOfStock = stock < 1;
                    const exceedsStock = item.quantity > stock;
                    const canIncrease = !isOutOfStock && item.quantity < stock;

                    return (
                    <motion.div
                      key={item.id}
                      layout
                      className={`flex gap-4 p-3 bg-bg-tertiary rounded-lg ${isOutOfStock ? 'opacity-60' : ''}`}
                    >
                      <img
                        src={item.image || `https://picsum.photos/80?random=${item.id}`}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover bg-bg-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-text-primary line-clamp-2 mb-1">
                          {item.name}
                        </h4>
                        <p className="text-sm text-text-secondary">
                          ${(item.price || 0).toLocaleString()}
                        </p>

                        {/* Stock Warning */}
                        {stockError && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {isOutOfStock
                              ? 'Hết hàng trong kho'
                              : `Chỉ còn ${stock} sản phẩm trong kho`
                            }
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="w-7 h-7 rounded-lg bg-bg-primary flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                            >
                              -
                            </button>
                            <span className={`text-sm font-medium w-6 text-center ${exceedsStock ? 'text-danger' : ''}`}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={!canIncrease}
                              className={`w-7 h-7 rounded-lg bg-bg-primary flex items-center justify-center transition-colors ${
                                canIncrease
                                  ? 'text-text-secondary hover:text-text-primary'
                                  : 'text-text-tertiary cursor-not-allowed'
                              }`}
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">{t('common.subtotal')}</span>
                  <span className="text-xl font-bold text-text-primary">
                    ${subtotal.toLocaleString()}
                  </span>
                </div>

                {/* Stock Warning Banner */}
                {hasStockIssues && (
                  <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-danger">Vui lòng điều chỉnh lại số lượng giỏ hàng</p>
                        <p className="text-xs text-danger/70 mt-1">
                          Một số sản phẩm vượt quá số lượng trong kho
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  fullWidth
                  size="lg"
                  disabled={!canCheckout}
                  onClick={() => {
                    if (canCheckout) {
                      // Navigate to checkout
                    }
                  }}
                >
                  {!canCheckout ? 'Không thể thanh toán' : 'Tiến hành thanh toán'}
                </Button>
                <button
                  onClick={onClose}
                  className="w-full text-center text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
