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
| producto — definición | `docs/10-product/product-overview.md` | product | 2026-08-06 | `canonical` — versión 1.0, aprobada en FND-3B (autoridad canónica raíz del dominio Producto: identidad, actores, experiencias, capacidades y estado) |
| producto — reglas | `docs/10-product/business-rules.md` | product | 2026-08-06 | `canonical` — versión 1.0, aprobada en FND-3B (catálogo canónico de reglas, invariantes, transiciones e incertidumbres) |
| arquitectura | `docs/20-architecture/ai-project-context.md` | architecture | 2026-08-06 | transicional (será consolidado en `system-architecture.md`, FND-4) |
| frontend | `docs/20-architecture/frontend-architecture.md` | frontend | 2026-08-06 | vigente |
| backend | `docs/20-architecture/api-crud.md` | backend | 2026-08-06 | transicional (referencia API; `backend-architecture.md` en FND-4) |
| autenticación | `docs/50-security/firebase-auth.md` | security | 2026-08-06 | transicional (consolidado en `security-baseline.md`, FND-5) |
| datos | `docs/40-data/supabase-postgres.md` | data | 2026-08-06 | transicional (consolidado en `data-ownership.md`/`entity-catalog.md`, FND-5) |
| diseño visual | `docs/30-design-system/README.md` + `visual-constitution.md` | design | 2026-08-06 | vigente |
| seguridad | `docs/50-security/privacidad-kids-teens.md` | security | 2026-08-06 | vigente (será complementado por `security-baseline.md`, FND-5) |
| privacidad | `docs/50-security/privacidad-kids-teens.md` | security | 2026-08-06 | vigente |
| entornos | `docs/60-operations/ENVIRONMENTS.md` | devops | 2026-08-06 | transicional (normalizar a `environments.md`, FND-5) |
| despliegue | `docs/60-operations/estado-nube-github-produccion.md` | devops | 2026-08-06 | transicional (consolidado en `operations-runbook.md`, FND-5) |
| pruebas | `docs/70-quality/qa-produccion.md` | qa | 2026-08-06 | transicional (consolidado en `quality-gates.md`, FND-6) |

## Iniciativas activas no normativas

| Iniciativa | Estado | Nota |
|---|---|---|
| `docs/80-initiatives/student-transformation/00-baseline.md` | activa | Temporal; no canónica; sin precedencia sobre documentos de dominio; debe consolidarse en el canónico del dominio y archivarse al cerrar la iniciativa |

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
   (FND-4 a FND-6). No se declaran como existentes documentos futuros
   (`system-architecture.md`, `backend-architecture.md`,
   `security-baseline.md`, `data-ownership.md`, `entity-catalog.md`,
   `operations-runbook.md`, `quality-gates.md`).
5. **Jerarquía canónica del dominio Producto.** `product-overview.md` es la
   autoridad canónica raíz del dominio (identidad, actores, experiencias,
   capacidades, estado y prioridades); `business-rules.md` es el catálogo
   canónico de reglas de negocio (reglas, invariantes, transiciones e
   incertidumbres). Sus alcances no se superponen y ambos están
   subordinados a la Constitución General. Los documentos anteriores de
   portales y módulos (portal-alumno, portal-familias,
   gamificacion-xp-daemons, sistema-mascotas-cosmeticos) son referencias
   activas, no autoridades canónicas globales del dominio.
6. **Auditorías e historia no son normativa.** Los documentos de
   `90-audits-history/` y `99-archive/` no se usan como especificación.
7. **Roles y permisos no requieren un documento canónico separado.** Están
   consolidados dentro del dominio Product: `product-overview.md` (roles y
   perfiles) y `business-rules.md` (reglas de autorización), ambos
   canónicos desde FND-3B.
8. **Las responsabilidades de Firebase no requieren un documento canónico
   independiente.** Se distribuyen entre `system-architecture.md` (FND-4),
   `security-baseline.md` (FND-5), `data-ownership.md` (FND-5) y los
   documentos y ADR vigentes correspondientes.
9. **Cualquier cambio de autoridad documental** requiere el proceso definido
   en `documentation-policy.md` y, cuando afecte a la Constitución, su
   procedimiento formal (Sección 19 de la Constitución).
