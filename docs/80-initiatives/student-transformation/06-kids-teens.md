---
title: Paquete 6 — Experiencia KIDS / TEENS configurable
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# Paquete 6 — Experiencia KIDS / TEENS configurable

- Estado: contrato de dominio implementado; migración visual por fases
- Fecha: 2026-08-03
- Rama: `refactor/student-production-hardening`

## Objetivo

Una sola aplicación, una sola base funcional compartida y una capa de
experiencia configurable por audiencia. Sin duplicar páginas, servicios,
modelos ni componentes completos para cambiar colores (ADR-005).

## Contrato

`core/dominio/perfil-experiencia-estudiante.ts` define:

```ts
interface PerfilExperienciaEstudiante {
  audiencia: 'kids' | 'teens';
  tema: 'kids' | 'teens';
  densidad: 'comoda' | 'estandar';
  navegacion: 'guiada' | 'autonoma';
  nivelAsistencia: 'alto' | 'medio';
  frecuenciaIlustracion: 'alta' | 'selectiva';
  movimiento: 'expresivo' | 'sutil';
  tonoContenido: 'infantil-claro' | 'juvenil-directo';
}
```

- `PERFILES_EXPERIENCIA` contiene los dos perfiles prefijados.
- `perfilParaNivel(nivel)` mapea desde `NivelAlumno` (KIDS → perfil kids,
  TEENS → perfil teens) manteniendo compatibilidad con `nivel-alumno.ts` y
  `tema-portal-alumno.ts` (clases `theme-kids` / `theme-teens`).

## Reglas de uso

- La experiencia se resuelve con tokens, configuración y variantes; no con
  templates llenos de `@if (esKids())`.
- KIDS: navegación guiada, menor densidad, controles grandes, mayor feedback
  visual, ilustraciones contextualizadas, lenguaje claro.
- TEENS: navegación autónoma, mayor densidad, estética madura, ilustraciones
  selectivas, acciones rápidas, lenguaje directo.
- Compartido: datos, rutas, seguridad, servicios, repositorios, casos de uso,
  modelos, reglas, XP y operaciones del cuento.

## Riesgos pendientes

- Aplicar el contrato en layouts y módulos visuales prioritarios por fases.
- Contraste y jerarquía por tema validados en el catálogo
  `/dev/design-system` (ver `07-responsive-accessibility.md`).
