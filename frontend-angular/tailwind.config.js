/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#17243c',
          50: '#f4f6f9',
          100: '#e4eaf1',
          200: '#cbd5e5',
          300: '#a3b7d1',
          400: '#7592ba',
          500: '#5272a2',
          600: '#3f5885',
          700: '#34476c',
          800: '#2d3c5a',
          900: '#17243c',
          950: '#101626',
        },
        accent: {
          DEFAULT: '#ffc414',
          50: '#fffdf0',
          100: '#fff9d6',
          200: '#fff1ac',
          300: '#ffe476',
          400: '#ffd036',
          500: '#ffc414',
          600: '#dca003',
          700: '#b07500',
          800: '#8f5c07',
          900: '#76490c',
          950: '#442602',
        },
        success: '#047857',
        danger: '#9f1239',
        warning: '#6d4b00',
        background: '#f3f6fb',
        surface: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'soft': '0 2px 10px rgba(23, 36, 60, 0.04)',
        'popover': '0 12px 32px rgba(0, 0, 0, 0.1)',
        'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 12px 24px -4px rgba(0, 0, 0, 0.05), 0 24px 48px -12px rgba(0, 0, 0, 0.08)',
        'premium-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 20px 30px -5px rgba(0, 0, 0, 0.08), 0 32px 64px -12px rgba(0, 0, 0, 0.12)'
      }
    },
  },
  plugins: [],
}