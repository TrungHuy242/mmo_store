import { useTranslation } from 'react-i18next';

const variants = {
  default: 'bg-bg-tertiary text-text-secondary',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-accent-cyan/10 text-accent-cyan',
  purple: 'bg-accent-purple/10 text-accent-purple',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${variants[variant] || variants.default}
        ${sizes[size] || sizes.md}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-success' :
          variant === 'danger' ? 'bg-danger' :
          variant === 'warning' ? 'bg-warning' :
          'bg-current'
        }`} />
      )}
      {children}
    </span>
  );
}

// Specialized badges
export function StatusBadge({ status }) {
  const config = {
    pending: { label: 'Pending', variant: 'warning' },
    processing: { label: 'Processing', variant: 'info' },
    completed: { label: 'Completed', variant: 'success' },
    delivered: { label: 'Delivered', variant: 'success' },
    paid: { label: 'Paid', variant: 'primary' },
    cancelled: { label: 'Cancelled', variant: 'danger' },
    failed: { label: 'Failed', variant: 'danger' },
    active: { label: 'Active', variant: 'success' },
    inactive: { label: 'Inactive', variant: 'default' },
    new: { label: 'New', variant: 'primary' },
    hot: { label: 'Hot', variant: 'danger' },
    sale: { label: 'Sale', variant: 'warning' },
  };

  const { label, variant } = config[status] || { label: status, variant: 'default' };

  return <Badge variant={variant} dot>{label}</Badge>;
}

export function StockBadge({ stock }) {
  const { t } = useTranslation();
  if (stock <= 0) {
    return <Badge variant="danger">{t('common.stock_out')}</Badge>;
  }
  if (stock <= 5) {
    return <Badge variant="warning" dot>{t('common.low_stock_badge', { count: stock })}</Badge>;
  }
  return <Badge variant="success" dot>{t('common.stock_in')}</Badge>;
}
