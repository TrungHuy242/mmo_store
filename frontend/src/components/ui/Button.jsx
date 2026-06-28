import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-600 active:bg-primary-700 shadow-primary/25 hover:shadow-primary/40',
  secondary: 'bg-bg-tertiary text-text-primary border border-border hover:bg-border hover:border-border-hover',
  ghost: 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
  danger: 'bg-danger text-white hover:bg-danger-dark active:bg-danger-dark shadow-danger/25 hover:shadow-danger/40',
  success: 'bg-success text-white hover:bg-success-dark active:bg-success-dark shadow-success/25 hover:shadow-success/40',
  warning: 'bg-warning text-white hover:bg-warning-dark active:bg-warning-dark shadow-warning/25 hover:shadow-warning/40',
  outline: 'bg-transparent border border-border text-text-primary hover:bg-bg-tertiary',
  'outline-primary': 'bg-transparent border border-primary text-primary hover:bg-primary hover:text-white shadow-primary/0 hover:shadow-primary/30',
};

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs gap-1',
  sm: 'px-3 py-2 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
  xl: 'px-8 py-4 text-lg gap-2.5',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  as,
  ...props
}, ref) => {
  const { t } = useTranslation();
  const Component = as || motion.button;

  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      disabled={isDisabled}
      whileTap={{ scale: isDisabled ? 1 : 0.95 }}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        active:shadow-lg
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size={size} />
          <span>{t('common.loading_dots')}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </Component>
  );
});

Button.displayName = 'Button';

function Spinner({ size = 'md' }) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  return (
    <svg
      className={`${sizeClasses[size]} animate-spin`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default Button;
