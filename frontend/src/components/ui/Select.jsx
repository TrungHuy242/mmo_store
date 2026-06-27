import { forwardRef } from 'react';

const Select = forwardRef(({
  label,
  error,
  hint,
  options = [],
  placeholder = 'Select an option',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full bg-bg-tertiary border rounded-lg
            text-text-primary appearance-none cursor-pointer
            transition-all duration-200
            focus:outline-none focus:ring-1
            disabled:opacity-50 disabled:cursor-not-allowed
            px-4 py-2.5 pr-10
            ${error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border focus:border-primary focus:ring-primary'}
            ${className}
          `}
          {...props}
        >
          <option value="" disabled className="text-text-tertiary">{placeholder}</option>
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              className="bg-bg-tertiary text-text-primary"
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-text-tertiary">{hint}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
