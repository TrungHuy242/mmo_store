/**
 * Common UI Components - Button, Card, Input, Modal
 * Production-ready with accessibility, animations, variants
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Button Component with multiple variants and states
 */
export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-neon-cyan text-dark-bg hover:shadow-glow-cyan',
      ghost:
        'bg-transparent border border-white/15 text-text-primary hover:bg-glass-light',
      glow: 'bg-neon-magenta/10 border border-neon-magenta text-neon-magenta shadow-glow-magenta hover:shadow-lg',
      secondary:
        'bg-dark-secondary text-text-primary hover:bg-dark-tertiary border border-white/10',
      danger: 'bg-neon-red/10 text-neon-red hover:bg-neon-red/20',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        disabled={disabled || isLoading}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
          flex items-center justify-center gap-2
        `}
        {...props}
      >
        {isLoading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
        )}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

/**
 * Card Component with glass effect
 */
export const Card = React.forwardRef(
  (
    {
      children,
      variant = 'glass',
      hover = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const variants = {
      glass:
        'bg-glass-light backdrop-blur-xl border border-white/15 rounded-xl shadow-glass',
      elevated:
        'bg-dark-secondary border border-white/10 rounded-xl shadow-lg',
      outline:
        'bg-transparent border border-white/15 rounded-xl',
    };

    return (
      <div
        ref={ref}
        className={`
          ${variants[variant]}
          ${hover ? 'transition-all duration-200 hover:border-white/25 hover:shadow-lg' : ''}
          ${className}
          p-6
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

/**
 * Input Component with icon support
 */
export const Input = React.forwardRef(
  (
    {
      icon: Icon,
      error,
      disabled,
      className = '',
      label,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={`
              w-full px-4 py-2 rounded-lg
              bg-dark-secondary border border-white/15
              text-text-primary placeholder-text-tertiary
              focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              ${Icon ? 'pl-10' : ''}
              ${error ? 'border-neon-red focus:ring-neon-red' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-neon-red">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

/**
 * Modal Component with backdrop
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`${sizes[size]} w-full glass rounded-2xl shadow-2xl overflow-hidden`}
            >
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <h2 className="text-xl font-bold text-text-primary">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
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
              )}
              <div className="px-6 py-4">{children}</div>
              {footer && (
                <div className="flex gap-3 justify-end px-6 py-4 border-t border-white/10">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Badge Component
 */
export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variants = {
    default: 'bg-dark-secondary text-text-primary border border-white/15',
    success: 'bg-neon-green/10 text-neon-green border border-neon-green/30',
    error: 'bg-neon-red/10 text-neon-red border border-neon-red/30',
    warning: 'bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/30',
    info: 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30',
    sale: 'bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/50 shadow-glow-magenta',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-semibold rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

/**
 * Skeleton Loader
 */
export const Skeleton = ({ width = 'w-full', height = 'h-4', className = '' }) => {
  return (
    <div
      className={`
        ${width} ${height} ${className}
        bg-gradient-to-r from-dark-secondary via-dark-tertiary to-dark-secondary
        rounded-lg animate-shimmer
        bg-[length:1000px_100%]
      `}
    />
  );
};

/**
 * Spinner Component
 */
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, easing: 'linear' }}
      className={`
        ${sizes[size]}
        border-2 border-glass-light border-t-neon-cyan
        rounded-full
        ${className}
      `}
    />
  );
};

/**
 * Alert Component
 */
export const Alert = ({
  variant = 'info',
  title,
  message,
  onClose,
  closeable = true,
}) => {
  const variants = {
    success: {
      bg: 'bg-neon-green/10',
      border: 'border-neon-green/30',
      icon: '✓',
      color: 'text-neon-green',
    },
    error: {
      bg: 'bg-neon-red/10',
      border: 'border-neon-red/30',
      icon: '✕',
      color: 'text-neon-red',
    },
    warning: {
      bg: 'bg-neon-yellow/10',
      border: 'border-neon-yellow/30',
      icon: '!',
      color: 'text-neon-yellow',
    },
    info: {
      bg: 'bg-neon-blue/10',
      border: 'border-neon-blue/30',
      icon: 'ⓘ',
      color: 'text-neon-blue',
    },
  };

  const v = variants[variant];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`
          ${v.bg} ${v.border} ${v.color}
          border rounded-lg p-4 flex items-start gap-3
        `}
      >
        <span className="text-lg font-bold flex-shrink-0">{v.icon}</span>
        <div className="flex-1">
          {title && <h3 className="font-semibold">{title}</h3>}
          {message && <p className="text-sm opacity-90">{message}</p>}
        </div>
        {closeable && (
          <button
            onClick={onClose}
            className="text-current opacity-50 hover:opacity-100 flex-shrink-0"
          >
            ✕
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Tabs Component
 */
export const Tabs = ({ tabs, defaultTab = 0, onChange }) => {
  const [active, setActive] = React.useState(defaultTab);

  const handleChange = (index) => {
    setActive(index);
    onChange?.(index);
  };

  return (
    <div>
      <div className="flex gap-2 border-b border-white/10">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleChange(index)}
            className={`
              px-4 py-3 font-semibold text-sm transition-all duration-200 relative
              ${
                active === index
                  ? 'text-neon-cyan'
                  : 'text-text-tertiary hover:text-text-secondary'
              }
            `}
          >
            {tab.label}
            {active === index && (
              <motion.div
                layoutId="underline"
                className="absolute bottom-0 left-0 right-0 h-1 bg-neon-cyan rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>
      <div className="mt-4">{tabs[active]?.content}</div>
    </div>
  );
};

export default {
  Button,
  Card,
  Input,
  Modal,
  Badge,
  Skeleton,
  Spinner,
  Alert,
  Tabs,
};
