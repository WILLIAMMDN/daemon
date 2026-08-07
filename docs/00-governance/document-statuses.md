---
title: Estados Documentales
status: canonical
owner: governance
last_reviewed: 2026-08-06
applies_to: all
---
# Estados Documentales Permitidos

## Definición de estados

| Estado | Normativo | Lectura por defecto | Puede autorizar implementación | Requiere reemplazo |
|---|---|---|---|---|
| `canonical` | Sí | Sí | Sí | No (autoridad única aprobada) |
| `active` | Parcial | Sí | Depende del documento | No necesariamente |
| `draft` | No | Bajo criterio | No | No |
| `superseded` | No | No | No | Sí (debe indicar reemplazo) |
| `archived` | No | No | No | No (histórico preservado) |
| `obsolete` | No | No | No | No (incorrecto o no utilizable) |

## Reglas por estado

- **canonical:** autoridad única aprobada de un dominio o decisión. No se
  alcanza sin aprobación explícita.
- **active:** documento operativo vigente, pero no necesariamente canónico
  ni excluyente.
- **draft:** candidato sin autoridad para implementar. No autoriza
  implementación.
- **superseded:** sustituido por un documento explícito; debe apuntar al
  reemplazo.
- **archived:** histórico preservado; no debe leerse por defecto.
- **obsolete:** incorrecto o no utilizable; se retira sin sustituir.

## Transiciones permitidas

```text
draft → canonical
draft → active
active → canonical
active → superseded
canonical → superseded
superseded → archived
active → archived
cualquier estado → obsolete (con justificación)
```

Solo el `project-owner` o el propietario de dominio autorizado puede
aprobar las transiciones a `canonical`, `superseded` u `obsolete`. Un
agente no puede cambiar estados normativos sin autorización.

## Relación entre metadatos

- `status`: estado documental actual (columna central de autoridad).
- `normative`: declara si el documento pretende ser normativo
  (`true`/`false`).
- `owner`: responsable de aprobar y mantener el documento.
- `supersedes`: documento que este documento reemplaza (o `null`).
- `approvals` / `approved_on`: registro de aprobación por rol y fecha; la
  aprobación es explícita, nunca silenciosa.
- `last_reviewed`: fecha de la última revisión del documento.

Regla de coherencia: el frontmatter debe coincidir con la autoridad
declarada en `source-of-truth.md`. Si no coincide, es una contradicción
documental que debe corregirse.
