/** @type {import('tailwindcss').Config} */
/*
 * DAEMON — Tailwind theme
 * ------------------------------------------------------------
 * The theme values are `var(--daemon-*)` references. The actual
 * hex values live in `src/styles/_tokens.scss` (single source of
 * truth). Changing a token there propagates here automatically.
 *
 * Canonical layer: maps the APPROVED tokens of the Token Map V1
 * (docs/30-design-system/token-map.md) to DAEMON utilities:
 *   - semantic success/warning/danger/info (+ subtles)
 *   - student action/progress/mission/creative/reward/navigation
 *   - radius xs/sm/md/lg/xl/pill
 *   - shadow xs/sm/md/lg
 *   - typography scale (display..mini)
 *
 * The default Tailwind palette (gray, blue, slate, etc.) is kept
 * intact: existing consumers still use it. It will be retired in a
 * controlled migration phase, not in this foundation task.
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
        disabled:   'var(--daemon-neutral-text-disabled)',
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

        /* === SEMÁNTICOS LEGACY (compatibilidad) === */
        success: { DEFAULT: 'var(--daemon-success)', soft: 'var(--daemon-success-soft)' },
        warning: { DEFAULT: 'var(--daemon-warning)', soft: 'var(--daemon-warning-soft)' },
        danger:  { DEFAULT: 'var(--daemon-danger)',  soft: 'var(--daemon-danger-soft)'  },
        info:    { DEFAULT: 'var(--daemon-info)',    soft: 'var(--daemon-info-soft)'    },

        /* === SEMÁNTICOS CANÓNICOS (Token Map V1) === */
        semantic: {
          success:        'var(--daemon-semantic-success)',
          'success-subtle': 'var(--daemon-semantic-success-subtle)',
          warning:        'var(--daemon-semantic-warning)',
          'warning-subtle': 'var(--daemon-semantic-warning-subtle)',
          danger:         'var(--daemon-semantic-danger)',
          'danger-subtle':  'var(--daemon-semantic-danger-subtle)',
          info:           'var(--daemon-semantic-info)',
          'info-subtle':    'var(--daemon-semantic-info-subtle)',
        },

        /* === ROLES DE ESTUDIANTE (Token Map V1) === */
        student: {
          action:           'var(--daemon-student-action-primary)',
          progress:         'var(--daemon-student-progress)',
          mission:          'var(--daemon-student-mission)',
          creative:         'var(--daemon-student-creative)',
          reward:           'var(--daemon-student-reward)',
          navigation:       'var(--daemon-student-navigation)',
          'navigation-text':  'var(--daemon-student-navigation-text)',
          'navigation-muted': 'var(--daemon-student-navigation-muted)',
        },

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
      fontSize: {
        /* Escala tipográfica aprobada (Token Map V1 §5) */
        display:  ['var(--daemon-font-size-display)',  { lineHeight: 'var(--daemon-line-height-display)',  fontWeight: 'var(--daemon-font-weight-display)'  }],
        h1:       ['var(--daemon-font-size-h1)',       { lineHeight: 'var(--daemon-line-height-h1)',       fontWeight: 'var(--daemon-font-weight-h1)'       }],
        h2:       ['var(--daemon-font-size-h2)',       { lineHeight: 'var(--daemon-line-height-h2)',       fontWeight: 'var(--daemon-font-weight-h2)'       }],
        h3:       ['var(--daemon-font-size-h3)',       { lineHeight: 'var(--daemon-line-height-h3)',       fontWeight: 'var(--daemon-font-weight-h3)'       }],
        'body-lg': ['var(--daemon-font-size-body-lg)', { lineHeight: 'var(--daemon-line-height-body-lg)',  fontWeight: 'var(--daemon-font-weight-body-lg)'  }],
        body:     ['var(--daemon-font-size-body)',     { lineHeight: 'var(--daemon-line-height-body)',     fontWeight: 'var(--daemon-font-weight-body)'     }],
        small:    ['var(--daemon-font-size-small)',    { lineHeight: 'var(--daemon-line-height-small)',    fontWeight: 'var(--daemon-font-weight-small)'    }],
        caption:  ['var(--daemon-font-size-caption)',  { lineHeight: 'var(--daemon-line-height-caption)',  fontWeight: 'var(--daemon-font-weight-caption)'  }],
        mini:     ['var(--daemon-font-size-mini)',     { lineHeight: 'var(--daemon-line-height-mini)',     fontWeight: 'var(--daemon-font-weight-mini)'     }],
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        ui:      ['var(--daemon-font-family-ui)'],
      },
      borderRadius: {
        /* Escala aprobada (Token Map V1 §7) */
        xs:     'var(--daemon-radius-xs)',
        sm:     'var(--daemon-radius-sm)',
        md:     'var(--daemon-radius-md)',
        lg:     'var(--daemon-radius-lg)',
        xl:     'var(--daemon-radius-xl)',
        pill:   'var(--daemon-radius-pill)',
        /* Legacy: mantener para consumidores actuales */
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
        /* Escala aprobada (Token Map V1 §8) */
        xs: 'var(--daemon-shadow-xs)',
        sm: 'var(--daemon-shadow-sm)',
        md: 'var(--daemon-shadow-md)',
        lg: 'var(--daemon-shadow-lg)',
        /* Legacy: mantener para consumidores actuales */
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
    },
  },
  plugins: [],
};
