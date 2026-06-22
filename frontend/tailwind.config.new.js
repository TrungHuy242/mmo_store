/**
 * Tailwind Configuration - MMO Store Premium Edition
 * Dark mode, glassmorphism, neon accents, performance-focused
 */

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'neon-cyan': 'rgb(0 212 255 / <alpha-value>)',
        'neon-magenta': 'rgb(255 0 110 / <alpha-value>)',
        'neon-purple': 'rgb(168 85 247 / <alpha-value>)',
        'neon-blue': 'rgb(14 165 233 / <alpha-value>)',
        'neon-green': 'rgb(16 185 129 / <alpha-value>)',
        'neon-yellow': 'rgb(251 191 36 / <alpha-value>)',
        'neon-red': 'rgb(239 68 68 / <alpha-value>)',

        'dark-bg': 'rgb(10 14 39 / <alpha-value>)',
        'dark-secondary': 'rgb(18 24 41 / <alpha-value>)',
        'dark-tertiary': 'rgb(26 32 47 / <alpha-value>)',
        'dark-hover': 'rgb(35 46 72 / <alpha-value>)',

        'glass-light': 'rgb(255 255 255 / 0.1)',
        'glass-lighter': 'rgb(255 255 255 / 0.05)',

        'text-primary': 'rgb(245 247 250 / <alpha-value>)',
        'text-secondary': 'rgb(184 193 212 / <alpha-value>)',
        'text-tertiary': 'rgb(138 150 170 / <alpha-value>)',
      },
      backgroundColor: {
        'dark-primary': 'rgb(10 14 39)',
        'dark-secondary': 'rgb(18 24 41)',
        'dark-tertiary': 'rgb(26 32 47)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.5)',
        'glow-magenta': '0 0 20px rgba(255, 0, 110, 0.5)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.5)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'xl': '24px',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-in',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 30px rgba(0, 212, 255, 0.8)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'slide-in-right': {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-right': {
          'from': { transform: 'translateX(0)', opacity: '1' },
          'to': { transform: 'translateX(100%)', opacity: '0' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'scale-in': {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        'gutter': '1rem',
        'section': '3rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio'),
    // Custom glass plugin
    function ({ addUtilities }) {
      addUtilities({
        '.glass': {
          '@apply bg-glass-light backdrop-blur-xl border border-white/15 rounded-xl':
            {},
        },
        '.glass-sm': {
          '@apply bg-glass-light backdrop-blur-lg border border-white/10 rounded-lg':
            {},
        },
        '.glass-hover': {
          '@apply transition-all duration-200 hover:bg-glass-light hover:border-white/20':
            {},
        },
        '.btn-glow': {
          '@apply shadow-glow-cyan hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-200':
            {},
        },
        '.text-gradient': {
          'background': 'linear-gradient(135deg, rgb(0, 212, 255), rgb(255, 0, 110))',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
      });
    },
  ],
};
