import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Card({
  children,
  className = '',
  hover = false,
  padding = true,
  ...props
}) {
  const Component = hover ? motion.div : 'div';
  const motionProps = hover ? {
    whileHover: { y: -2 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      className={`
        bg-bg-secondary border border-border rounded-lg
        ${padding ? 'p-4 sm:p-6' : ''}
        ${hover ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-text-primary ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`border-t border-border mt-4 pt-4 ${className}`}>
      {children}
    </div>
  );
}

// Product Card
export function ProductCard({ product, onClick }) {
  const { t } = useTranslation();
  const {
    name,
    price,
    image,
    category,
    rating = 4.5,
    reviewCount = 0,
    salesCount = 0,
    stock = 10,
    type = 'instant',
  } = product;

  return (
    <div
      onClick={onClick}
      className="card-interactive group overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-product overflow-hidden bg-bg-tertiary">
        <img
          src={image || `https://picsum.photos/400/300?random=${product.id}`}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {stock <= 0 && (
            <span className="badge badge-danger">{t('common.stock_out')}</span>
          )}
          {type === 'instant' && (
            <span className="badge badge-success">{t('common.instant_badge')}</span>
          )}
        </div>
        
        {/* Sales count */}
        {salesCount > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="badge badge-neutral">
              {salesCount} sold
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {category && (
          <p className="text-xs text-primary mb-1">{category}</p>
        )}
        <h3 className="font-medium text-text-primary line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-warning' : 'text-text-tertiary'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-text-tertiary">({reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-text-primary">
            ${price?.toLocaleString()}
          </span>
          <span className="text-xs text-text-tertiary">
            {stock > 0 ? `${stock} left` : 'Sold out'}
          </span>
        </div>
      </div>
    </div>
  );
}
