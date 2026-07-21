# Arquetipos de página

> 5 arquetipos cubren las 58 rutas. La galería de historias **es** el
> arquetipo C de referencia (no una excepción).

## Cómo se lee este documento

Cada arquetipo define:

- **Qué páginas lo usan** (rutas concretas).
- **Composición** (qué bloques hay y en qué orden).
- **Tokens dominantes** (qué colores/tamaños se usan).
- **Componentes reutilizables** (qué primitivos lo materializan).
- **NO** lista (qué no debe tener esta página).

Los primitivos se crean en la Fase 2. Mientras no existan, los nombres
en cursiva indican el "componente ideal" que se invocará.

---

## Arquetipo A — Auth & Onboarding

**Páginas:** `/login`, `/login-docente`, `/registro`, `/recuperar-clave`,
`/restablecer-clave`, `/verificar-correo`, `/bienvenida`,
`/familias/acceso`.

### Composición

```
┌─────────────────────────────────────────────┐
│  [home-link]                                │  ← posición absoluta, top-left
│                                             │
│         [logo]                              │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │▌ eyebrow  |  portal-switch         │    │  ← card-accent 5px superior sólido
│  ├────────────────────────────────────┤    │
│  │                                    │    │
│  │  [mascot/medallón opcional]        │    │
│  │                                    │    │
│  │  [form]                            │    │
│  │   - classic-field con icono lateral │    │
│  │   - field-error si aplica          │    │
│  │   - submit-button full-width       │    │
│  │                                    │    │
│  │  [oauth divider + button]          │    │
│  │                                    │    │
│  │  [footer con link a registro]      │    │
│  └────────────────────────────────────┘    │
│                                             │
│  [login-note: ayuda contextual]             │
└─────────────────────────────────────────────┘
```

### Tokens dominantes

- **Canvas:** `--daemon-canvas` (`#f4f7fb`).
- **Card:** blanco puro, radio 6px en login actual, migrar a 14px (token `--daemon-radius-card`).
- **Acento superior del card:** azul institucional profundo. Hoy `#15326b` (login.scss); debe pasar a `var(--daemon-primary-dark, #0958d9)` en Fase 3.
- **Borde:** `--daemon-border` (`#e4eaf2`).

### Componentes

- *Primitivo* `auth-card` (Fase 2) — wrapper con accent + slot para form.
- *Primitivo* `classic-field` (Fase 2) — input con icono lateral + acción derecha.
- `app-cargando` si la pantalla es solo formulario (no skeleton en sí).
- `app-estado-vacio` solo si hay resultado de búsqueda (no aplica en login).

### NO

- No gamificación visible (sin DAEMONS, sin XP, sin monstruo).
- No sidebar.
- No gradientes.
- No emojis decorativos fuera del medallón.

---

## Arquetipo B — Dashboard / Hub de cuenta

**Páginas:** `/alumno`, `/docente`, `/familias`.

### Composición

```
┌──────────┬────────────────────────────────────────────┐
│          │ [topbar compacta: nivel + tokens + perfil] │
│          ├────────────────────────────────────────────┤
│  [side-  │                                            │
│   bar]   │  [hero-band: identidad + monstruo/avatar]  │
│          │   - kicker + título + descripción + CTAs   │
│          │   - indicador de progreso (XP/nivel)       │
│          │                                            │
│          ├────────────────────────────────────────────┤
│          │  [stats-grid: 4 stat-cards]                │
│          │   - XP | DAEMONS | Misiones | Ranking      │
│          │                                            │
│          ├────────────────────────────────────────────┤
│          │  [priority-grid 8/4]                       │
│          │   - col 8: próximo paso / ruta de hoy      │
│          │   - col 4: actividad reciente / racha      │
│          │                                            │
│          └────────────────────────────────────────────┘
└──────────┴────────────────────────────────────────────┘
```

### Tokens dominantes

- **Canvas:** `--daemon-canvas`.
- **Hero-band:** blanco con sombra premium (`shadow-premium`). En el alumno,
  puede tener un acento azul de borde-superior 4px (no gradiente, no glass).
- **Stat-card protagonista (ranking):** fondo sólido color (azul/verde/púrpura)
  con texto blanco. Solo UNA stat-card de las 4 puede ser protagonista.
- **Las otras 3 stat-cards:** fondo blanco, borde `--daemon-border`, icono de
  acento a la izquierda de la cifra.

### Componentes

- `layout-alumno`, `layout-docente`, `layout-tutor` (existente).
- *Primitivo* `hero-band` (Fase 2) — slots: kicker, title, description, actions, art.
- *Primitivo* `stat-card` (Fase 2) — props: label, value, icon, tone, hint, protagonist.
- *Primitivo* `priority-card` (Fase 2) — header + body + footer slots.

### NO

- No gradientes en el hero.
- No glassmorphism.
- No más de 1 stat-card protagonista por grid.
- No ilustraciones compitiendo con el monstruo/avatar del usuario.

### Variante B' (Dashboard tutor / docente)

Misma composición pero:

- sidebar en tono violeta/cyan (configurado en `portal-sidebar.config.ts`).
- stat-card protagonista en lugar del ranking, según el portal.
- copy más institucional, menos celebratorio.

---

## Arquetipo C — Catálogo / Exploración  ← **La galería de historias es la referencia**

**Páginas:** `/alumno/proyectos/cuentos` (referencia), `/alumno/misiones`,
`/alumno/tienda`, `/alumno/recursos`, `/alumno/herramientas`,
`/alumno/mascota`, `/alumno/proyectos`, `/alumno/comunidad`,
`/alumno/ranking` (mixto C+D), `/docente/insignias`.

### Composición (basada en `galeria-proyectos`)

```
┌──────────┬────────────────────────────────────────────┐
│          │ [topbar]                                   │
│  [side-  ├────────────────────────────────────────────┤
│   bar]   │                                            │
│          │  [header-banner]                           │
│          │   - bgImage: ilustración contextual        │
│          │   - artImage: mascota/elemento flotante    │
│          │   - slot: tag + título + descripción       │
│          │   - slot: actions (crear, navegar)         │
│          │                                            │
│          ├────────────────────────────────────────────┤
│          │  [story-toolbar: filtros + orden + search] │
│          │                                            │
│          ├─────────────────────┬──────────────────────┤
│          │  [story-grid]        │  [story-aside]      │
│          │   - card con cover   │   - progreso        │
│          │   - título, autor    │   - inspiración     │
│          │   - acciones         │   - plantillas      │
│          │                      │   - cita del día    │
│          │  [FAB en móvil]      │                      │
│          │  [bottom-sheet]      │                      │
│          │                      │                      │
│          └─────────────────────┴──────────────────────┘
```

### Desktop vs móvil

| Elemento | Desktop ≥ 1024px | Tablet 700-1023px | Móvil < 700px |
|---|---|---|---|
| Aside lateral | Visible a la derecha, 360px | Oculto, FAB visible | Oculto, FAB visible |
| FAB | Oculto | Bottom-right, 56x56 | Bottom-right, 56x56 |
| Bottom sheet | No aplica | Tap en FAB abre sheet | Tap en FAB abre sheet |
| Grid columns | 3-4 según contenido | 2-3 | 1-2 |
| Toolbar | Horizontal: filtros | filtros + search en línea | filtros colapsables, search en segunda línea |

### Tokens dominantes

- **Header-banner bgImage:** ilustración con overlay semitransparente del
  `--daemon-primary` (no gradiente violeta personalizado). Se calcula con
  `color-mix(in srgb, var(--daemon-primary) 70%, transparent)` o
  `rgba(0, 0, 0, 0.3)` según la imagen.
- **Tarjetas:** blanco, borde `--daemon-border`, radio 14-16px (token), sombra
  `shadow-soft` en reposo, `shadow-popover` en hover.
- **CTA primaria:** `daemon-btn ant-btn-primary` (override NG-ZORRO existente).
- **CTA secundaria:** borde `--daemon-border`, fondo blanco, texto
  `--daemon-primary`.
- **Aside:** fondo `--daemon-surface-muted` o blanco con sombra lateral.

### Componentes

- `app-header-banner` (existente — base del hero).
- *Primitivo* `catalog-toolbar` (Fase 2) — filtros + orden + búsqueda.
- *Primitivo* `catalog-card` (Fase 2) — cover + body + footer slots.
- *Primitivo* `catalog-aside` (Fase 2) — slot apilable con header sticky.
- *Primitivo* `bottom-sheet` (Fase 2) — sheet móvil con FAB toggle.
- `app-estado-vacio` para casos vacío / no-results.

### NO

- No gradientes personalizados por feature. Si necesitas un acento visual,
  usa el color del módulo (KIDS = cyan, TEENS = azul, docente = cyan/violeta).
- No inventar un patrón nuevo de toolbar. El toolbar es el mismo para
  misiones, tienda, comunidad, recursos.
- No cambiar la composición del grid a 5 columnas (rompe el responsive).

### Variantes (mismas reglas, distinta materia)

- **C-Cuentos** (galería): header-banner con arte, cover en tarjeta, aside con
  progreso + inspiración + plantillas.
- **C-Misiones:** header compacto (kicker + título + contador), grid de
  tarjetas planas (sin cover grande), sin aside, sin FAB.
- **C-Tienda:** header con balance-vault (saldo grande + monedero visual),
  grid de premios con precio DAEMONS, sin aside.
- **C-Comunidad:** header compacto, grid de avatares, sin aside.

---

## Arquetipo D — Detalle / Vista de profundidad

**Páginas:** `/alumno/misiones/:id`, `/alumno/misiones/:id/entregar`,
`/alumno/proyectos/cuentos/:id`, `/alumno/proyectos/cuentos/crear`,
`/alumno/perfil`, `/alumno/perfil/editar`, `/alumno/resultados`,
`/alumno/notificaciones`, `/alumno/canjes`, `/alumno/certificado`,
`/alumno/comunidad/perfil/:id`, `/alumno/evaluaciones`,
`/alumno/competencia`, `/alumno/herramientas/chatbot`,
`/alumno/herramientas/bot`, `/alumno/herramientas/laboratorio`,
`/alumno/herramientas/neuro-maze` (variante inmersiva),
`/alumno/herramientas/defensa-ia` (variante inmersiva),
`/alumno/herramientas/entrenamiento` (variante inmersiva),
`/docente/perfil`, `/docente/notificaciones`.

### Composición (estándar)

```
┌──────────┬────────────────────────────────────────────┐
│          │ [topbar]                                   │
│  [side-  ├────────────────────────────────────────────┤
│   bar]   │                                            │
│          │  [< volver]                                │
│          │  [page-header]                             │
│          │   - kicker | título | estado | acciones    │
│          │   - descripción corta                      │
│          │                                            │
│          ├────────────────────────────────────────────┤
│          │                                            │
│          │  [contenido principal]                     │
│          │   - varía según el módulo                  │
│          │   - cards, form, lectura, juego, chat      │
│          │                                            │
│          │                                            │
│          ├────────────────────────────────────────────┤
│          │  [footer de acciones secundarias]          │
│          └────────────────────────────────────────────┘
```

### Variantes

- **D-Formulario:** contenido es un `nz-form` o equivalente, con grid 2 col en
  desktop, 1 col en móvil. Acciones al pie: cancelar + guardar.
- **D-Inmersivo (cuento, juego):** oculta sidebar, oculta topbar, contenido
  full-width. Mantiene botón "salir" flotante.
- **D-Chat (chatbot):** header con avatar del bot + nombre + estado, scroll
  invertido, input fijo al pie, modal de confirmación para acciones
  destructivas.
- **D-Historial (canjes, resultados):** lista cronológica + filtros laterales
  compactos.

### Tokens dominantes

- **Page-header:** blanco, borde inferior `--daemon-border`, padding
  `clamp(1rem, 2vw, 1.5rem)`.
- **Boton volver:** existente, usa `--daemon-muted` para texto.
- **Contenido principal:** canvas o blanco según variante.

### Componentes

- `app-boton-volver` (existente).
- *Primitivo* `page-header` (Fase 2) — slots: kicker, title, state, actions.
- *Primitivo* `form-page` (Fase 2) — grid 2-col responsive + footer de acciones.
- `nz-form`, `nz-input`, `nz-select` (NG-ZORRO) para formularios.
- `app-estado-vacio` si el contenido está vacío.

### NO

- No mostrar sidebar con conteos irrelevantes (ej. "X misiones" en
  `/alumno/certificado`).
- No superponer header con sticky topbar (scroll-padding-top ya está
  configurado a 80px en `styles.scss:30`).

---

## Arquetipo E — Tabla administrativa

**Páginas:** `/docente/alumnos`, `/docente/aulas`, `/docente/curriculo`,
`/docente/misiones`, `/docente/entregas`, `/docente/insignias`,
`/docente/tienda`, `/docente/evaluaciones`, `/docente/evaluaciones/resultados`,
`/docente/competencia`, `/docente/rondas`, `/docente/tokens`.

### Composición

```
┌──────────┬────────────────────────────────────────────┐
│          │ [topbar]                                   │
│  [side-  ├────────────────────────────────────────────┤
│   bar   │  [page-header compacto]                    │
│   cian/  │   - kicker | título | acciones primarias   │
│   viol.] │                                            │
│          ├────────────────────────────────────────────┤
│          │  [alerts: success/error]                   │
│          │                                            │
│          ├────────────────────────────────────────────┤
│          │  [tabla]                                  │
│          │   - card blanca con border                │
│          │   - thead gris claro (slate-50)            │
│          │   - filas hover slate-50                   │
│          │   - paginación al pie                      │
│          │                                            │
│          └────────────────────────────────────────────┘
```

### Tokens dominantes

- **Page-header:** fondo blanco, padding compacto, acciones a la derecha.
- **Tabla:** `nz-table` con overrides propios (no acepta estilos globales
  arbitrarios — `nz-table` tiene especificidad alta).
- **Modal de crear/editar:** `nz-modal` con contenido en grid 2-col.
- **Acciones por fila:** `app-boton-accion` (existente) con tipos:
  `editar | eliminar | ver | descargar`.

### Componentes

- `nz-table`, `nz-modal`, `nz-tag`, `nz-form`, `nz-input`, `nz-select`.
- `app-boton-accion` (existente).
- `app-cargando` mientras carga.
- `app-estado-vacio` cuando no hay datos.

### NO

- No ilustraciones ni hero-band. Esto es densidad administrativa.
- No gradientes.
- No sombras pronunciadas en las filas.
- No CTA flotante.
- No más de 1 modal anidado.

### Variante E-Control (competencia)

- Header con countdown visible.
- Acciones grandes centradas (iniciar ronda, cerrar, premiar).
- Sin tabla: lista vertical de candidatos con `nz-radio`.

### Variante E-Auditoría (tokens)

- Tabla sin acciones por fila (solo lectura).
- Filtros laterales con `nz-date-picker` + `nz-select`.
- Export a CSV como acción primaria.

---

## Decisión de Fase 3 — los 3 pilotos

| Piloto | Arquetipo | Por qué este |
|---|---|---|
| 1. `/alumno/proyectos/cuentos` | C (Galería) | Es el C de referencia. Si la migración del C falla aquí, falla en todas las features de catálogo. |
| 2. `/docente/misiones` | E | Mide densidad administrativa. Si la tabla + modal sobrevive, sobrevive todo el portal docente. |
| 3. `/alumno/misiones/:id` | D | El arquetipo más estándar. Valida que `page-header` + contenido libre sirve para el 80% de las páginas de detalle. |

Si los 3 pilotos compilan, pasan axe y se ven consistentes, las Fases 4-5 son ejecución.
