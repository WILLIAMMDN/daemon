---
title: Paquete 4 — Reestructuración profesional de cuentos
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# Paquete 4 — Reestructuración profesional de cuentos

- Estado: completado en rama; no desplegado
- Fecha: 2026-08-02/03
- Rama: `refactor/student-production-hardening`
- Escrituras productivas: ninguna

## Objetivo

Eliminar la mezcla de responsabilidades del editor de cuentos y convertir el
módulo en un subsistema mantenible con separación estricta entre dominio,
aplicación, acceso a datos y presentación; mover el control plane privilegiado
al servidor (Laravel) y dejar el navegador sin capacidad de elevar estado,
borrar físicamente ni otorgar privilegios.

## Diagnóstico verificado

- `crear-cuento.ts` concentraba ~1200 líneas mezclando presentación, estado,
  validación, editor, páginas, IA, prompts, compresión, carga, identificadores,
  Firestore, publicación, errores y navegación.
- La SPA escribía Firestore directamente (borradores, publicación, comentarios
  y reacciones) con ownership mixto (UID Firebase + ID numérico Laravel).
- Los prompts de IA vivían dentro de la página, con proveedores acoplados.
- La galería paginaba en memoria y exponía una migración ejecutable desde el
  navegador contra URLs productivas.
- No había errores tipados ni estados loading/saving/saved/error centralizados.
- Los contadores de comentarios/reacciones se leían y reescribían sin garantía
  transaccional.

## Decisiones adoptadas

- Arquitectura hexagonal en `features/cuentos`: `dominio/`, `aplicacion/`,
  `acceso-datos/` y `paginas/` (convención en español del repositorio).
- Firestore sigue siendo la autoridad del contenido creativo (ADR-002), pero
  **solo el servidor ejecuta comandos privilegiados** (publicar, eliminar,
  moderar, contadores, IA, activos) vía control plane `CuentoV2` en Laravel.
- Comandos idempotentes con clave `idempotencia` y precondiciones de versión
  (borrador local con revisión esperada; recuperación solo si el checksum y la
  revisión del servidor coinciden).
- Borrador local con revisión optimista para evitar sobrescrituras entre
  pestañas y protección contra condiciones de carrera en el autosave.
- IA detrás de Laravel (`AsistenteCuentoService` + adaptador de proveedor);
  los prompts y las claves no viven en Angular.
- Errores tipados (`ErrorCuento` + `normalizarErrorCuento`), sin `any`,
  converters para Firestore y `serverTimestamp` para la autoridad temporal.
- Galería/comentarios paginados con límites y cursores; índices declarados en
  `firestore.indexes.json`.

## Arquitectura resultante

```text
features/cuentos/
├── dominio/            modelos, estado, visibilidad, políticas, errores
├── aplicacion/         casos de uso (crear/actualizar/publicar/eliminar/
│                       comentar/reaccionar) + facades + borrador local
├── acceso-datos/       cuento.repositorio, activos-cuento.repositorio,
│   ├── firestore/      comandos-cuento.gateway, asistente-cuento.gateway
│   ├── http/           firestore repo + converters, api-comandos, IA
│   └── storage/        adaptador Supabase de activos
└── paginas/            crear-cuento, galeria-proyectos, ver-cuento
```

## Archivos creados

- Dominio: `cuento.modelo.ts`, `pagina-cuento.modelo.ts`,
  `comentario-cuento.modelo.ts`, `reaccion-cuento.modelo.ts`,
  `estado-cuento.ts`, `visibilidad-cuento.ts`, `politicas-cuento.ts`,
  `errores-cuento.ts`.
- Aplicación: `crear-borrador.caso-uso.ts`, `actualizar-borrador.caso-uso.ts`,
  `publicar-cuento.caso-uso.ts`, `eliminar-cuento.caso-uso.ts`,
  `comentar-cuento.caso-uso.ts`, `reaccionar-cuento.caso-uso.ts`,
  `editor-cuento.facade.ts`, `galeria-cuentos.facade.ts`,
  `lectura-cuento.facade.ts`, `borrador-local-cuento.ts`,
  `identificadores-cuento.ts`, `asistente-lectura-cuento.ts`.
- Acceso a datos: `cuento.repositorio.ts`, `activos-cuento.repositorio.ts`,
  `comandos-cuento.gateway.ts`, `asistente-cuento.gateway.ts`,
  `firestore/firestore-cuento.repositorio.ts`, converters (cuento, página,
  versión, comentario, reacción, utilidades),
  `http/api-comandos-cuento.adapter.ts`, `http/cuentos-ia.adapter.ts`,
  `storage/supabase-activos-cuento.adapter.ts`.
- Backend (control plane): `CuentoV2Service`, `FirestoreRestCuentoGateway`,
  `CuentoDocumentoGateway`, `CuentoV2Controller`, requests
  (`ComandoCuentoV2Request`, `ComentarCuentoV2Request`,
  `EditarComentarioCuentoV2Request`, `ReaccionarCuentoV2Request`,
  `PublicarCuentoV2AdminRequest`, `AsistirCuentoV2Request`,
  `SubirActivoCuentoV2Request`), `AsistenteCuentoService`,
  `GeneradorTextoCuento`, `ProveedorChatCuentoAdapter`, `ActivosCuentoService`,
  `CuentoV2Exception`.
- Pruebas: `CuentoV2ServiceTest`, `AsistenteCuentoServiceTest`,
  `politicas-cuento.spec.ts`, `borrador-local-cuento.spec.ts`,
  `galeria-proyectos.spec.ts`, `cuentos-imagen.service.spec.ts`.

## Archivos eliminados

- `features/cuentos/models/cuento.models.ts`, `services/cuento.ts` (legado),
  `services/cuentos-ia.service.ts` y `cuentos-ia.service.spec.ts` — reemplazados
  por la arquitectura hexagonal y el asistente server-side.

## Comandos ejecutados

| Comando | Resultado |
|---|---|
| `npm run build` (frontend) | Correcto |
| `npx jest ...cuentos... --runInBand` | 9/9 specs |
| `php artisan test --env=testing --filter=CuentoV2ServiceTest` | 5 passed |
| `npm run test:firestore-rules` | 31/31 (emulador) |
| `npm run test:ci` | 77+ tests + checks verdes |

## Comparación antes/después

| Aspecto | Antes | Después |
|---|---|---|
| Líneas de `crear-cuento` | ~1200 | &lt; 300 (página) |
| Escritura privilegiada desde Angular | Sí | No (solo servidor) |
| Prompts IA en Angular | Sí | No (Laravel) |
| `any` / cast sin verificación | Presentes | Eliminados |
| Paginación | En memoria | Cursores + límites |
| Errores | Genéricos | Tipados (`ErrorCuento`) |
| Idempotencia publicación/eliminación | No | Sí (clave + repetido) |

## Riesgos resueltos

- Doble autoridad mutable Cuentos (Firestore + PostgreSQL) delimitada por
  ADR-002 con estrategia strangler, sin dual-write.
- Autosave con condición de carrera entre pestañas.
- Borradores recuperables solo con coincidencia de revisión.
- Publicación/eliminación repetibles sin duplicar estado.

## Riesgos pendientes

- Las reglas v2 no están activadas en producción: activarlas exige migrar los
  datos legacy (`data_1..6`) y resolver la proyección de custom claims DAEMON.
- El cliente legacy fue retirado del frontend, pero pueden quedar documentos
  legacy en Firestore que el plan de migración debe convertir (ver
  `docs/MIGRACION-CUENTOS.md`).
- El emulador Firestore sigue siendo el único entorno donde la suite de reglas
  está verificada.

## Próximo paquete

- Paquete 5: Storage y ciclo de vida de archivos (ver `05-storage.md`).
