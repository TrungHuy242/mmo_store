import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

export default function CommandPalette({
  isOpen,
  onClose,
  children,
  title = 'Command Menu',
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl bg-bg-secondary border border-border rounded-xl shadow-soft-xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, products, or actions..."
                className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-text-tertiary bg-bg-tertiary border border-border rounded">
                ESC
              </kbd>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {children && typeof children === 'function'
                ? children({ query, setQuery })
                : children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Command group component
export function CommandGroup({ heading, children }) {
  return (
    <div className="py-1">
      {heading && (
        <div className="px-3 py-1.5 text-xs font-medium text-text-tertiary uppercase tracking-wider">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
}

// Command item component
export function CommandItem({
  icon,
  label,
  description,
  shortcut,
  onClick,
  disabled = false,
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
        transition-colors
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-bg-tertiary cursor-pointer'
        }
      `}
    >
      {icon && (
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-bg-tertiary text-text-secondary">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">{label}</div>
        {description && (
          <div className="text-xs text-text-tertiary truncate">{description}</div>
        )}
      </div>
      {shortcut && (
        <div className="flex-shrink-0 flex items-center gap-1">
          {shortcut.map((key, i) => (
            <kbd
              key={i}
              className="px-1.5 py-0.5 text-xs text-text-tertiary bg-bg-tertiary border border-border rounded"
            >
              {key}
            </kbd>
          ))}
        </div>
      )}
    </button>
  );
}

// Empty state for command palette
export function CommandEmpty({ message = 'No results found.' }) {
  return (
    <div className="py-8 text-center">
      <svg
        className="w-12 h-12 mx-auto text-text-tertiary mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}
