# DAEMON frontend UI standard

This is the working UI direction for the Angular frontend.

## Decision

DAEMON uses **NG-ZORRO** as the main open-source Angular component library for
new professional interface work.

The app is still a school product for children and teenagers, so NG-ZORRO must
not be used as a plain corporate skin. The rule is:

```text
NG-ZORRO structure + DAEMON identity
```

Use NG-ZORRO for complex, reliable UI behavior. Use DAEMON styles for tone,
color, spacing, illustrations, academy personality, and student-friendly
presentation.

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

- Keep layouts calm and readable, but add warmth through color, icons, motion,
  badges, avatars, and progress states.
- Prefer short labels and clear actions.
- Avoid dense enterprise tables unless the student genuinely needs them.
- Use microcopy that feels encouraging without being childish.
- Keep contrast high and controls easy to tap on mobile.

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

## Current compatibility

The project uses Angular 21. NG-ZORRO `21.3.2` declares Angular `^21.0.0` peer
dependencies and is installed in `frontend-angular/package.json`.
