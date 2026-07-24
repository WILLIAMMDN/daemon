# DAEMON — Sistema de diseño · Plan maestro

> **Para un agente nuevo**: lee este archivo primero. Tiene 7 minutos. Si tienes que
> tocar UI sin haberlo leído, lo vas a hacer mal.

**Fecha de la última decisión:** 2026-07-20
**Estado:** Fase 0 (diagnóstico) cerrada, esperando luz verde para Fase 1.
**Owner de las decisiones:** Max William Medina Castro (Max).

---

## 1. ¿Qué es este directorio?

`docs/sistema-diseno/` es la **fuente de verdad** del rediseño de UI/UX del
frontend DAEMON. Aquí viven:

- el inventario de lo que hay hoy,
- las decisiones de arquitectura y diseño,
- los arquetipos que rigen las páginas,
- el plan de implementación por fases,
- el checklist de "terminado".

Los demás documentos de `docs/` (portal-alumno, gamificacion-xp-daemons,
sistema-visual-portal-alumno, frontend-ui-standard) **siguen vigentes** para
su alcance original. Este directorio NO los reemplaza — los complementa
porque cubre la migración completa que antes no estaba escrita.

---

## 2. Decisiones cerradas (no se reabren sin conversación con Max)

| # | Decisión | Razón corta |
|---|---|---|
| D-01 | **Opción C de stack**: SCSS para capas no-utilitarias + Tailwind 3.4 (utility) + NG-ZORRO 21.3 (componentes complejos) + CVA + clsx + tailwind-merge. | El 70% de los templates ya usa Tailwind. El SCSS resuelve lo que Tailwind no (overrides NG-ZORRO, popovers que escapan al CDK, animaciones de marca). |
| D-02 | **Una sola fuente de verdad de tokens**: CSS Custom Properties en `:root` dentro de `src/styles.scss`. `tailwind.config.js` consume esos tokens con `var(--daemon-*)`. | Hoy hay 3 palatas conviviendo. Esta regla la cierra. |
| D-03 | **Linter de tokens obligatorio** (`check:style-tokens`). Falla el build si aparece hex hardcoded, gradiente, o clase duplicada fuera del allowlist. | Lo que se puede medir, se cumple. La prosa no protege del sexto PR. |
| D-04 | **5 arquetipos** (A=Auth, B=Dashboard, C=Catálogo, D=Detalle, E=Tabla admin). La galería de historias **es** el arquetipo C de referencia, no una excepción. | La galería es la página con más calidad visual hoy. En lugar de "rescatarla", se adopta como estándar. |
| D-05 | **Inter es la única fuente**. Sin Outfit, sin fuentes de marca decorativas. | Decisión vigente, sin cambios. |
| D-06 | **No introducir gradientes ni glassmorphism en módulos alumno**. | `docs/sistema-visual-portal-alumno.md` ya lo prohíbe. El linter lo enforce. |
| D-07 | **DAEMONS = ámbar, XP = azul, éxito = verde, error = rojo.** Sin excepciones por módulo. | Hoy hay `#1f1f75`, `#00f2fe`, `#ffc414`, `#6c3fe8` como acentos locales. Esto se cierra. |
| D-08 | **No migrar módulos en bloque**. Una fase, un objetivo, un PR revertible. | Reduce riesgo y mantiene `npm run build` verde. |
| D-09 | **No actualizar Angular ni NG-ZORRO como parte del rediseño**. | El rediseño visual es independiente de la versión del framework. |
| D-10 | **El sidebar morado del alumno y la topbar compacta se preservan**. Sus IDs los usa el tour de onboarding. | Ya documentado en AGENTS.md y frontend-architecture.md. |

---

## 3. Estado del proyecto (resumen honesto)

**Lo que ya está bien (no tocar salvo que se rompa):**

- Tokens base en `src/styles.scss` (canvas, surface, ink, primary, success, warning).
- `tailwind.config.js` con paleta extendida (primary 50-950, accent 50-950, shadows).
- NG-ZORRO como librería de componentes. Overrides centralizados en `.daemon-btn`,
  `.daemon-surface`, `.student-premium` dentro de `src/styles/_components.scss`.
- 11 componentes compartidos en `src/app/shared/componentes/` (boton-accion,
  boton-volver, cargando, estado-vacio, floating-shape, header-banner,
  illustration-slot, media-uploader, moneda-daemon, tarjeta-resumen, ticket).
- 5 layouts en `src/app/core/layouts/` (alumno, docente, publico, tutor + sidebar).
- Validación de arquitectura en CI: `check:architecture.mjs` (shared no toca
  core/features, core no toca features).
- Sidebar y topbar del alumno, con IDs estables para el tour.
- `docs/sistema-visual-portal-alumno.md` y `docs/frontend-ui-standard.md` que
  describen la filosofía de producto.

**Lo que está mal y es lo que vamos a arreglar:**

1. **3 paletas conviviendo.** `styles.scss` define `--daemon-primary: #1677ff`,
   `tailwind.config.js` define `primary.900: #17243c`, `login.scss` usa
   `#15326b`, `panel-alumno.html` usa `bg-[#1f1f75]` y `text-[#00f2fe]`,
   `galeria-proyectos.scss` usa `linear-gradient(135deg, #6c3fe8, #4f2cc7)`.
   5 valores para el "azul primario" en un solo proyecto.
2. **Hex arbitrarios en templates.** `bg-[#1f1f75]`, `bg-[#ffc414]`,
   `text-[#00f2fe]`, `border-[#4f46e5]` aparecen en `panel-alumno.html` (9
   ocurrencias) y en otros lugares. Bypasean el theme de Tailwind.
3. **Gradientes donde no deben.** `panel-alumno.scss:94,108` y
   `galeria-proyectos.scss:213,1107` rompen la regla de "sin gradientes en
   módulos alumno".
4. **No hay primitivos reutilizables de page/chrome.** Cada feature reinventa
   su header: `store-hero`, `ranking-hero`, `student-hero-banner`, y
   `bg-white p-6 rounded-2xl shadow-sm border border-slate-100` aparece 4+
   veces con la misma intención.
5. **No hay enforcement automático.** Las reglas de "no hex hardcoded" y
   "no gradiente en alumno" están en prosa, no en código.
6. **El hero del panel-alumno contradice la regla de "sólido"** con
   `backdrop-blur-md` y `bg-[#1f1f75]/80`. Está marcado como "premium" en el
   código pero rompe la guía de "tarjetas blancas sólidas".

---

## 4. Cómo navegar este directorio

```
docs/sistema-diseno/
├── 00-resumen-ejecutivo.md   ← este archivo (decisiones + estado)
├── 01-auditoria-frontend.md  ← lo que encontré en la inspección
├── 02-inventario-paginas.md  ← 58 rutas mapeadas a arquetipos
├── 03-arquetipos.md          ← 5 arquetipos con su composición
├── 04-tokens-y-tema.md       ← mapa de tokens + Tailwind config
├── 05-recomendacion-stack.md ← por qué Opción C y no A ni B
├── 06-plan-fases.md          ← 5 fases con criterios de salida
└── 07-handoff-nuevo-agente.md ← qué hacer y qué NO hacer al empezar
```

**Orden de lectura si vienes de cero:** 00 → 01 → 03 → 04 → 06 → 07.

**Orden de lectura si vienes a implementar la Fase 1:** 00 → 04 → 06 → 07.

---

## 5. Reglas de oro que no se negocian

1. **No introduzcas un color nuevo sin justificación escrita.** Si necesitas
   uno, lo agregas a `styles.scss` como token y lo referencias desde
   `tailwind.config.js`. Si es solo para una feature, no se acepta.
2. **No uses `bg-[#hex]` en templates.** Usa el nombre del token
   (`bg-primary-600`, `bg-canvas`, `bg-surface`).
3. **No uses gradientes en `src/app/features/alumno/**` ni en
   `src/app/features/cuentos/**` salvo que esté justificado en este
   directorio.**
4. **No inventes un componente "compartido" si la feature es la única que lo
   usa.** El primitivo va en `shared/componentes/` solo cuando una segunda
   feature lo adopte.
5. **No subas el bundle inicial sin avisar.** El budget vigente es 1 MB
   (`angular.json` warning budget). Cualquier nuevo componente de más de
   20 kB va por lazy load.
6. **No cambies IDs del sidebar del alumno.** El tour de onboarding los usa.
7. **No uses `!important` salvo en overrides de NG-ZORRO** (donde
   `ant-tag` exige `!important` para su especificidad nativa).

---

## 6. Próximo paso concreto

Esperando la orden de Max para arrancar **Fase 1 — Cimientos**:

1. Mover los tokens de `styles.scss` a un nuevo `src/styles/_tokens.scss`.
2. Reemplazar los valores del `tailwind.config.js` por `var(--daemon-*)`.
3. Crear `scripts/check-style-tokens.mjs` y agregarlo a `test:ci`.
4. Definir el allowlist (qué archivos SÍ pueden tener hex).
5. PR con esos 4 cambios + este directorio de docs.

No tocar features todavía. No tocar SCSS de features todavía. Solo el
contrato de tokens y la herramienta que lo enforce.
