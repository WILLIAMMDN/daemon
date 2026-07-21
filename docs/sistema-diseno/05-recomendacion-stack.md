# Recomendación de stack: Opción C (híbrido controlado)

> Decisión cerrada con Max el 2026-07-20. No se reabre sin conversación
> con el owner.

## TL;DR

DAEMON usa **SCSS para capas no-utilitarias + Tailwind 3.4 (utility) +
NG-ZORRO 21.3 (componentes complejos) + CVA + clsx + tailwind-merge**.

Esta es la **Opción C** del brief original. Las otras dos opciones (A = solo
SCSS, B = solo Tailwind) se descartan por motivos documentados abajo.

## Estado actual (evidencia)

```text
✓ Tailwind 3.4.19 instalado y cargado en styles.scss (@tailwind base/components/utilities)
✓ tailwind.config.js con paleta extendida (primary 50-950, accent 50-950, shadows)
✓ CVA 0.7, clsx 2.1, tailwind-merge 3.5 instalados (casi no usados)
✓ NG-ZORRO 21.3.2 como librería de componentes
✓ Sistema de tokens CSS coexistente con Tailwind (sin enlace entre ambos)
```

El 70% de los templates usa Tailwind. El 30% usa SCSS. La pregunta no es
"¿Tailwind o SCSS?" sino "¿cómo hacemos que convivan bien?".

## Comparación de las 3 opciones

| Criterio | A. Solo SCSS | B. Solo Tailwind | C. Híbrido (recomendada) |
|---|---|---|---|
| Cantidad actual de SCSS | 1846 líneas (4 parciales) | — | se mantienen los no-utilitarios |
| Duplicación de paleta | alta (cada SCSS tiene su hex) | media (theme + arbitrary values) | baja (theme = tokens) |
| Complejidad de migración | rompería 70% del código | rompería overrides NG-ZORRO | nula (lo que hay, se queda) |
| Experiencia del equipo | media (mixto de cómo se hace cada cosa) | media (clases largas en templates) | alta (clase corta + override explícito) |
| Mantenimiento | bajo (lento de leer) | alto (refactors de clases masivas) | medio (cada cosa en su sitio) |
| Tamaño del bundle | medio (CSS legacy) | medio (purge elimina lo no usado) | **menor** (purge + tokens) |
| Legibilidad de templates | baja | media (clases largas) | **alta** (clase semántica) |
| Compatibilidad NG-ZORRO | alta (overrides naturales) | baja (overrides con `@apply` frágiles) | **alta** (overrides en SCSS) |
| Riesgo de estilos contradictorios | alto (3 paletas hoy) | alto (theme vs arbitrary) | **bajo** (1 token, 1 clase) |
| Velocidad de desarrollo | media | alta | **alta** |
| Facilidad de tematización | media | alta (theme por nivel) | **alta** (theme = tokens) |

## Por qué NO A (solo SCSS)

1. El 70% de los templates ya está en Tailwind. Revertir a SCSS es trabajo
   inútil.
2. El SCSS actual tiene 1846 líneas con valores duplicados. Consolidarlo
   sin Tailwind llevaría 1 sprint solo para reescribir templates.
3. La combinación `clase + variante dinámica` que CVA resuelve es muy
   superior al patrón `@if` de SCSS para componentes como botones.

## Por qué NO B (solo Tailwind)

1. `_popovers.scss` tiene 910 líneas que dependen del CDK overlay. Tirarlo
   a la basura es perder trabajo útil.
2. Las animaciones de marca (`@keyframes shimmer`, `@keyframes coin-bounce`)
   son más claras en SCSS que en `@layer` de Tailwind.
3. El override de NG-ZORRO (`.daemon-btn.ant-btn-primary`) tiene que
   tocar el specificity de Angular, y eso requiere SCSS con `::ng-deep`
   o `:host` en la mayoría de los casos.

## Por qué SÍ C (híbrido)

1. **Lo que ya hay, se queda.** Tailwind utility classes, SCSS para
   overrides y popovers, NG-ZORRO para componentes complejos.
2. **El SCSS se reduce a lo que Tailwind no resuelve bien:**
   - Overrides de NG-ZORRO (`_components.scss`).
   - Popovers que escapan al CDK overlay (`_popovers.scss`).
   - Animaciones de marca (`_gamification.scss`).
   - `:host` styles de los layouts.
3. **CVA + clsx + tailwind-merge** ya están instalados y se usan poco.
   En Fase 2 se vuelven la forma estándar de crear componentes.
4. **Los tokens CSS son la única fuente de verdad**, consumidos por
   Tailwind y por SCSS por igual.

## Política de adopción gradual

1. **Hoy → Fase 1:** `tailwind.config.js` consume los tokens con
   `var(--daemon-*)`. Cero hex nuevos en features.
2. **Fase 1 → 2:** se introducen primitivos (`page-container`,
   `page-header`, `stat-card`, `hero-band`, `catalog-toolbar`,
   `catalog-card`, `catalog-aside`, `bottom-sheet`, `form-page`,
   `auth-card`, `classic-field`) usando CVA + tailwind-merge.
3. **Fase 2 → 3:** se migran 3 páginas piloto. Los primitivos se validan.
4. **Fase 3 → 5:** se migra el resto.
5. **Nunca:** se introduce un color nuevo sin justificación escrita en
   `01-auditoria-frontend.md`.

## CVA — cómo se usa

CVA (class-variance-authority) permite variantes tipadas sin props
booleanas infinitas. Ejemplo del futuro `daemon-btn`:

```ts
// src/app/shared/componentes/daemon-btn/daemon-btn.variants.ts
import { cva, type VariantProps } from 'class-variance-authority';

export const daemonBtnVariants = cva(
  // base
  'inline-flex items-center justify-center font-semibold rounded-card transition-colors motion-reduce:transition-none disabled:opacity-55 disabled:cursor-not-allowed',
  {
    variants: {
      tone: {
        primary:   'bg-primary text-white hover:bg-primary-dark',
        secondary: 'bg-white text-ink border border-border hover:bg-surface-muted',
        ghost:     'bg-transparent text-primary hover:bg-primary-soft',
        danger:    'bg-danger text-white hover:opacity-90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-base',
        lg: 'h-12 px-6 text-base',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { tone: 'primary', size: 'md' },
  }
);

export type DaemonBtnVariants = VariantProps<typeof daemonBtnVariants>;
```

En el template:

```html
<button [class]="cn(daemonBtnVariants({ tone, size, fullWidth }))">
  <ng-content></ng-content>
</button>
```

`cn` viene de `clsx + tailwind-merge` para resolver conflictos.

## NG-ZORRO — qué se usa y qué no

| Componente NG-ZORRO | Usar en |
|---|---|
| `nz-button` | TODAS las acciones. Wrapped por `daemon-btn` (Fase 2). |
| `nz-modal` | Arquetipos D y E. |
| `nz-table` | Arquetipo E. |
| `nz-tag` | Estados, categorías, niveles. |
| `nz-alert` | Errores y mensajes de éxito. |
| `nz-empty` | Solo si no se usa `app-estado-vacio`. |
| `nz-form`, `nz-input`, `nz-select`, `nz-date-picker` | Arquetipos D y E. |
| `nz-progress` (circle + line) | Progreso en hero, ranking, perfil. |
| `nz-avatar` | Avatares en ranking, comunidad, comentarios. |
| `nz-dropdown` | Menú de perfil en topbar. |
| `nz-pagination` | Tablas densas. |
| `nz-steps`, `nz-tabs`, `nz-collapse` | Flujos con pasos (crear cuento, evaluación). |
| `nz-tooltip`, `nz-popover` | Cuando se necesita UX de NG-ZORRO. Si es personalizado, hacer componente propio. |
| `nz-carousel`, `nz-slider` | Evitar — son distractores visuales para DAEMON. |
| `nz-drawer` | Solo si el bottom-sheet propio no alcanza. |
| `nz-message`, `nz-notification` | Sustituir por `app-toast` (Fase 2). |
| `nz-skeleton` | Usar `app-cargando` en su lugar. |

## Política de overrides NG-ZORRO

- Los overrides de NG-ZORRO viven en `_components.scss` con el prefijo
  `.daemon-` o `.student-premium`.
- No se permiten overrides con selectores anidados profundos tipo
  `.ant-table tr td div .ant-btn span`. Si el override no se puede
  expresar con un selector de una capa, se crea un componente propio.
- `!important` está permitido en `_components.scss` solo cuando NG-ZORRO
  lo exige por especificidad nativa (`.ant-tag` es un ejemplo real).

## Lo que NO cambia con esta decisión

- El sidebar del alumno se mantiene. Sus IDs los usa el tour.
- La topbar compacta del alumno se mantiene.
- Inter sigue siendo la única fuente.
- NG-ZORRO sigue siendo la librería de componentes.
- El bundle inicial sigue con budget de 1 MB warning.

## Acción de Fase 1

- Crear `src/styles/_tokens.scss` con la lista de tokens.
- Reemplazar el `tailwind.config.js` con el contenido basado en
  `var(--daemon-*)` (ver `04-tokens-y-tema.md` §3.2).
- Crear `scripts/check-style-tokens.mjs`.
- No tocar features ni SCSS de componentes.

## Acción de Fase 2

- Crear los 11 primitivos listados en §3.1 de `04-tokens-y-tema.md`,
  cada uno con CVA + tailwind-merge + spec Jest + e2e Playwright mínimo.
- El primero de todos: `daemon-btn`, que reemplaza todos los
  `daemon-btn ant-btn-primary` con un wrapper standalone.
- El segundo: `page-header`, que se vuelve la base de los 3 pilotos.

## Riesgos identificados

1. **Tailwind purge puede dejar fuera clases usadas dinámicamente.**
   Solución: el `content` ya apunta a `src/**/*.{html,ts}`. Si se
   introduce una clase dinámica con `cn()` de clsx, hay que agregarla
   al `safelist` o documentarla.
2. **NG-ZORRO v21 + Angular 21 son recientes.** Si hay un bug, la
   solución puede no estar en StackOverflow. Mitigación: stack oficial
   en `frontend-angular/src/environments/`.
3. **El linter puede dar falsos positivos** en archivos de test o en
   mocks. Solución: extensión `*.spec.ts` excluida del linter.
