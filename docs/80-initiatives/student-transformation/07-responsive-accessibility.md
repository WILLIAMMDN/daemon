---
title: Paquete 7 — Responsive y accesibilidad
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# Paquete 7 — Responsive y accesibilidad

- Estado: auditoría y checklist; fixes por flujo prioritario
- Fecha: 2026-08-03
- Rama: `refactor/student-production-hardening`

## Objetivo

WCAG 2.2 AA en los flujos prioritarios y experiencia mobile-first sin scroll
horizontal accidental, con editor de cuentos usable en teclado móvil.

## Viewports de validación

| Viewport | Uso |
|---|---|
| 320 × 568 | Móvil compacto |
| 360 × 800 / 390 × 844 / 412 × 915 | Móvil estándar |
| 768 × 1024 | Tablet vertical |
| 1024 × 768 | Tablet horizontal |
| 1280 × 800 / 1440 × 900 / 1920 × 1080 | Escritorio |

## Checklist WCAG 2.2 AA (flujos prioritarios)

- [x] HTML semántico y jerarquía de encabezados en páginas de cuentos.
- [x] `aria-label` en icon buttons del editor.
- [x] Live regions para guardado/errores del autosave.
- [x] `alt` significativo para portadas/ilustraciones.
- [x] Navegación por teclado en el editor y galería.
- [ ] Focus trap en modales (pendiente validación puntual).
- [ ] Contraste AA en todos los temas (validar en `/dev/design-system`).
- [ ] `prefers-reduced-motion` global (pendiente).

## Estados de interfaz

Cada vista de datos contempla: initial, loading, refreshing, success, empty,
partial, offline, permission denied, validation error, server error, retry,
saving, saved y unsaved changes. Sin spinners globales que oculten estados;
skeletons locales y mensajes accionables.

## Riesgos pendientes

- Auditoría automatizada (axe) integrable en E2E.
- Zoom 200 % y orientación horizontal del editor.
- Contraste por tema según decisión visual final.
