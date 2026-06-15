import { motion } from 'framer-motion';
import CountdownTimer from './CountdownTimer.jsx';

export default function ProductCard({ product, onBuy }) {
  const onSale = product.flashSale?.enabled && new Date(product.flashSale.endsAt) > new Date();
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="glass overflow-hidden flex flex-col"
    >
      <div className="relative">
        <img src={product.image || 'https://picsum.photos/400/300'} alt={product.name} className="w-full h-40 object-cover" />
        {onSale && (
          <span className="absolute top-2 left-2 bg-neon-magenta/90 text-white text-xs px-2 py-1 rounded-lg">FLASH SALE</span>
        )}
        <span className="absolute top-2 right-2 bg-black/60 text-xs px-2 py-1 rounded-lg">
          Con: {product.stock}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-base mb-1">{product.name}</h3>
        <p className="text-gray-400 text-xs mb-3 line-clamp-2 flex-1">{product.description}</p>
        {onSale && <CountdownTimer endsAt={product.flashSale.endsAt} />}
        <div className="flex items-center justify-between mt-3">
          <div>
            {onSale ? (
              <div>
                <span className="text-neon-gold font-bold">{product.flashSale.salePrice.toLocaleString('vi-VN')} d</span>
                <span className="text-gray-500 line-through text-xs ml-2">{product.price.toLocaleString('vi-VN')}</span>
              </div>
            ) : (
              <span className="text-neon-cyan font-bold">{product.price.toLocaleString('vi-VN')} d</span>
            )}
          </div>
          <button
            disabled={product.stock < 1}
            onClick={() => onBuy(product)}
            className="btn-neon py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {product.stock < 1 ? 'Het hang' : 'Mua'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
