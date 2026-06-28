import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useCartStore, useWishlistStore } from '../store';
import { useAuth } from '../context/AuthContext';
import { useCartDrawer } from '../context/CartContext';
import { wishlistApi } from '../api';
import soundFX from '../utils/soundFX';

const CountdownTimer = ({ endsAt }) => {
  const [timeLeft, setTimeLeft] = React.useState({ hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(endsAt);
      const diff = end - now;
      if (diff <= 0) { clearInterval(timer); return; }
      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  return (
    <div className="flex gap-1 text-xs font-semibold text-neon-gold mb-2 p-2 bg-neon-gold/10 rounded-lg">
      <span>⏱️ Còn:</span>
      <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
      <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
      <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
    </div>
  );
};

export default function ProductCard({ product, onBuy, onAddToCart }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
  const { openCartWithItem } = useCartDrawer();
  const [wishlistLoading, setWishlistLoading] = React.useState(false);
  const [quickBuyLoading, setQuickBuyLoading] = React.useState(false);
  
  const onSale = product.flashSale?.enabled && new Date(product.flashSale.endsAt) > new Date();
  const outOfStock = product.stock < 1;
  const originalPrice = product.effectivePrice ?? product.price;
  const salePrice = product.flashSale?.salePrice ?? originalPrice;
  const discount = onSale ? Math.round((1 - salePrice / originalPrice) * 100) : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!outOfStock) {
      soundFX.playClick(); // Play sci-fi click sound
      if (onAddToCart) {
        onAddToCart(product);
      } else {
        addItem(product, 1);
        toast.success('Đã thêm vào giỏ hàng');
      }
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error(t('toasts.login_required_wishlist'));
      return;
    }
    
    try {
      setWishlistLoading(true);
      if (isInWishlist) {
        await wishlistApi.removeItem(product.id);
        toggleWishlist(product.id);
        soundFX.playClick();
        toast.success('Đã xóa khỏi yêu thích');
      } else {
        await wishlistApi.addItem(product.id);
        toggleWishlist(product.id);
        soundFX.playClick();
        toast.success('Đã thêm vào yêu thích');
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      toast.error(t('toasts.wishlist_update_failed'));
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleQuickBuy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error(t('toasts.login_required_buy'));
      return;
    }
    
    if (outOfStock) {
      toast.error(t('toasts.product_out_of_stock'));
      return;
    }
    
    try {
      setQuickBuyLoading(true);
      
      // Add to cart
      const cartProduct = {
        id: product.id,
        name: product.name,
        price: Number(product.effectivePrice || product.price),
        image: product.thumbnail || product.image,
      };
      addItem(cartProduct, 1);
      
      // Open cart drawer with notification
      openCartWithItem(cartProduct);
      
      toast.success('Đã thêm vào giỏ hàng');
    } catch (error) {
      console.error('Quick buy error:', error);
      toast.error(t('toasts.add_cart_failed'));
    } finally {
      setQuickBuyLoading(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="glass overflow-hidden flex flex-col group"
    >
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden">
        <img 
          src={product.image || 'https://picsum.photos/400/300'} 
          alt={product.name} 
          className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {onSale && (
            <span className="bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/40 px-2 py-1 rounded-lg text-xs font-semibold animate-pulse">
              FLASH SALE
            </span>
          )}
          {outOfStock && (
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-1 rounded-lg text-xs font-semibold">Hết hàng</span>
          )}
        </div>
        
        <div className="absolute top-3 right-3 flex gap-2">
          <span className="bg-black/60 text-white/80 px-2 py-1 rounded-lg text-xs">
            Kho: {product.stock}
          </span>
        </div>
        
        {/* Wishlist Heart Button */}
        <button
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          className={`absolute top-3 left-3 p-2 rounded-full transition-all ${
            isInWishlist
              ? 'bg-neon-magenta text-white'
              : 'bg-black/50 text-white/70 hover:text-white hover:bg-black/70'
          }`}
          title={isInWishlist ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
        >
          {wishlistLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg 
              className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
        
        {discount > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg -rotate-3">-{discount}%</span>
          </div>
        )}
      </Link>
      
      <div className="p-4 flex flex-col flex-1">
        {product.category && (
          <span className="text-xs text-neon-cyan/70 mb-1">{product.category.name}</span>
        )}
        
        <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-neon-cyan transition-colors text-white">
          {product.name}
        </h3>
        
        <p className="text-gray-400 text-xs mb-3 line-clamp-2 flex-1">
          {product.description || 'Mô tả sản phẩm'}
        </p>
        
        {onSale && (
          <div className="mb-3">
            <CountdownTimer endsAt={product.flashSale.endsAt} />
          </div>
        )}
        
        <div className="flex items-end justify-between mt-auto pt-3 border-t border-white/5">
          <div className="flex flex-col">
            {onSale ? (
              <>
                <span className="text-neon-gold font-bold text-lg">{salePrice.toLocaleString('vi-VN')} đ</span>
                <span className="text-gray-500 line-through text-xs">{originalPrice.toLocaleString('vi-VN')} đ</span>
              </>
            ) : (
              <span className="text-neon-cyan font-bold text-lg">{originalPrice.toLocaleString('vi-VN')} đ</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                outOfStock
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
              }`}
            >
              +
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={outOfStock || quickBuyLoading}
              onClick={handleQuickBuy}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 ${
                outOfStock
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  : 'btn-neon'
              }`}
            >
              {quickBuyLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {outOfStock ? 'Hết hàng' : 'Mua ngay'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
