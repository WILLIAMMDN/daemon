# frontend-angular — Claude working notes

Angular 21 (standalone, signals, `ChangeDetectionStrategy.OnPush`), NG-ZORRO 21,
SCSS with design tokens in `src/styles/_tokens.scss`.

Conventions already in the repo:

- Feature folders: `src/app/features/<feature>/{pages,componentes,services,models}`.
- Component files are kebab-case triplets (`nombre.ts` / `nombre.html` / `nombre.scss`)
  and the class is PascalCase **without** a `Component` suffix.
- `shared/` must never import from `core/`. `features/` may import both.
- HTTP goes through `core/servicios/api.ts` (`Api`), which already does
  stale-while-revalidate caching, timeouts and `ApiError` classification.
- No hex colours outside `src/styles/_tokens.scss`.

## DAEMON ARC Student Experience — Mandatory UI Contract

Scope: everything under `/alumno` (features `alumno`, and the student-facing pages of
`misiones`, `evaluaciones`, `proyectos`, `cuentos`, `comunidad`, `ranking`, `competencia`,
`tienda`, `mascota`, `herramientas`, `laboratorio`, `certificados`).

Read this section again before starting each macro area.

### Canon

- Masterbrand **DAEMON**; authenticated student experience **DAEMON ARC**;
  gamification **DAEMON Pulse**; currency **Daems**.
- **XP** = player progression. **Mastery** = evidence-based academic learning state.
  **Daems** = virtual economy. These are three different things — never derive one
  from another and never render them as the same metric.
- Macro areas: `Inicio · Aprender · Crear · Comunidad · Agenda · Identidad`.

### Absolute visual prohibitions

Unless it exists in approved Figma, do **not** use: glassmorphism, `backdrop-filter`,
frosted/transparent glass cards, decorative / mesh / aurora gradients, neon glows,
glowing borders or dots, sparkles, floating particles, stars, blobs, orbital or
"futuristic" decoration, decorative dotted paths, fake 3D, cyberpunk or holographic
styling, mascots as filler, huge decorative numbers, fake charts / statistics /
analytics / progress / achievements / course data.

No "AI SaaS template". No "Dribbble dashboard concept". No decoration to fill space.

### Pills / capsules

`border-radius: 9999px` (and `rounded-full`) is **not** a default design language.
Pills are allowed only for genuinely compact semantics: status, filter, tag, small badge.
Never for page titles, eyebrows, navigation, large buttons, card shells, section
headings, metadata or decorative labels. Use clean structural geometry.

### Visual foundation

- DAEMON blue `#1455FF` → token `--arc-blue`.
- DAEMON green `#76CF1A` → token `--arc-green`, used strategically for
  active / progress / success / accent only. Never scattered.
- Content foundation: white surfaces, light neutral canvas, subtle structural borders,
  strong dark text. Solid colours. No glass, no decorative gradients.
- Do not introduce any other palette; consume `_tokens.scss`.

### Typography

Use the existing DAEMON typography (Onest / Geist). Do not add a font.
Hierarchy comes from size, weight, spacing and layout — not from a repeated
uppercase eyebrow + tiny blue heading + pill + subtitle above every title.
Editorial, clean, product-oriented.

### Structure first

Modules will be refined in Figma later. Priorities, in order: correct page structure,
routing, information hierarchy, spacing, responsive behaviour, real data integration,
loading / empty / error states, reusable primitives, accessibility, navigation
consistency. A clean structural page beats a visually elaborate generic one.

### NG-ZORRO is the primary UI mechanics library

Prefer `nz-layout, nz-breadcrumb, nz-tabs, nz-grid, nz-list, nz-table, nz-empty,
nz-skeleton, nz-result, nz-alert, nz-progress, nz-avatar, nz-badge, nz-dropdown,
nz-tooltip, nz-modal, nz-drawer, nz-pagination, nz-form, nz-input, nz-select,
nz-date-picker, nz-upload` over hand-rolled equivalents.

Rule: **NG-ZORRO = mechanics, semantics, interaction. DAEMON = composition, spacing,
hierarchy, visual identity.** Do not ship stock Ant Design admin UI.

### No card explosion

Card only for a genuinely self-contained object (course, project, event, activity,
achievement). Never cardify titles, navigation, single metrics, paragraphs, toolbars
or whole sections. No cards inside cards inside cards.

### No fake data

Never fabricate courses, enrollments, missions, XP, Daems, rankings, projects,
attendance, deadlines, sessions, teachers, progress, Mastery percentages or
achievements. Reuse the real API. When data is unavailable use an honest empty state
(`app-estado-vacio` / `nz-empty`, `nz-skeleton`, `nz-result`, `nz-alert`).
Never generate filler cards to make a screen look complete.

### Reuse before rewrite

Find the current implementation first. Prefer REUSE → MOVE → COMPOSE → ADAPT over
REWRITE. Never create `XxxNew`, `XxxV2`, `Dashboard2` to avoid understanding existing
code. Never delete a working feature because its navigation placement is wrong.

### Shared student foundation

`shared/componentes/arc-page`, `arc-local-nav`, `arc-section`, plus the existing
`estado-vacio`. Keep it small — only primitives used by several student areas.
A student page = title, optional short description, optional context, optional primary
action, local navigation, content. No decorative filler.

### Ownership boundary

`core/layouts/sidebar-portal/*` and `core/layouts/portal-sidebar.config.ts` are owned by
the sidebar workstream. Do not edit them from student-feature work; record required
navigation mappings in the PR description instead.

### Routing

Canonical macro routes: `/alumno`, `/alumno/aprender`, `/alumno/crear`,
`/alumno/comunidad`, `/alumno/agenda`, `/alumno/identidad`. Student feature routes live
in `features/alumno/alumno.routes.ts` and per-area route files. Pages must be
deep-linkable and reload-safe. Legacy `/alumno/*` URLs must keep working — use aliases
or redirects, never break route params, never create redirect loops.

### Responsive

Must be structurally correct at 1440 / 1280 / 1024 / 834 / 430 / 390:
no horizontal overflow, usable mobile local nav, correct hierarchy and stacking.

### Accessibility

Semantic HTML. Links are links, buttons are buttons, no clickable `div`s.
Local navigation is a `<nav>` of `<a routerLink>` and is keyboard operable.
Visible focus. Correct heading order (one `h1` per page).
