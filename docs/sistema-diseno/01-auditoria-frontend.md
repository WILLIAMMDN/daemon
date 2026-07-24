# Auditoría del frontend DAEMON

> **Inspección del 2026-07-20.** 25 archivos leídos a fondo, 58 rutas
> inferidas, 6 documentos de plataforma consultados.

## 1. Stack detectado

| Capa | Tecnología | Versión | Evidencia |
|---|---|---|---|
| Framework | Angular | 21.2.18 | `frontend-angular/package.json` |
| Detector de cambios | Zoneless | — | `app.config.ts:18` `provideZonelessChangeDetection()` |
| Componentes | NG-ZORRO | 21.3.2 | `package.json` + `docs/frontend-ui-standard.md` |
| Utilidades CSS | Tailwind | 3.4.19 | `package.json` + `styles.scss:1-3` |
| Helpers de variant | CVA | 0.7.0 | `package.json` (casi no usado todavía) |
| Clases | clsx + tailwind-merge | 2.1.1 + 3.5.0 | `package.json` (casi no usado) |
| HTTP | HttpClient + token interceptor | — | `app.config.ts:27` |
| Animación | Rive canvas | 2.38.2 | `package.json` |
| Charts | Chart.js + ng2-charts | 4.5.1 + 10.0.0 | `package.json` |
| Editor | Quill + ngx-quill | 2.0.3 + 31.0.1 | `package.json` |
| Tour | Driver.js | 1.6.0 | `package.json` + `_gamification.scss` |
| Spinner | ngx-spinner | 21.1.0 | `app.html:13-21` |
| Iconos | FontAwesome Solid + Brands | 7.x | usado masivamente en templates |
| Tests | Jest + Playwright | 30.4 + 1.42 | `package.json` scripts |
| Tipografía | Inter | — | `tailwind.config.js`, `styles.scss`, todos los SCSS |
| Locales | es-PE | — | `app.config.ts:7,20` `provideNzI18n(es_ES)` |
| Sentry | 10.65 | — | declarado en deps, no verificado en runtime |

## 2. Estructura de carpetas (frontend-angular/src)

```text
app/
├── app.config.ts          ← providers globales
├── app.html / .scss / .ts ← shell mínimo: progress bar + router-outlet + spinner
├── app.routes.ts          ← 58 rutas, todas con lazy loadComponent
├── core/
│   ├── componentes/       ← email-verification-banner (único)
│   ├── dominio/           ← nivel-alumno.ts, tema-portal-alumno.ts
│   ├── guards/            ← auth, alumno, docente, tutor (4 guards)
│   ├── interceptores/     ← token-interceptor (Sanctum bearer)
│   ├── layouts/           ← footer, header, layout-{alumno,docente,publico,tutor},
│   │                        sidebar-portal, topbar-alumno, portal-sidebar.config.ts
│   └── servicios/         ← 14 servicios: api, autenticacion, firebase-auth,
│                            sesion, carga-global, keep-alive, navegacion-app,
│                            notificaciones, ollama-local, tour, etc.
├── features/              ← 19 features independientes
│   ├── alumno/            ← panel, perfil, editar-perfil, recursos
│   ├── autenticacion/     ← login, login-docente, registro, bienvenida, recuperar,
│   │                        restablecer, verificar-correo
│   ├── certificados/      ← certificado, imprimir-carnet
│   ├── chatbot/           ← chatbot-alumno, crear-bot
│   ├── compartido/        ← notificaciones (compartido entre alumno y docente)
│   ├── competencia/       ← votar, tv, competencia-control
│   ├── comunidad/         ← comunidad
│   ├── cuentos/           ← galeria-proyectos, crear-cuento, ver-cuento
│   ├── docente/           ← panel, perfil, lista-alumnos, gestionar-aulas,
│   │                        gestionar-curriculo, gestionar-misiones,
│   │                        herramientas-clase, gestionar-insignias,
│   │                        gestionar-tienda, gestionar-evaluacion,
│   │                        ver-resultados, competencia-control,
│   │                        historial-rondas, historial-tokens
│   ├── evaluaciones/      ← examen-live, resultados-examen, gestionar-evaluacion, ver-resultados
│   ├── familias/          ← acceso-familias, panel-familias
│   ├── herramientas/      ← herramientas
│   ├── laboratorio/       ← lab-ia, neuro-maze, defensa-ia, entrenamiento-mascota
│   ├── mascota/           ← vestidor-mascota
│   ├── misiones/          ← lista-misiones, detalle-mision, entregar-mision
│   ├── proyectos/         ← proyectos (hub)
│   ├── publico/           ← inicio (landing)
│   ├── ranking/           ← ranking
│   └── tienda/            ← tienda-alumno, mis-canjes
└── shared/                ← componentes, directivas, validadores
    ├── componentes/       ← 11 piezas (ver §3)
    ├── directivas/        ← image-fallback.directive.ts
    └── validadores/       ← auth-validadores.ts

styles/
├── styles.scss            ← entry point; carga Tailwind + importa 4 parciales
├── _layout.scss           ← 314 líneas; .page, .panel, .module-shell, .btn, .badge
├── _components.scss       ← 322 líneas; overrides NG-ZORRO + .student-premium
├── _gamification.scss     ← Driver.js + skeleton + token-icon
└── _popovers.scss         ← 910 líneas; popovers del CDK overlay (perfil, notificaciones)
```

## 3. Componentes compartidos vigentes (en `shared/componentes/`)

| Componente | Selector | Estado | Notas |
|---|---|---|---|
| `boton-accion` | `app-boton-accion` | listo | Tipos: actualizar, crear, editar, eliminar. Usado en docente. |
| `boton-volver` | `app-boton-volver` | listo | Volver a la ruta anterior. |
| `cargando` | `app-cargando` | listo | Skeleton con tipos: dashboard, lista, página. |
| `estado-vacio` | `app-estado-vacio` | listo | Recibe `titulo`, `descripcion`, slot de acción. Tamano `compact` / default. |
| `floating-shape` | `app-floating-shape` | revisar | Forma decorativa. Usar con jerarquía. |
| `header-banner` | `app-header-banner` | listo | `[bgImage]` + `[artImage]` + slot de contenido. Base del arquetipo C. |
| `illustration-slot` | `app-illustration-slot` | revisar | Slot con fallback. |
| `media-uploader` | `app-media-uploader` | listo | Subida de archivos con preview. |
| `moneda-daemon` | `app-moneda-daemon` | listo | `[cantidad]` y `[size]`. Usar siempre que se muestre saldo. |
| `tarjeta-resumen` | `app-tarjeta-resumen` | revisar | Tarjeta resumen con título, valor, hint. |
| `ticket` | `app-ticket` | revisar | Comprobante de canje. |

**Acción de Fase 2:** auditar los "revisar" para decidir si se quedan, se renombran o se reemplazan por primitivos nuevos (page-container, page-header, stat-card, hero-band).

## 4. Estructura del CSS global

```text
styles.scss
├── @tailwind base;          ← reset de Tailwind
├── @tailwind components;     ← componentes de Tailwind
├── @tailwind utilities;      ← utilidades de Tailwind
├── @import './styles/layout';
├── @import './styles/components';
├── @import './styles/popovers';
├── @import './styles/gamification';
├── @layer base {
│   └── :root {
│       --daemon-canvas: #f4f7fb;
│       --daemon-surface: #ffffff;
│       --daemon-surface-muted: #f8fafc;
│       --daemon-border: #e4eaf2;
│       --daemon-ink: #172033;
│       --daemon-muted: #667085;
│       --daemon-primary: #1677ff;
│       --daemon-primary-dark: #0958d9;
│       --daemon-success: #12a150;
│       --daemon-warning: #f5a000;
│   }
│   html { background: var(--daemon-canvas); color: var(--daemon-ink); ... }
│   body { background: var(--daemon-canvas); color: var(--daemon-ink); ... }
│   h1-h6 { font-family: Inter; ... letter-spacing: -.025em; }
│ }
├── @layer utilities {
│   ├── .hover-premium   ← @apply shadow-sm transition-shadow hover:shadow-md
│   ├── .card-premium    ← @apply rounded-2xl border border-slate-200 bg-white shadow-sm
│   ├── .daemon-glass    ← @apply border border-slate-200 bg-white shadow-sm
│   ├── .daemon-bento    ← @apply rounded-2xl border ... shadow-sm hover:shadow-md
│   └── .text-gradient-daemon
│ }
├── @import 'quill/dist/quill.snow.css';
└── @media (prefers-reduced-motion: reduce) { ... }
```

## 5. Tailwind config (resumen)

Archivo: `frontend-angular/tailwind.config.js`

```js
theme.extend.colors = {
  daemon: { ink, canvas, electric, indigo, purple, gold, mint },
  primary: { DEFAULT, 50-950 },   // escala completa basada en #17243c
  accent: { DEFAULT, 50-950 },    // escala completa basada en #ffc414
  success, danger, warning, background, surface,
}
theme.extend.boxShadow = {
  sm, md, lg, xl, soft, popover, premium, premium-hover, bento, bento-hover, glass
}
theme.extend.borderRadius = { '4xl': '2rem', '5xl': '2.5rem' }
theme.extend.fontFamily = { sans, heading: ambos Inter }
```

**Problema:** los nombres de tokens del theme de Tailwind (primary, accent) NO
referencian los CSS Custom Properties. Si cambias `--daemon-primary` en
`styles.scss`, el `primary.DEFAULT` de Tailwind no se entera.

**Solución (Fase 1):** reemplazar los hex del config por `var(--daemon-*)`.

## 6. Auditoría de disciplina (grep evidencia)

Comandos ejecutados el 2026-07-20:

```powershell
# Hex hardcoded en templates de features
rg -n "#[0-9a-fA-F]{6}" frontend-angular/src/app/features/alumno/pages/panel-alumno/panel-alumno.html
# → 9 coincidencias: bg-[#1f1f75], text-[#00f2fe], bg-[#ffc414], etc.

# Gradientes en SCSS de features
rg -n "linear-gradient|radial-gradient" frontend-angular/src/app/features/alumno/pages/panel-alumno/
# → 2 coincidencias en panel-alumno.scss (líneas 94, 108)

rg -n "linear-gradient|radial-gradient" frontend-angular/src/app/features/cuentos/pages/galeria-proyectos/
# → 2 coincidencias en galeria-proyectos.scss (líneas 213, 1107)

# Style inline con hex
rg -n 'style="[^"]*#[0-9a-fA-F]{3,8}' frontend-angular/src/app/features/autenticacion/pages/login/login.html
# → 1 coincidencia (línea 98)

# Outfit (debe ser 0)
rg -n "Outfit" frontend-angular/src/app/features/
# → 0 coincidencias ✓
```

**Resumen numérico de la auditoría:**

| Métrica | Valor |
|---|---|
| Hex hardcoded en `panel-alumno.html` | 9 |
| `linear-gradient` en módulo alumno | 2 |
| `linear-gradient` en galería (cuentos) | 2 |
| `backdrop-blur` en módulo alumno | 2 |
| Style inline con hex | 1 (login) |
| Componentes con `Outfit` | 0 ✓ |
| Estilos `:host` con `!important` fuera de overrides NG-ZORRO | 0 ✓ |
| Specs TS por archivo | ~20% (25/131) |
| e2e tests | 7 (auth, chatbot-ia, tienda, comunidad, misiones, alumno + base) |

## 7. Archivos críticos identificados

**Los 6 archivos que másimpacto tienen en el sistema visual actual** (cualquier
cambio aquí se propaga a 5+ páginas):

1. `src/styles.scss` — tokens y reset.
2. `src/styles/_components.scss` — overrides NG-ZORRO + `.student-premium`.
3. `src/styles/_popovers.scss` — popovers que escapan al CDK overlay.
4. `tailwind.config.js` — tema base de Tailwind.
5. `src/app/core/layouts/portal-sidebar.config.ts` — navegación de alumno y docente.
6. `src/app/core/dominio/tema-portal-alumno.ts` — colores por nivel (KIDS/TEENS).

**Los 4 archivos que más deuda técnica visual tienen:**

1. `src/app/features/alumno/pages/panel-alumno/panel-alumno.html` — 286
   líneas con hex arbitrarios y 4 secciones reescritas con la misma
   estructura `.daemon-bento`.
2. `src/app/features/cuentos/pages/galeria-proyectos/galeria-proyectos.scss` —
   1100+ líneas SCSS, la más rica pero la más divergente del sistema.
3. `src/styles/_layout.scss` — 314 líneas, valores que no se usan en
   producción pero quedaron de una iteración anterior.
4. `src/app/features/autenticacion/pages/login/login.scss` — paleta local
   `#15326b` que no matchea con `--daemon-primary`.

## 8. Conclusión

DAEMON tiene 80% de las piezas y 0% del sistema. La auditoría revela
**exactamente** lo que el equipo de producto sospechaba: la documentación
existe, los tokens existen, los componentes existen, pero **no hay
fuente única ejecutable**. El objetivo de las fases siguientes es
construir esa fuente única sin tocar la lógica de negocio.
