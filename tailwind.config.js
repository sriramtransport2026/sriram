/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Deep Navy from Sri Ram Transport Logo
          navy: '#0a2240',
          'navy-dark': '#061527',
          'navy-light': '#173a67',
          'navy-subtle': '#0d2d54',
          
          // Golden Yellow / Amber from Sri Ram Transport Logo
          gold: '#f59e0b',
          'gold-light': '#fbbf24',
          'gold-dark': '#d97706',
          'gold-subtle': '#fffbeb',
          
          // Functional Accents
          green: '#16a34a',
          'green-dark': '#15803d',
          'green-light': '#f0fdf4',
          bg: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(10, 34, 64, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 30px -4px rgba(10, 34, 64, 0.10), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'glow-gold': '0 0 25px rgba(245, 158, 11, 0.35)',
        'glow-navy': '0 0 25px rgba(10, 34, 64, 0.25)',
      }
    },
  },
  plugins: [],
}
