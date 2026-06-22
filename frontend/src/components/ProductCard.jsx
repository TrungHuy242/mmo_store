import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer.jsx';

export default function ProductCard({ product, onBuy }) {
  const onSale = product.flashSale?.enabled && new Date(product.flashSale.endsAt) > new Date();
  const outOfStock = product.stock < 1;
  
  const originalPrice = product.effectivePrice ?? product.price;
  const salePrice = product.flashSale?.salePrice ?? originalPrice;
  const discount = onSale ? Math.round((1 - salePrice / originalPrice) * 100) : 0;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="glass overflow-hidden flex flex-col group"
    >
      {/* Image - Clickable to ProductDetail */}
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden">
        <img 
          src={product.image || 'https://picsum.photos/400/300'} 
          alt={product.name} 
          className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {onSale && (
            <span className="badge badge-magenta animate-pulse-glow">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              FLASH SALE
            </span>
          )}
          {outOfStock && (
            <span className="badge badge-danger">Hết hàng</span>
          )}
        </div>
        
        {/* Stock badge */}
        <div className="absolute top-3 right-3">
          <span className={`badge ${outOfStock ? 'badge-danger' : 'bg-black/60 text-white'}`}>
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Kho: {product.stock}
          </span>
        </div>
        
        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg -rotate-3">
              -{discount}%
            </span>
          </div>
        )}
      </Link>
      
      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category */}
        {product.category && (
          <span className="text-xs text-neon-cyan/70 mb-1">{product.category.name}</span>
        )}
        
        {/* Name */}
        <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-neon-cyan transition-colors">
          {product.name}
        </h3>
        
        {/* Description */}
        <p className="text-gray-400 text-xs mb-3 line-clamp-2 flex-1">
          {product.description || 'Mô tả sản phẩm'}
        </p>
        
        {/* Countdown */}
        {onSale && (
          <div className="mb-3">
            <CountdownTimer endsAt={product.flashSale.endsAt} />
          </div>
        )}
        
        {/* Price & Buy */}
        <div className="flex items-end justify-between mt-auto pt-3 border-t border-white/5">
          <div className="flex flex-col">
            {onSale ? (
              <>
                <span className="text-neon-gold font-bold text-lg">
                  {salePrice.toLocaleString('vi-VN')} đ
                </span>
                <span className="text-gray-500 line-through text-xs">
                  {originalPrice.toLocaleString('vi-VN')} đ
                </span>
              </>
            ) : (
              <span className="text-neon-cyan font-bold text-lg">
                {originalPrice.toLocaleString('vi-VN')} đ
              </span>
            )}
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={outOfStock}
            onClick={() => onBuy(product)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              outOfStock
                ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                : 'btn-neon'
            }`}
          >
            {outOfStock ? (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Hết hàng
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Mua ngay
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
