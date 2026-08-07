---
title: Fuente de Verdad
status: canonical
owner: governance
last_reviewed: 2026-08-06
applies_to: all
---
# Fuente de Verdad Documental

## Autoridad global

| Nivel | Documento | Estado | Alcance |
|---|---|---|---|
| 1 | `docs/00-governance/project-constitution.md` | `canonical` — versión 1.0, aprobada en FND-2B | Global |

La Constitución General es la autoridad global del proyecto. Ningún
documento de dominio puede contradecirla. Los documentos canónicos de cada
dominio se sitúan por debajo de ella en precedencia.

## Canónicos de dominio

| Dominio | Documento canónico | Propietario | Última revisión | Estado |
|---|---|---|---|---|
| producto | `docs/10-product/portal-alumno.md` | product | 2026-08-06 | transicional (será consolidado en `product-overview.md`, FND-3) |
| roles | NO DEFINIDO — REQUIERE DOCUMENTO CANÓNICO | - | - | pendiente (FND-3) |
| arquitectura | `docs/20-architecture/ai-project-context.md` | architecture | 2026-08-06 | transicional (será consolidado en `system-architecture.md`, FND-4) |
| frontend | `docs/20-architecture/frontend-architecture.md` | frontend | 2026-08-06 | vigente |
| backend | `docs/20-architecture/api-crud.md` | backend | 2026-08-06 | transicional (referencia API; `backend-architecture.md` en FND-4) |
| autenticación | `docs/50-security/firebase-auth.md` | security | 2026-08-06 | transicional (consolidado en `security-baseline.md`, FND-5) |
| datos | `docs/40-data/supabase-postgres.md` | data | 2026-08-06 | transicional (consolidado en `data-ownership.md`/`entity-catalog.md`, FND-5) |
| Firebase | NO DEFINIDO — REQUIERE DOCUMENTO CANÓNICO | - | - | pendiente |
| diseño visual | `docs/30-design-system/README.md` + `visual-constitution.md` | design | 2026-08-06 | vigente |
| seguridad | `docs/50-security/privacidad-kids-teens.md` | security | 2026-08-06 | vigente (será complementado por `security-baseline.md`, FND-5) |
| privacidad | `docs/50-security/privacidad-kids-teens.md` | security | 2026-08-06 | vigente |
| entornos | `docs/60-operations/ENVIRONMENTS.md` | devops | 2026-08-06 | transicional (normalizar a `environments.md`, FND-5) |
| despliegue | `docs/60-operations/estado-nube-github-produccion.md` | devops | 2026-08-06 | transicional (consolidado en `operations-runbook.md`, FND-5) |
| pruebas | `docs/70-quality/qa-produccion.md` | qa | 2026-08-06 | transicional (consolidado en `quality-gates.md`, FND-6) |
| iniciativa del estudiante | `docs/80-initiatives/student-transformation/00-baseline.md` | product | 2026-08-06 | iniciativa temporal |

## Reglas de autoridad

1. **Una única fuente de autoridad por dominio.** No se admiten dos
   documentos que se atribuyan la misma autoridad dentro de un dominio.
2. **La Constitución General tiene precedencia global.** Cualquier
   contradicción entre un documento de dominio y la Constitución se resuelve
   a favor de la Constitución (ver `project-constitution.md`, Sección 20).
3. **La Constitución Visual tiene autoridad máxima únicamente dentro del
   dominio visual.** No se extiende a producto, arquitectura, datos ni
   operaciones.
4. **Documentos actuales vs. futuros.** Los documentos marcados como
   "transicional" o "pendiente" no son canónicos nuevos; indican documentos
   existentes que serán sustituidos o consolidados en fases posteriores
   (FND-3 a FND-6). No se declaran como existentes documentos futuros
   (`product-overview.md`, `system-architecture.md`,
   `backend-architecture.md`, `security-baseline.md`, `data-ownership.md`,
   `entity-catalog.md`, `operations-runbook.md`, `quality-gates.md`).
5. **Auditorías e historia no son normativa.** Los documentos de
   `90-audits-history/` y `99-archive/` no se usan como especificación.
6. **Cualquier cambio de autoridad documental** requiere el proceso definido
   en `documentation-policy.md` y, cuando afecte a la Constitución, su
   procedimiento formal (Sección 19 de la Constitución).
