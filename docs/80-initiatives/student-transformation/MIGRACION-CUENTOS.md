---
title: Migración de Cuentos — plan y compatibilidad
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# Migración de Cuentos — plan y compatibilidad

- Estado: plan listo; **nada ejecutado en producción**
- Fecha: 2026-08-03
- Rama: `refactor/student-production-hardening`
- Proyecto de prueba: emulador Firestore (`demo-daemon-rules`)

## Objetivo

Convertir los cuentos legacy (`data_1..6`, ownership mixto, sin
`schema_version`) al agregado v2 (`schema_version: 2`, ownership por
`autor_uid`, versiones, moderación y stats) sin perder contenido y con
capacidad de reversión.

## Modelo origen → destino

| Origen | Destino (v2) | Notas |
|---|---|---|
| `cuentos/{id}` con `data_1..data_6`, `firebase_uid` | `cuentos/{id}` `schema_version:2`, `autor_uid`, `version_borrador_id` | `firebase_uid` → `autor_uid`; `data_N` se compactan a una versión inicial |
| Páginas embebidas en `data_N` | `versiones/{versionId}` + `paginas/{pageId}` | Reconstrucción del contenido |
| Comentarios en `cuento_comentarios` (PostgreSQL) | Firestore `comentarios/*` (comando Laravel) | Server-only |
| Reacciones en `cuento_reacciones` | Firestore `reacciones/*` con `usuario_uid` | Deduplicación por documento UID |
| Sin timestamps de servidor | `created_at`/`updated_at` con `serverTimestamp` | Al migrar |

## Mapping de campos

- `titulo` → `titulo_publicado` + versión.
- `sinopsis` → `sinopsis_publicada`.
- `estado` → `estado` + `moderacion_estado` (los borradores legacy quedan
  `borrador` / `no_solicitada`; nunca se publican por defecto).
- `visibilidad` → `privado` por defecto (conservador).
- `audiencia` → de `nivel` si existe; si no, `TEENS`.
- Contadores: se recalcular con agregados del servidor; el cliente no los
  escribe.

## Compatibilidad y lectura temporal

- Converters tolerantes leen ambos esquemas durante la transición
  (strangler; ADR-002).
- No se hace dual-write: primero se lee legacy, se migra, y solo después se
  activan las reglas v2.

## Rollback

- Backup previo del export de Firestore y dump PostgreSQL.
- Log reversible con conteo de afectados (script dry-run).
- Reanudación: el script ignora documentos ya convertidos
  (`schema_version === 2`).

## Riesgos

- Pérdida de páginas si `data_N` tiene formato inconsistente: el dry-run
  reporta documentos no convertibles sin escribirlos.
- Coste de lectura: paginado con cursores.
- Reglas v2 activadas sin migrar bloquean el cliente: por eso el deploy queda
  prohibido hasta completar la migración.

## Plan de despliegue futuro

1. `node scripts/migrar-cuentos-dry-run.mjs` contra emulador (ya disponible).
2. Backup productivo (export Firestore + dump PostgreSQL).
3. Migración real en ventana autorizada con el mismo script en modo ejecución.
4. Verificación de conteos y spot-check.
5. Activación de reglas v2 + índices.
6. Smoke del portal (galería, comentarios, reacciones).

## Bloqueo

Ningún paso anterior se ejecuta contra producción sin autorización explícita
del dueño y backups verificados.
