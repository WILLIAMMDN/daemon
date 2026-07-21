/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        daemon: {
          ink: 'var(--ds-color-text-primary)',
          canvas: 'var(--ds-color-canvas)',
          electric: 'var(--ds-color-brand)',
          indigo: 'var(--ds-color-info)',
          purple: '#9333ea', // Retain for specific legacy items
          gold: 'var(--ds-color-accent)',
          mint: '#2dd4bf',
        },
        primary: {
          DEFAULT: 'var(--ds-color-brand)',
          50: 'var(--ds-color-brand-subtle)',
          100: 'var(--ds-color-border)',
          200: 'var(--ds-color-border-strong)',
          300: '#a3b7d1',
          400: '#7592ba',
          500: '#5272a2',
          600: 'var(--ds-color-brand-hover)',
          700: 'var(--ds-color-brand-active)',
          800: '#2d3c5a',
          900: 'var(--ds-color-text-primary)',
          950: '#101626',
        },
        brand: {
          DEFAULT: 'var(--ds-color-brand)',
          hover: 'var(--ds-color-brand-hover)',
          active: 'var(--ds-color-brand-active)',
          subtle: 'var(--ds-color-brand-subtle)',
        },
        accent: {
          DEFAULT: 'var(--ds-color-accent)',
          50: '#fffdf0',
          100: '#fff9d6',
          200: '#fff1ac',
          300: '#ffe476',
          400: '#ffd036',
          500: 'var(--ds-color-accent)',
          600: 'var(--ds-color-accent-hover)',
          700: '#b07500',
          800: '#8f5c07',
          900: '#76490c',
          950: '#442602',
        },
        success: 'var(--ds-color-success)',
        danger: 'var(--ds-color-danger)',
        warning: 'var(--ds-color-warning)',
        info: 'var(--ds-color-info)',
        background: 'var(--ds-color-canvas)',
        surface: {
          DEFAULT: 'var(--ds-color-surface)',
          raised: 'var(--ds-color-surface-raised)',
          subtle: 'var(--ds-color-surface-subtle)',
          inverse: 'var(--ds-color-surface-inverse)',
        },
        border: {
          DEFAULT: 'var(--ds-color-border)',
          subtle: 'var(--ds-color-border-subtle)',
          strong: 'var(--ds-color-border-strong)',
        },
        text: {
          primary: 'var(--ds-color-text-primary)',
          secondary: 'var(--ds-color-text-secondary)',
          muted: 'var(--ds-color-text-muted)',
          inverse: 'var(--ds-color-text-inverse)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'soft': '0 2px 10px rgba(23, 36, 60, 0.04)',
        'popover': '0 12px 32px rgba(0, 0, 0, 0.1)',
        'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 12px 24px -4px rgba(0, 0, 0, 0.05), 0 24px 48px -12px rgba(0, 0, 0, 0.08)',
        'premium-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 20px 30px -5px rgba(0, 0, 0, 0.08), 0 32px 64px -12px rgba(0, 0, 0, 0.12)',
        'bento': '0 24px 70px -34px rgba(30, 64, 175, .28)',
        'bento-hover': '0 32px 78px -30px rgba(30, 64, 175, .34)',
        'glass': '0 18px 60px -28px rgba(15, 23, 42, .28)'
      }
    },
  },
  plugins: [],
}
