import { forwardRef, useState } from 'react';

const variants = {
  default: 'bg-bg-tertiary border-border text-text-primary placeholder:text-text-tertiary',
  error: 'bg-bg-tertiary border-danger text-text-primary placeholder:text-text-tertiary',
  success: 'bg-bg-tertiary border-success text-text-primary placeholder:text-text-tertiary',
};

const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full bg-bg-tertiary border rounded-lg
            text-text-primary placeholder:text-text-tertiary
            transition-all duration-200
            focus:outline-none focus:ring-1
            disabled:opacity-50 disabled:cursor-not-allowed
            ${variant === 'error' ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border focus:border-primary focus:ring-primary'}
            ${leftIcon ? 'pl-10' : 'pl-4'} ${rightIcon ? 'pr-10' : 'pr-4'} py-2.5
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-text-tertiary">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

export const Textarea = forwardRef(({
  label,
  error,
  hint,
  className = '',
  containerClassName = '',
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full bg-bg-tertiary border rounded-lg
          text-text-primary placeholder:text-text-tertiary
          transition-all duration-200
          focus:outline-none focus:ring-1
          disabled:opacity-50 disabled:cursor-not-allowed
          px-4 py-3 resize-none
          ${error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border focus:border-primary focus:ring-primary'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-text-tertiary">{hint}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
