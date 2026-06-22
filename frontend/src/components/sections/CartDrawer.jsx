/**
 * Cart Drawer Component
 * Slides from right, shows cart items, totals, checkout button
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store';
import { Button, Skeleton } from '../common';

export const CartDrawer = ({ isOpen, onClose, onCheckout }) => {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const subtotal = useCartStore((state) => state.subtotal);
  const total = useCartStore((state) => state.total);

  const tax = Math.round(subtotal * 0.1); // 10% tax
  const finalTotal = subtotal + tax;

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 z-50 glass rounded-l-2xl border-l border-white/15 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">
                  Giỏ hàng
                </h2>
                <p className="text-sm text-text-tertiary">
                  {items.length} sản phẩm
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-glass-light rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <svg
                    className="w-16 h-16 text-text-tertiary mb-3 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <p className="text-text-secondary font-medium">
                    Giỏ hàng trống
                  </p>
                  <p className="text-sm text-text-tertiary mt-1">
                    Thêm sản phẩm để bắt đầu
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onRemove={() => removeItem(item.id)}
                    onUpdateQuantity={(qty) =>
                      updateQuantity(item.id, qty)
                    }
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-white/10 p-6 space-y-3">
                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal</span>
                    <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Tax (10%)</span>
                    <span className="text-neon-yellow">{tax.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 font-bold text-text-primary">
                    <span>Total</span>
                    <span className="text-lg text-neon-cyan">
                      {finalTotal.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={onClose}
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      onCheckout?.();
                      onClose();
                    }}
                  >
                    Checkout
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Cart Item Component
 */
const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  const [isRemoving, setIsRemoving] = React.useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove();
      setIsRemoving(false);
    }, 300);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`
        bg-dark-secondary border border-white/10 rounded-lg p-3 flex gap-3
        ${isRemoving ? 'opacity-50' : ''}
      `}
    >
      {/* Image */}
      <img
        src={item.image || 'https://via.placeholder.com/80'}
        alt={item.name}
        className="w-20 h-20 rounded-lg object-cover bg-dark-tertiary"
      />

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-semibold text-text-primary line-clamp-1">
            {item.name}
          </h4>
          <p className="text-sm text-neon-cyan font-bold">
            {item.price.toLocaleString('vi-VN')} ₫
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onUpdateQuantity(Math.max(1, item.quantity - 1))
            }
            className="p-1 hover:bg-dark-hover rounded transition-colors"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-semibold">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            className="p-1 hover:bg-dark-hover rounded transition-colors"
          >
            +
          </button>
          <button
            onClick={handleRemove}
            className="ml-auto p-1 text-neon-red hover:bg-neon-red/10 rounded transition-colors"
            title="Remove"
          >
            ✕
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CartDrawer;
