/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Figtree Variable"', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] },
      colors: {
        ink: '#14293B',        // main text (deep navy)
        muted: '#566B7C',      // secondary text
        line: '#DCE6EC',       // borders
        canvas: '#F4F8FA',     // page background
        brand: { 50: '#E8F5F6', 100: '#CDEBED', 200: '#9FD7DB', 500: '#12929D', 600: '#0E7C86', 700: '#0A646D', 800: '#084F57' },
        critical: { DEFAULT: '#C62F3B', soft: '#FBEAEC' },
        emergency: { DEFAULT: '#B96A12', soft: '#FDF1E0' },
        normal: { DEFAULT: '#2F6F9F', soft: '#E7F0F7' },
        success: { DEFAULT: '#1B7F4F', soft: '#E4F4EB' },
      },
      boxShadow: { card: '0 1px 2px rgba(20,41,59,0.06), 0 1px 3px rgba(20,41,59,0.04)' },
    },
  },
  plugins: [],
};
