---
title: DAEMON Canonical Document Map
status: draft
normative: false
phase: FND-1
date: 2026-08-06
branch: docs/foundation-assessment-v1
commit_base: 1792933
scope: Mapa recomendado de documentación canónica futura (conjunto reducido). No crea, mueve ni elimina documentos.
---

# Canonical Document Map

## 1. Principios

1. **Una fuente canónica por dominio.** Ningún dominio puede tener dos documentos que se atribuyan la misma autoridad.
2. **Los documentos históricos no son normativos.** Auditorías, releases, handoffs y planes antiguos viven en `90-audits-history/` o `99-archive/` y no se usan como especificación (prohibición explícita en `agent-reading-order.md`).
3. **AGENTS.md es un router, no una enciclopedia.** Debe apuntar al orden de lectura y a los canónicos, no duplicar su contenido.
4. **Los ADR versionan decisiones.** Una decisión arquitectónica aceptada se registra en `20-architecture/adr/`; los documentos que la describen referencian el ADR, no lo reemplazan.
5. **Los runbooks documentan operaciones.** Procedimientos repetibles (deploy, backup, incidente, observabilidad) se consolidan en `operations-runbook.md` dentro de `60-operations/`.
6. **Las iniciativas son temporales.** `80-initiatives/` documenta trabajo en curso; al cerrarse, su resultado se consolida en el canónico del dominio y el registro se archiva.
7. **El frontmatter es la autoridad declarada.** El estado real (`canonical`, `active`, `draft`, etc.) debe coincidir con la tabla de `source-of-truth.md`; si no coincide, es una contradicción (C-05).
8. **La autoridad del sistema visual es de dominio.** `visual-constitution.md` tiene autoridad máxima **únicamente dentro del dominio visual**; no se extiende a producto, arquitectura, datos ni operaciones.
9. **Vocabulario sin documentos separados.** Los términos de gobernanza se definen en `project-constitution.md`; los términos funcionales del producto en `product-overview.md`. No se crea `glossary.md` en esta fase.

## 2. Jerarquía futura de autoridad

```text
1. Constitución General del Proyecto        docs/00-governance/project-constitution.md
2. Documentación canónica del dominio       docs/{dominio}/* (una fuente por dominio)
3. ADR vigentes                             docs/20-architecture/adr/ (ADR-001..006 + futuros)
4. Referencias técnicas verificadas         rutas API, configs, código, openapi.yaml
5. Documentación activa de iniciativas      docs/80-initiatives/ (temporal)
6. Auditorías e historia                    docs/90-audits-history/ (no normativo)
7. Archivo y documentos obsoletos           docs/99-archive/
```

Regla: ante conflicto entre un documento de nivel inferior y uno superior, prevalece el superior. Ante conflicto entre dos del mismo nivel, prevalece el que tenga frontmatter `status: canonical` declarado y coincidente con `source-of-truth.md`. La autoridad de `visual-constitution.md` prevalece únicamente dentro del dominio visual.

## 3. Mapa canónico (conjunto objetivo reducido)

| Dominio | Documento canónico | Estado actual | Fuentes actuales | Acción | Prioridad |
|---|---|---|---|---|---|
| **Governance** | `project-constitution.md` | No existe | AGENTS.md, ai-project-context, ADRs | Crear (incluye términos de gobernanza) | P0 |
| Governance | `source-of-truth.md` | Existe (canonical) | — | Conservar; alinear frontmatter de canónicos | P0 |
| Governance | `agent-reading-order.md` | Existe (canonical) | — | Conservar | P0 |
| Governance | `documentation-policy.md` | Existe pero es stub (solo título) | — | Expandir con reglas reales (crear/modificar/obsolescer/deprecar) | P1 |
| **Product — definición** | `product-overview.md` | Existe (canonical 1.0, FND-3B) | README, ai-project-context, portal-alumno, portal-familias | Canónico — alcance: identidad, actores, experiencias, capacidades y estado | Cerrado |
| Product — reglas | `business-rules.md` | Existe (canonical 1.0, FND-3B) | gamificacion-xp-daemons, portal-familias, ADR-005 | Canónico — alcance: reglas, invariantes, transiciones e incertidumbres | Cerrado |
| **Architecture** | `system-architecture.md` | No existe | ai-project-context, ADR-001, render.yaml, firebase.json | Crear en FND-4 (C4 system/container/deployment + integration map en un solo documento) | P1 |
| Architecture | `frontend-architecture.md` | Existe (active, bien) | — | Conservar como canónico frontend | P0 |
| Architecture | `backend-architecture.md` | No existe | api-crud (referencia, no arquitectura) | Crear; api-crud pasa a referencia API | P1 |
| Architecture | `adr/` (ADR-001..006) | Existen (accepted) | — | Conservar; añadir índice README | P0 |
| **Design system** | `visual-constitution.md` | Existe (V1 aprobada) | — | Conservar (no reauditar); autoridad máxima **solo dominio visual** | P0 |
| Design system | `token-map.md`, `color-accessibility.md`, `README.md` | Existen (V1) | — | Conservar (los cuatro documentos vigentes) | P0 |
| **Data** | `data-ownership.md` | No existe | ADR-001, supabase-postgres | Crear (consolidar ADR-001 como referencia operativa; incluye reglas de migración) | P0 |
| Data | `entity-catalog.md` | No existe | migraciones, modelos | Crear | P0 |
| **Security** | `security-baseline.md` | No existe | SECURITY.md, ADR-003, firebase.json headers, firebase-auth | Crear (incluye políticas de autenticación/autorización y secretos) | P0 |
| Security | `threat-model.md` | No existe | auditorías 90-audits-history | Crear | P1 |
| **Operations** | `environments.md` | Existe (`ENVIRONMENTS.md`, nombre no-canónico) | — | Conservar; normalizar nombre a minúsculas | P1 |
| Operations | `operations-runbook.md` | No existe (parcial en infraestructura-operativa) | infraestructura-operativa, estado-nube, incidentes, monitoring | Crear runbook único (deploy, backup, incidentes, observabilidad) | P1 |
| **Quality** | `quality-gates.md` | No existe | qa-produccion, CI workflows | Crear (incluye DoD, testing strategy y release checklist) | P1 |
| **Agent guidance** | `AGENTS.md` | Existe (router, bueno) | — | Conservar; corregir afirmación de bundle (C-08) | P0 |

Nota: no se marca como "crear" ningún documento que ya exista y pueda consolidarse (p. ej. frontend-architecture, ADRs, design system). El conjunto reducido evita fragmentación: cada dominio tiene 1–2 canónicos, y los temas transversales (migración, observabilidad, DoD, vocabulario) se integran dentro de los documentos existentes en lugar de crear archivos nuevos.

## 4. Mapa de documentos actuales

| Archivo actual | Dominio | Estado (frontmatter) | Autoridad | Documento destino | Acción recomendada |
|---|---|---|---|---|---|
| `AGENTS.md` | Agent guidance | — (sin frontmatter) | Router | AGENTS.md | Conservar; corregir C-08 |
| `docs/README.md` | Governance | active | Índice | docs/README.md | Conservar (mejorable) |
| `docs/00-governance/source-of-truth.md` | Governance | canonical | Alta | source-of-truth.md | Conservar; alinear frontmatter de canónicos |
| `docs/00-governance/agent-reading-order.md` | Governance | canonical | Alta | agent-reading-order.md | Conservar |
| `docs/00-governance/documentation-policy.md` | Governance | canonical | Alta | documentation-policy.md | **Expandir** (stub) |
| `docs/00-governance/document-statuses.md` | Governance | canonical | Alta | document-statuses.md | Conservar |
| `docs/10-product/portal-alumno.md` | Product | active | Referencia técnica portal estudiante | — | Conservar como referencia (canonical: product-overview.md) |
| `docs/10-product/portal-familias.md` | Product | active | Referencia técnica portal familias | — | Conservar como referencia |
| `docs/10-product/gamificacion-xp-daemons.md` | Product | active | Referencia técnica economía | — | Conservar como referencia (reglas: business-rules.md) |
| `docs/10-product/sistema-mascotas-cosmeticos.md` | Product | active | Referencia técnica mascotas | — | Conservar como referencia |
| `docs/10-product/crud-roadmap.md` | Product | superseded (2026-08-06, FND-3B) | — | product-overview.md | **Sustituido** por el inventario de capacidades y el estado funcional |
| `docs/10-product/manual_programador.md` | Product | active | — | backend-architecture + quality-gates | Revisar/archivar (contradice tokens) |
| `docs/10-product/manual_usuario.md` | Product | active | — | product-overview.md | Conservar como manual de usuario |
| `docs/20-architecture/ai-project-context.md` | Architecture | active | Contexto IA | system-architecture.md | Consolidar; arreglar rutas viejas |
| `docs/20-architecture/frontend-architecture.md` | Architecture | active | Canónico frontend | frontend-architecture.md | Conservar |
| `docs/20-architecture/api-crud.md` | Architecture | active (desactualizado) | Referencia API | api-crud.md (actualizar) | **Actualizar** (C-02) |
| `docs/20-architecture/interoperabilidad-oneroster-lti.md` | Architecture | active | — | Conservar | Conservar |
| `docs/20-architecture/frontend/route-inventory.md` | Architecture | active (enlace roto) | Referencia | Conservar | Arreglar puntero (C-07) |
| `docs/20-architecture/adr/ADR-001..006` | Architecture | active (accepted) | Decisión | adr/ | Conservar + índice |
| `docs/30-design-system/*` (4) | Design system | VIGENTE V1 (auto-declarado) | Máxima dentro del dominio visual | Conservar | Conservar (no reauditar) |
| `docs/40-data/supabase-postgres.md` | Data | active | Referencia | data-ownership + entity-catalog | Consolidar |
| `docs/50-security/firebase-auth.md` | Security | active | Autenticación | security-baseline.md | Consolidar |
| `docs/50-security/privacidad-kids-teens.md` | Security | active | Privacidad | security-baseline.md | Consolidar (privacidad como sección) |
| `docs/60-operations/ENVIRONMENTS.md` | Operations | active | Entornos | environments.md | Conservar; normalizar nombre |
| `docs/60-operations/estado-nube-github-produccion.md` | Operations | active | Estado nube | operations-runbook.md | Consolidar; actualizar backups (C-09) |
| `docs/60-operations/infraestructura-operativa.md` | Operations | active | Infraestructura | operations-runbook.md | Consolidar |
| `docs/60-operations/incidents/2026-07-18-restauracion-supabase.md` | Operations | active | Incidente | operations-runbook.md | Conservar como registro |
| `docs/60-operations/monitoring/roadmap-post-merge.md` | Operations | active | Plan | operations-runbook.md | Convertir en sección de observabilidad |
| `docs/70-quality/qa-produccion.md` | Quality | active | Checklist | quality-gates.md | Consolidar |
| `docs/80-initiatives/student-transformation/*` (13) | Initiatives | active | Temporal | Consolidar al canónico; archivar al cerrar | Archivar al cierre |
| `docs/80-initiatives/sustentacion-2026/*` (4) | Initiatives | active | Temporal | Idem | Archivar al cierre |
| `docs/90-audits-history/*` (7) | History | archived | No normativo | Conservar | Conservar |
| `docs/99-archive/datos-prueba.txt` | Archive | — | No normativo | Conservar | Conservar |
| `docs/documentation-audit.md` | — | **sin estado** | — | — | **Archivar** (C-06) |
| `docs/documentation-migration-map.md` | — | **sin estado** | — | — | **Archivar** (C-06) |
| `README.md` (raíz) | Product | — | Landing | — | Arreglar rutas viejas (C-04) |
| `CONTRIBUTING.md` | Governance | — | Contribución | — | Conservar; alinear convención de ramas |
| `SECURITY.md` | Security | — | Política | security-baseline | Consolidar |
| `CHANGELOG.md` | Governance | — | Historial | — | Conservar |

## 5. Orden futuro de lectura para agentes

**General (todos los agentes):**

```text
1. AGENTS.md
2. docs/README.md
3. docs/00-governance/project-constitution.md        (FND-2, futuro)
4. docs/00-governance/source-of-truth.md
5. docs/00-governance/agent-reading-order.md
6. Documentación canónica del dominio asignado
7. ADR aplicables
8. Documentación activa de la iniciativa
```

**Por tipo de tarea:**

- **Frontend:** 1-5 generales → `frontend-architecture.md` → `30-design-system/visual-constitution.md` + `token-map.md` + `color-accessibility.md` → ADR-005 (KIDS/TEENS) → iniciativa activa.
- **Backend:** 1-5 generales → `backend-architecture.md` (futuro) → `api-crud.md` (referencia endpoints) → ADR-001/002 → `40-data/supabase-postgres.md`.
- **Datos:** 1-5 generales → `data-ownership.md` (futuro) → `entity-catalog.md` (futuro) → `supabase-postgres.md` → ADR-001/002/004/006.
- **Seguridad:** 1-5 generales → `security-baseline.md` (futuro) → `threat-model.md` (futuro) → `privacidad-kids-teens.md` → `firestore.rules` → ADR-003.
- **Diseño:** 1-5 generales → `30-design-system/README.md` → `visual-constitution.md` (autoridad máxima solo dominio visual) → `token-map.md` → `color-accessibility.md` → iniciativa concreta.
- **Despliegue:** 1-5 generales → `environments.md` → `operations-runbook.md` (futuro) → `estado-nube-github-produccion.md` → workflows CI.

## 6. Documentos que no deben ser normativos

- Auditorías (`90-audits-history/audits/*`, `frontend-audit`, `audit_log`).
- Reportes y releases (`90-audits-history/release-*`, `implementacion-*`).
- Handoffs temporales (`sustentacion-2026/HANDOFF-*`, `CODEX-PRIMER`, `PROMPT-AGENTE-*`).
- Planes antiguos (`crud-roadmap.md`, `documentation-migration-map.md`, `documentation-audit.md`).
- Capturas y logs (reports/ generados, firestore-debug.log, `.runtime-logs/`).
- Informes de agentes (00-command-results, informes de paquetes cerrados).
- Documentos de iniciativas cerradas (student-transformation al finalizar).
- Historial Git y `90-audits-history` (prohibido como especificación, `agent-reading-order.md`).
