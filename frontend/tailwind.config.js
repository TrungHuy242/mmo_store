/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0a0a12',
        surface: '#12121f',
        neon: {
          cyan: '#22d3ee',
          magenta: '#e635c5',
          gold: '#fbbf24',
        },
      },
      boxShadow: {
        neon: '0 0 20px rgba(34,211,238,0.4)',
        'neon-magenta': '0 0 20px rgba(230,53,197,0.4)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
