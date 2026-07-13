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
        'soft': '0 8px 24px #2030550b',
        'popover': '0 24px 70px rgba(21, 24, 48, .18), 0 8px 24px rgba(37, 31, 106, .08)',
      }
    },
  },
  plugins: [],
}