/** @type {import('tailwindcss').Config} */
/*
 * DAEMON — Tailwind theme
 * ------------------------------------------------------------
 * The theme values are `var(--daemon-*)` references. The actual
 * hex values live in `src/styles/_tokens.scss` (single source of
 * truth). Changing a token there propagates here automatically.
 *
 * Phase 1 deliverable (2026-07-20). See
 * docs/sistema-diseno/04-tokens-y-tema.md for the rationale.
 */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        /* === SUPERFICIE === */
        canvas:          'var(--daemon-canvas)',
        surface:         'var(--daemon-surface)',
        'surface-muted': 'var(--daemon-surface-muted)',
        'surface-elevated': 'var(--daemon-surface-elevated)',
        border:          'var(--daemon-border)',
        'border-strong': 'var(--daemon-border-strong)',

        /* === TIPOGRAFÍA === */
        ink:        'var(--daemon-ink)',
        'ink-soft': 'var(--daemon-ink-soft)',
        muted:      'var(--daemon-muted)',
        'on-primary': 'var(--daemon-on-primary)',
        'on-accent':  'var(--daemon-on-accent)',

        /* === ACCIÓN PRIMARIA === */
        primary: {
          DEFAULT: 'var(--daemon-primary)',
          soft:    'var(--daemon-primary-soft)',
          dark:    'var(--daemon-primary-dark)',
        },

        /* === ACENTO DAEMONS === */
        accent: {
          DEFAULT: 'var(--daemon-accent)',
          soft:    'var(--daemon-accent-soft)',
          dark:    'var(--daemon-accent-dark)',
        },

        /* === SEMÁNTICOS === */
        success: { DEFAULT: 'var(--daemon-success)', soft: 'var(--daemon-success-soft)' },
        warning: { DEFAULT: 'var(--daemon-warning)', soft: 'var(--daemon-warning-soft)' },
        danger:  { DEFAULT: 'var(--daemon-danger)',  soft: 'var(--daemon-danger-soft)'  },
        info:    { DEFAULT: 'var(--daemon-info)',    soft: 'var(--daemon-info-soft)'    },

        /* === NIVELES === */
        kids: {
          DEFAULT: 'var(--daemon-kids)',
          soft:    'var(--daemon-kids-soft)',
          border:  'var(--daemon-kids-border)',
        },
        teens: {
          DEFAULT: 'var(--daemon-teens)',
          soft:    'var(--daemon-teens-soft)',
          border:  'var(--daemon-teens-border)',
        },

        /* === DOCENTE / TUTOR === */
        docente: { DEFAULT: 'var(--daemon-docente)', soft: 'var(--daemon-docente-soft)' },
        tutor:   { DEFAULT: 'var(--daemon-tutor)',   soft: 'var(--daemon-tutor-soft)',   ink: 'var(--daemon-tutor-ink)' },
      },
      borderRadius: {
        sm:     'var(--daemon-radius-sm)',
        md:     'var(--daemon-radius-md)',
        lg:     'var(--daemon-radius-lg)',
        card:   'var(--daemon-radius-card)',
        banner: 'var(--daemon-radius-banner)',
      },
      maxWidth: {
        page: 'var(--daemon-page-max)',
      },
      padding: {
        page: 'var(--daemon-page-pad)',
      },
      boxShadow: {
        soft:    'var(--daemon-shadow-soft)',
        popover: 'var(--daemon-shadow-popover)',
        premium: 'var(--daemon-shadow-premium)',
        bento:   'var(--daemon-shadow-bento)',
      },
      transitionTimingFunction: {
        'ease-out-daemon': 'var(--daemon-ease-out)',
      },
      transitionDuration: {
        fast: 'var(--daemon-duration-fast)',
        base: 'var(--daemon-duration-base)',
        slow: 'var(--daemon-duration-slow)',
      },
      zIndex: {
        content:  'var(--daemon-z-content)',
        sticky:   'var(--daemon-z-sticky)',
        sidebar:  'var(--daemon-z-sidebar)',
        topbar:   'var(--daemon-z-topbar)',
        dropdown: 'var(--daemon-z-dropdown)',
        modal:    'var(--daemon-z-modal)',
        toast:    'var(--daemon-z-toast)',
        tooltip:  'var(--daemon-z-tooltip)',
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
