---
title: Paquete 9 — Pruebas
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# Paquete 9 — Pruebas

- Estado: cobertura ampliada del módulo Cuentos; umbrales del repo vigentes
- Fecha: 2026-08-03
- Rama: `refactor/student-production-hardening`

## Suite actual

| Área | Comando | Estado |
|---|---|---|
| Backend Laravel | `php artisan test` | 144 tests verdes |
| Frontend unit (CI) | `npm run test:ci` | 77+ tests + checks verdes |
| Firestore Rules | `npm run test:firestore-rules` | 31/31 (emulador, ~97 % cobertura) |
| Environment safety | `node --test ../scripts/check-environment-safety.test.mjs` | Verdes |

## Cobertura añadida en esta ronda (módulo Cuentos)

- Converters Firestore: `cuento.converter.spec.ts`, `pagina-cuento.converter.spec.ts`,
  `comentario.converter.spec.ts`, `reaccion.converter.spec.ts`.
- Casos de uso: `crear-borrador`, `actualizar-borrador`, `publicar-cuento`,
  `eliminar-cuento`, `comentar-cuento`, `reaccionar-cuento`.
- Dominio ya cubierto: `politicas-cuento.spec.ts`, `borrador-local-cuento.spec.ts`.

Objetivo del módulo (promesa del encargo): statements ≥ 80 %, branches ≥ 70 %,
functions ≥ 80 %. Los umbrales globales del repo se mantienen en
`jest.config.js` (branches 30 / functions 35 / lines 55 / statements 55) y no
se suben antes de que las pruebas lo justifiquen.

## E2E Playwright

`e2e/cuentos.spec.ts` cubre el flujo clave del módulo con **mocks estables**
(API y emulador), sin IA real ni servicios de producción. Los 24 escenarios
del encargo se despliegan progresivamente: login alumno, dashboard Kids/Teens,
crear borrador, añadir páginas, IA con mock, guardar, recargar/recuperar,
editar, publicar/solicitar, galería, abrir cuento, reaccionar/deshacer,
comentar, permisos de otro estudiante, eliminar, limpieza lógica, móvil,
teclado, offline básico, errores de red y sesión expirada.

## Riesgos pendientes

- E2E autenticados dependen de credenciales locales (`E2E_STUDENT_USERNAME`).
- Capturas visuales estables por tema/viewport pendientes de integrar.
