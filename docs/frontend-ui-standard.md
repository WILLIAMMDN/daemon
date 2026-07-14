# DAEMON frontend UI standard

This is the working UI direction for the Angular frontend. The detailed visual
rules for the student portal live in `docs/sistema-visual-portal-alumno.md`.

## Decision

DAEMON uses **NG-ZORRO** as the main open-source Angular component library for
new professional interface work.

The app is still a school product for children and teenagers, so NG-ZORRO must
not be used as a plain corporate skin. The rule is:

```text
NG-ZORRO structure + DAEMON identity
```

Use NG-ZORRO for complex, reliable UI behavior. Use DAEMON styles for tone,
color, spacing, academy personality, and student-friendly presentation. The
library must never be visible as an unmodified administrative template.

## Current student portal direction

The active student portal uses a solid educational product language:

- Inter is the only UI font.
- The canvas is `#f4f7fb` and cards are white.
- Blue `#1677ff` is the main action and progress color.
- Green communicates successful states.
- Amber is reserved for DAEMONS and balance-related feedback.
- Cards use light borders, 12-16 px radii and restrained shadows.
- The header is compact and separates XP progress from DAEMONS balance.
- The existing purple sidebar remains the navigation identity.
- Main student modules do not use visual gradients.

This direction replaced the earlier experimental Bento/glass approach. Do not
restore oversized rounded cards, neon gradients, floating glass headers or
decorative pseudo-3D objects without an explicit product decision.

## When to use NG-ZORRO

Use NG-ZORRO first for:

- Tables, filters, pagination, sorting, empty states.
- Forms, validation messages, selects, date pickers, uploads.
- Modals, drawers, notifications, confirmations.
- Tabs, steps, breadcrumbs, menus, collapses.
- Admin/teacher workflows where scanability and repeated use matter.

The first applied component set is:

- `NzButtonModule` for portal actions, refresh buttons, form submits, retry
  actions, and internal CTA links.
- `NzAlertModule` for success and error feedback returned by the API.
- `NzEmptyModule` through `app-estado-vacio` for professional empty states.
- `NzTagModule` for levels, categories, and status labels.

Use custom DAEMON components first for:

- Public landing sections and branded hero areas.
- Student mission/game moments.
- Mascots, illustrations, celebratory states, token/reward visuals.
- Highly branded academy cards where NG-ZORRO would feel too generic.

## Children and teenagers

For student-facing screens:

- Keep layouts calm and readable. Add warmth through controlled color, icons,
  badges, avatars and progress states.
- Prefer short labels and clear actions.
- Avoid dense enterprise tables unless the student genuinely needs them.
- Use microcopy that feels encouraging without being childish.
- Keep contrast high and controls easy to tap on mobile.
- Use motion only as feedback; never as permanent decoration.

For teacher-facing screens:

- Prioritize dense but clean information.
- Use NG-ZORRO tables, filters, modals, drawers, and segmented workflows.
- Keep DAEMON colors and sidebar identity so the teacher and student portals
  still feel like one platform.

## Import strategy

Do not import the full NG-ZORRO stylesheet by default. It is large.

The app imports only:

```text
node_modules/ng-zorro-antd/style/index.min.css
```

When a feature starts using a NG-ZORRO component, add only that component style
in `angular.json`, for example:

```text
node_modules/ng-zorro-antd/button/style/index.min.css
node_modules/ng-zorro-antd/table/style/index.min.css
```

Then import the Angular module in the standalone component that needs it.

For student portal cards and buttons, use the shared overrides below
`.student-premium` in `frontend-angular/src/styles/_components.scss`. Feature
styles may add local layout rules, but should not redefine the whole palette.

## Current compatibility

The project uses Angular 21. NG-ZORRO `21.3.2` declares Angular `^21.0.0` peer
dependencies and is installed in `frontend-angular/package.json`.

## Review checklist

Before accepting a new student-facing screen:

- Does it use the shared canvas, surface, border and primary tokens?
- Does XP remain visually distinct from DAEMONS?
- Does the layout work at 390 px width?
- Are primary actions blue and statuses semantically colored?
- Are missing images handled with a deliberate fallback?
- Does it preserve sidebar IDs used by the onboarding tour?
- Does it look like the same product as panel, perfil, misiones and tienda?
