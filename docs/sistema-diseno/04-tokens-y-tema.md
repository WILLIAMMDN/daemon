# Tokens y tema

> Una sola fuente de verdad: CSS Custom Properties en `src/styles.scss`.
> `tailwind.config.js` consume esos tokens con `var(--daemon-*)`.

## 1. Estado actual (lo que existe)

### Tokens en `src/styles.scss` (líneas 10-22)

```css
:root {
  --daemon-canvas: #f4f7fb;
  --daemon-surface: #ffffff;
  --daemon-surface-muted: #f8fafc;
  --daemon-border: #e4eaf2;
  --daemon-ink: #172033;
  --daemon-muted: #667085;
  --daemon-primary: #1677ff;
  --daemon-primary-dark: #0958d9;
  --daemon-success: #12a150;
  --daemon-warning: #f5a000;
}
```

### Tailwind theme (`tailwind.config.js`)

```js
colors: {
  daemon: { ink: '#111827', canvas: '#f6f8fc', electric: '#2563eb', ... },
  primary: { DEFAULT: '#17243c', 50-950 },     // ← escala basada en #17243c
  accent:  { DEFAULT: '#ffc414', 50-950 },     // ← escala basada en #ffc414
  success: '#047857',
  danger:  '#9f1239',
  warning: '#6d4b00',
  background: '#f6f8fc',
  surface: '#ffffff',
}
```

### Tema por nivel (`core/dominio/tema-portal-alumno.ts`)

```ts
KIDS:  { colorPrincipal: '#00b4d8', colorPrincipalOscuro: '#0077b6',
         colorSuave: '#e8f9fc', colorBorde: '#b8edf5' }
TEENS: { colorPrincipal: '#1677ff', colorPrincipalOscuro: '#0958d9',
         colorSuave: '#edf5ff', colorBorde: '#cfe3ff' }
```

## 2. El problema (auditoría)

| Concepto | Token canónico | Tailwind | Login | Panel | Galería |
|---|---|---|---|---|---|
| Azul primario | `--daemon-primary: #1677ff` | `primary.900: #17243c` | `#15326b` | `#1f1f75` | — |
| Acento DAEMONS | `--daemon-warning: #f5a000` | `accent.DEFAULT: #ffc414` | — | `#ffc414` | — |
| Borde | `--daemon-border: #e4eaf2` | `slate-200` | `#d7deea` | `slate-200` | — |
| Canvas | `--daemon-canvas: #f4f7fb` | `background: #f6f8fc` | `#f4f6f8` | — | — |
| Púrpura acento | (no existe) | `daemon.purple: #9333ea` | — | `#4f46e5` | `#6c3fe8` |

5 fuentes distintas para "azul primario". 4 para "borde". 3 para "púrpura".

## 3. La solución (Fase 1)

### 3.1 Tokens consolidados en `_tokens.scss`

Mover los tokens actuales a un nuevo archivo `src/styles/_tokens.scss` que
será el único lugar donde se definen valores. `styles.scss` lo importa y
expone.

```scss
// src/styles/_tokens.scss
:root {
  /* === SUPERFICIE === */
  --daemon-canvas:        #f4f7fb;
  --daemon-surface:       #ffffff;
  --daemon-surface-muted: #f8fafc;
  --daemon-surface-elevated: #ffffff;
  --daemon-border:        #e4eaf2;
  --daemon-border-strong: #cbd5e5;

  /* === TIPOGRAFÍA === */
  --daemon-ink:           #172033;
  --daemon-ink-soft:      #334155;
  --daemon-muted:         #667085;
  --daemon-on-primary:    #ffffff;
  --daemon-on-accent:     #24194f;

  /* === ACCIÓN PRIMARIA (azul DAEMON) === */
  --daemon-primary:       #1677ff;
  --daemon-primary-soft:  #e8f1ff;
  --daemon-primary-dark:  #0958d9;

  /* === ACENTO DAEMONS (ámbar) === */
  --daemon-accent:        #ffc414;
  --daemon-accent-soft:   #fff7d6;
  --daemon-accent-dark:   #dca003;
  --daemon-on-accent:     #24194f;

  /* === SEMÁNTICOS === */
  --daemon-success:       #12a150;
  --daemon-success-soft:  #e7f8ef;
  --daemon-warning:       #f5a000;
  --daemon-warning-soft:  #fff4d7;
  --daemon-danger:        #b42331;
  --daemon-danger-soft:   #ffe5e9;
  --daemon-info:          #2563eb;
  --daemon-info-soft:     #eff6ff;

  /* === NIVELES (KIDS / TEENS) === */
  --daemon-kids:          #00b4d8;
  --daemon-kids-soft:     #e8f9fc;
  --daemon-kids-border:   #b8edf5;
  --daemon-teens:         #1677ff;
  --daemon-teens-soft:    #edf5ff;
  --daemon-teens-border:  #cfe3ff;

  /* === DOCENTE / TUTOR === */
  --daemon-docente:       #19c1d0;
  --daemon-docente-soft:  #e9fbfd;
  --daemon-tutor:         #ffc414;
  --daemon-tutor-soft:    #fff8dc;
  --daemon-tutor-ink:     #24194f;

  /* === RADIO === */
  --daemon-radius-sm:     8px;
  --daemon-radius-md:     12px;
  --daemon-radius-lg:     16px;
  --daemon-radius-card:   14px;
  --daemon-radius-banner: 22px;

  /* === ESPACIO (clamp para responsive) === */
  --daemon-space-1:  0.25rem;
  --daemon-space-2:  0.5rem;
  --daemon-space-3:  0.75rem;
  --daemon-space-4:  1rem;
  --daemon-space-6:  1.5rem;
  --daemon-space-8:  2rem;
  --daemon-page-pad: clamp(1rem, 2.5vw, 1.5rem);
  --daemon-page-max: 1280px;

  /* === SOMBRAS === */
  --daemon-shadow-soft:    0 2px 10px rgba(23, 36, 60, 0.04);
  --daemon-shadow-popover: 0 12px 32px rgba(0, 0, 0, 0.10);
  --daemon-shadow-premium: 0 4px 6px -1px rgba(0,0,0,0.03),
                           0 12px 24px -4px rgba(0,0,0,0.05),
                           0 24px 48px -12px rgba(0,0,0,0.08);
  --daemon-shadow-bento:   0 24px 70px -34px rgba(30, 64, 175, 0.28);

  /* === TRANSICIONES === */
  --daemon-ease-out:  cubic-bezier(.2, .7, .25, 1);
  --daemon-duration-fast: 120ms;
  --daemon-duration-base: 180ms;
  --daemon-duration-slow: 280ms;
}
```

### 3.2 Tailwind config referenciando los tokens

`tailwind.config.js` pasa a consumir los tokens en vez de duplicar valores:

```js
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        canvas:           'var(--daemon-canvas)',
        surface:          'var(--daemon-surface)',
        'surface-muted':  'var(--daemon-surface-muted)',
        border:           'var(--daemon-border)',
        'border-strong':  'var(--daemon-border-strong)',
        ink:              'var(--daemon-ink)',
        'ink-soft':       'var(--daemon-ink-soft)',
        muted:            'var(--daemon-muted)',
        primary: {
          DEFAULT: 'var(--daemon-primary)',
          soft:    'var(--daemon-primary-soft)',
          dark:    'var(--daemon-primary-dark)',
        },
        accent: {
          DEFAULT: 'var(--daemon-accent)',
          soft:    'var(--daemon-accent-soft)',
          dark:    'var(--daemon-accent-dark)',
        },
        success:  { DEFAULT: 'var(--daemon-success)',  soft: 'var(--daemon-success-soft)' },
        warning:  { DEFAULT: 'var(--daemon-warning)',  soft: 'var(--daemon-warning-soft)' },
        danger:   { DEFAULT: 'var(--daemon-danger)',   soft: 'var(--daemon-danger-soft)' },
        info:     { DEFAULT: 'var(--daemon-info)',     soft: 'var(--daemon-info-soft)' },
        kids:     { DEFAULT: 'var(--daemon-kids)',     soft: 'var(--daemon-kids-soft)', border: 'var(--daemon-kids-border)' },
        teens:    { DEFAULT: 'var(--daemon-teens)',    soft: 'var(--daemon-teens-soft)', border: 'var(--daemon-teens-border)' },
        docente:  { DEFAULT: 'var(--daemon-docente)',  soft: 'var(--daemon-docente-soft)' },
        tutor:    { DEFAULT: 'var(--daemon-tutor)',    soft: 'var(--daemon-tutor-soft)', ink: 'var(--daemon-tutor-ink)' },
      },
      borderRadius: {
        sm:     'var(--daemon-radius-sm)',
        md:     'var(--daemon-radius-md)',
        lg:     'var(--daemon-radius-lg)',
        card:   'var(--daemon-radius-card)',
        banner: 'var(--daemon-radius-banner)',
      },
      boxShadow: {
        soft:    'var(--daemon-shadow-soft)',
        popover: 'var(--daemon-shadow-popover)',
        premium: 'var(--daemon-shadow-premium)',
        bento:   'var(--daemon-shadow-bento)',
      },
      maxWidth: {
        page: 'var(--daemon-page-max)',
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### 3.3 Resultado

- Cambiar un token en `_tokens.scss` se propaga a Tailwind automáticamente.
- Las clases `bg-primary`, `text-ink`, `border-border`, `rounded-card`,
  `shadow-soft` se vuelven semánticas, no referencian valores concretos.
- Las features nuevas solo pueden usar estas clases — el linter bloquea
  todo lo demás.

## 4. Reglas de uso

### Permitido

- `bg-canvas`, `bg-surface`, `bg-surface-muted`, `bg-primary`, `bg-accent`,
  `bg-success`, `bg-warning`, `bg-danger`, `bg-info`, `bg-kids`,
  `bg-teens`, `bg-docente`, `bg-tutor`, `bg-white`, `bg-transparent`.
- `text-ink`, `text-ink-soft`, `text-muted`, `text-primary`, `text-success`,
  `text-warning`, `text-danger`, `text-white`.
- `border-border`, `border-border-strong`, `border-primary`, `border-kids`.
- `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-card`, `rounded-banner`.
- `shadow-soft`, `shadow-popover`, `shadow-premium`, `shadow-bento`.

### Prohibido (en features y shared)

- `bg-[#hex]`, `text-[#hex]`, `border-[#hex]` y cualquier utility class
  con valor hardcoded.
- `bg-gradient-to-*`, `from-*`, `to-*` (Tailwind gradient) en features de
  alumno o cuentos.
- `backdrop-blur-*` salvo overrides documentados.
- `bg-slate-XXX`, `text-slate-XXX` (Tailwind slate palette) en features.
  Si necesitas un neutral, usa `bg-surface-muted` o `bg-canvas`.

### Allowlist (archivos que SÍ pueden tener hex)

Estos archivos son los únicos donde aparecen valores hex explícitos:

- `src/styles/_tokens.scss` — el origen.
- `src/styles.scss` — solo declaraciones `@tailwind` y `@import`.
- `tailwind.config.js` — solo `var(--daemon-*)` (no hex).
- `src/styles/_components.scss` — overrides NG-ZORRO con `var(--daemon-*)`.
- `src/styles/_popovers.scss` — colores secundarios del CDK overlay.
- `src/app/core/dominio/tema-portal-alumno.ts` — solo durante transición,
  antes de que se lean desde `getComputedStyle(document.documentElement)`.

Si necesitas agregar un archivo al allowlist, lo agregas con justificación
escrita en `01-auditoria-frontend.md` y un comentario `/* allowlist: <razón> */`
en el código.

## 5. Linter (`check:style-tokens.mjs`)

El script se ejecuta en `npm run test:ci`. Falla si:

1. Encuentra `#[0-9a-fA-F]{3,8}` en un archivo no allowlist.
2. Encuentra `bg-[#...]`, `text-[#...]`, `border-[#...]` (Tailwind arbitrary
   values con hex).
3. Encuentra `linear-gradient`, `radial-gradient`, `bg-gradient-to-` en
   `src/app/features/alumno/**` o `src/app/features/cuentos/**`.
4. Encuentra `backdrop-blur-` en `src/app/features/**` salvo allowlist
   documentado.
5. Encuentra `outline: ` con valor distinto de `none` o `currentColor`
   (foco accesible).
6. Encuentra `!important` fuera de overrides NG-ZORRO (selector
   `.ant-*` o `.daemon-*` en `_components.scss`).

## 6. Orden de tokens al modificar

1. ¿El cambio afecta a más de un módulo? → agrégalo a `_tokens.scss`.
2. ¿El cambio es solo cosmético y único? → no se hace, se busca
   alternativa en tokens existentes.
3. ¿El cambio es para un override de NG-ZORRO? → entra en
   `_components.scss`, no en `_tokens.scss`.
4. ¿El cambio es temporal? → no va a tokens, va en una rama y se descarta.

## 7. Acción de Fase 1

Archivos a crear/modificar:

1. **Crear** `src/styles/_tokens.scss` con el contenido de §3.1.
2. **Modificar** `src/styles.scss`: quitar el bloque `:root` y reemplazarlo
   por `@import './styles/tokens';`.
3. **Reemplazar** `tailwind.config.js` con el contenido de §3.2.
4. **Crear** `scripts/check-style-tokens.mjs` con las reglas de §5.
5. **Modificar** `package.json`: agregar `"check:style-tokens": "node
   scripts/check-style-tokens.mjs"` y sumarlo al script `test:ci`.
6. **NO** migrar features todavía. Solo el contrato de tokens.

Verificación:

```powershell
cd C:\laragon\www\daemon\frontend-angular
npm run check:style-tokens    # debe pasar en limpio
npm run build                  # debe seguir < 1 MB
```

PR con esos 6 cambios + este directorio de docs.
