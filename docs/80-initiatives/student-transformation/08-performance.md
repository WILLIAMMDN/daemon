---
title: Paquete 8 — Rendimiento
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# Paquete 8 — Rendimiento

- Estado: budgets configurados; bundle bajo control; telemetría lista
- Fecha: 2026-08-03
- Rama: `refactor/student-production-hardening`

## Metas

- LCP ≤ 2.5 s; INP ≤ 200 ms; CLS ≤ 0.1 (percentil 75 con telemetría real).

## Controles implementados

- Budgets en `angular.json`: `initial ≤ 1 MB` (warning) / `1.5 MB` (error),
  `anyComponentStyle ≤ 32 kB` / `48 kB`.
- Lazy loading real: todas las páginas con `loadComponent`; los proveedores de
  Cuentos se registran **dentro de las rutas lazy** (no en `app.config.ts`)
  para no engordar el bundle inicial.
- Firestore paginado con cursores y límites; sin cargar colecciones completas
  ni ordenar en memoria.
- Quill solo en el editor; Chart.js y Rive solo donde se usan.
- Sentry con `browserTracingIntegration` y `tracesSampleRate` por entorno
  (sin PII; `sendDefaultPii: false`).

## Regla de bundle

El CI falla si el bundle inicial supera 1.5 MB. Cualquier advertencia nueva de
budget se trata como regresión a revisar, no se acepta por defecto.

## Riesgos pendientes

- Medición real antes/después con web-vitals en producción.
- Imágenes: declarar width/height y lazy loading en la galería.
- Estrategia offline del editor (SW existente; recuperación local ya cubre el
  borrador).
