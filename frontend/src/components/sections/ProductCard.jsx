/**
 * Premium ProductCard Component with Flash Sale, Countdown, Quick Add
 * Animated, responsive, accessibility-focused
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCartStore } from '../../store';
import { Button, Badge, Skeleton } from './index';

const ProductCard = ({ product, onQuickAdd, isLoading }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const onSale =
    product.flashSale?.enabled &&
    new Date(product.flashSale?.endsAt) > new Date();
  const effectivePrice = onSale ? product.flashSale?.salePrice : product.price;
  const discount = onSale
    ? Math.round(
        ((product.price - product.flashSale?.salePrice) / product.price) * 100
      )
    : 0;

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      addItem(product, 1);
      // Optional: Show toast notification
      setTimeout(() => setIsAdding(false), 500);
    } catch (err) {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl overflow-hidden flex flex-col h-full p-4 space-y-3">
        <Skeleton width="w-full" height="h-40" className="rounded-lg" />
        <Skeleton width="w-2/3" height="h-4" />
        <Skeleton width="w-full" height="h-3" />
        <Skeleton width="w-1/2" height="h-4" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -8 }}
      className="glass rounded-xl overflow-hidden flex flex-col h-full group"
    >
      {/* Image Container */}
      <div className="relative h-40 overflow-hidden bg-dark-secondary">
        <motion.img
          src={product.image || 'https://via.placeholder.com/400x300?text=Product'}
          alt={product.name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Flash Sale Badge */}
        {onSale && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-3 right-3"
          >
            <Badge variant="sale" size="sm" className="shadow-glow-magenta">
              -{discount}%
            </Badge>
          </motion.div>
        )}

        {/* Stock Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-secondary">
          <motion.div
            className="h-full bg-neon-green"
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min((product.stock / 100) * 100, 100)}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Quick Add Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Button
            variant="primary"
            size="md"
            onClick={handleAddToCart}
            isLoading={isAdding}
            disabled={product.stock < 1}
          >
            {product.stock < 1 ? 'Out of Stock' : 'Quick Add'}
          </Button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category Badge */}
        {product.category && (
          <Badge variant="default" size="sm" className="w-fit mb-2">
            {product.category}
          </Badge>
        )}

        {/* Product Name */}
        <h3 className="font-bold text-text-primary line-clamp-2 mb-2">
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-text-tertiary line-clamp-2 flex-1 mb-3">
            {product.description}
          </p>
        )}

        {/* Countdown (if on sale) */}
        {onSale && <CountdownTimer endsAt={product.flashSale?.endsAt} />}

        {/* Price Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-between">
            <div>
              {onSale ? (
                <>
                  <p className="text-xs text-text-tertiary line-through">
                    {product.price.toLocaleString('vi-VN')} ₫
                  </p>
                  <p className="text-lg font-bold text-neon-cyan">
                    {effectivePrice.toLocaleString('vi-VN')} ₫
                  </p>
                </>
              ) : (
                <p className="text-lg font-bold text-neon-cyan">
                  {product.price.toLocaleString('vi-VN')} ₫
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-text-tertiary">In Stock</p>
              <p className="text-sm font-semibold text-text-primary">
                {product.stock}
              </p>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            fullWidth
            variant={onSale ? 'glow' : 'primary'}
            size="sm"
            onClick={handleAddToCart}
            isLoading={isAdding}
            disabled={product.stock < 1}
          >
            {product.stock < 1 ? 'Hết hàng' : 'Thêm vào giỏ'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Countdown Timer Component
 */
const CountdownTimer = ({ endsAt }) => {
  const [timeLeft, setTimeLeft] = React.useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(endsAt);
      const diff = end - now;

      if (diff <= 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  return (
    <div className="flex gap-1 text-xs font-semibold text-neon-yellow mb-2 p-2 bg-neon-yellow/10 rounded-lg">
      <span>⏱️ Còn:</span>
      <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
      <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
      <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
    </div>
  );
};

/**
 * Product Grid with Pagination
 */
export const ProductGrid = ({ products, isLoading, onLoadMore }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array(8)
              .fill(0)
              .map((_, i) => <ProductCard key={i} isLoading />)
          : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {onLoadMore && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={onLoadMore}
            className="min-w-[200px]"
          >
            Load More Products
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
