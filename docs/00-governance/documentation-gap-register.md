---
title: DAEMON Documentation Gap Register
status: active
normative: false
owner: governance
phase: ongoing
created: 2026-08-06
last_reviewed: 2026-08-06
applies_to: all
scope: Registro vivo de brechas documentales, técnicas, operativas y de preparación para agentes. Se actualiza conforme se cierran las fases FND.
---

# Documentation Gap Register

## 1. Escala de prioridad

- **P0 — Critical:** impide operar de forma profesional, segura o autónoma; bloquea a agentes o expone riesgo de datos/producción.
- **P1 — High:** deuda importante que produce decisiones equivocadas, duplicación o ambigüedad recurrente.
- **P2 — Medium:** mejora de calidad/coherencia; no bloquea.
- **P3 — Low:** pulido, normalización de nombres o enlaces menores.

Estados posibles: `abierta`, `en curso`, `cerrada`, `consolidada`.

---

## 2. Registro

### GAP-001 — Constitución General del Proyecto ausente

- Dominio: Governance
- Prioridad: P0
- Estado: **cerrada**
- Problema: No existía `project-constitution.md` que defina identidad, alcance, misión, usuarios, límites, jerarquía de autoridad y reglas de gobernanza del proyecto, incluidos los términos de gobernanza (rol vs nivel, autoridad, canónico, etc.).
- Evidencia: `project-constitution.md` versión 1.0 `status: canonical`, aprobada en FND-2B y enlazada desde AGENTS.md, docs/README y source-of-truth.
- Riesgo: resuelto; ahora existe fuente única de identidad y gobernanza.
- Impacto para agentes: cold start Q1-Q2 → PASS con fuente única.
- Documento canónico afectado: `project-constitution.md` (creado y aprobado).
- Resolución propuesta: ejecutada en FND-2 (candidato) y FND-2B (activación).
- Dependencias: FND-1 aprobado.
- Criterio de cierre: **cumplido** — documento publicado, `status: canonical`, enlazado desde AGENTS.md y source-of-truth; commit de la fase FND-2B.

---

### GAP-002 — Producto sin overview ni business rules

- Dominio: Product
- Prioridad: P1
- Estado: **cerrada**
- Problema: No existían `product-overview.md` ni `business-rules.md` (conjunto objetivo reducido de producto). La información estaba dispersa en README, portal-alumno, portal-familias, gamificacion y rutas.
- Evidencia: `product-overview.md` canonical 1.0; `business-rules.md` canonical 1.0; 25 capacidades verificadas contra rutas y features; 2 capacidades candidatas separadas (CAND-001/002); matrices actor-capacidad y portal-capacidad; 27 flujos transversales; 44 reglas BR; vocabulario funcional (Apéndice B); `crud-roadmap.md` retirado como especificación vigente (superseded).
- Riesgo: resuelto — existe fuente única de definición y reglas del producto.
- Impacto para agentes: cold start Q6-Q7 → PASS con fuentes canónicas.
- Documento canónico afectado: `product-overview.md` (autoridad raíz del dominio Producto), `business-rules.md` (catálogo de reglas).
- Resolución propuesta: ejecutada en FND-3 (candidato FND-3A + correcciones FND-3A-R1/R2) y FND-3B (activación).
- Dependencias: FND-2.
- Criterio de cierre: **cumplido en FND-3B** — ambos documentos publicados como canónicos v1.0. No se declara que todas las capacidades estén implementadas.

---

### GAP-003 — Matriz de ownership de datos no formalizada

- Dominio: Data
- Prioridad: P0
- Estado: abierta
- Problema: ADR-001 define autoridad por entidad como decisión, pero no existe `data-ownership.md` operativo ni `entity-catalog.md` (52 modelos, 33 migraciones sin catálogo).
- Evidencia: ADR-001 tabla completa; foundation-assessment §7 (matriz preliminar); ausencia de entity-catalog en `find docs`.
- Riesgo: escrituras en el sistema incorrecto, dual-write no detectado, ownership ambiguo.
- Impacto para agentes: cold start Q11-Q13 → PASS solo si el agente lee el ADR.
- Documento canónico afectado: data-ownership.md, entity-catalog.md.
- Resolución propuesta: FND-5 — derivar entity-catalog de migraciones/modelos; consolidar ADR-001 en data-ownership.md; inventariar cuentos Firestore productivos (read-only autorizado).
- Dependencias: FND-4 (arquitectura de cuentos), autorización de lectura productiva.
- Criterio de cierre: catálogo con todas las tablas y colecciones; ownership sin ambigüedad; cuentos en transición documentada.

---

### GAP-004 — Seguridad sin baseline ni threat model

- Dominio: Security
- Prioridad: P0
- Estado: abierta
- Problema: No existen `security-baseline.md` ni `threat-model.md` (conjunto reducido de seguridad). SECURITY.md es breve; ADR-003 cubre Firestore. Las políticas de autenticación/autorización y secretos se integran en `security-baseline.md`.
- Evidencia: `docs/50-security/` solo tiene firebase-auth.md y privacidad-kids-teens.md; SECURITY.md raíz (5 secciones cortas).
- Riesgo: exposición de secretos, reglas no revisadas, decisiones de seguridad ad-hoc.
- Impacto para agentes: cold start Q20 → PARTIAL sin lista formal de archivos protegidos.
- Documento canónico afectado: security-baseline.md (incluye autenticación/autorización y secretos), threat-model.md.
- Resolución propuesta: FND-5 — consolidar controles existentes (headers, scan-secretos, ADR-003, privacidad, firebase-auth) en security-baseline.md; redactar threat model; integrar política de secretos y rotación en el baseline.
- Dependencias: FND-2/3.
- Criterio de cierre: 2 documentos publicados; scan-secretos.mjs integrado en CI (ya lo está en security-audit.yml); variable OpenRouter corregida (GAP-009).

---

### GAP-005 — `.env` local apunta a producción; desarrollo bloqueado

- Dominio: Operations
- Prioridad: P0
- Estado: abierta (bloqueo intencional)
- Problema: el `.env` local real conserva destinos productivos (DB pooler, Firebase, Storage, Pusher). `EnvironmentSafety` lanza `LogicException` y bloquea `php artisan` (verificado: `php artisan --version` → bloqueo).
- Evidencia: salida del comando `php artisan --version` en FND-1; `02-environments.md` §"Riesgos pendientes"; ADR-006.
- Riesgo: desarrollo local inutilizable; un agente no puede verificar backend sin reconfigurar.
- Impacto para agentes: cold start Q16 → PARTIAL; verificación autónoma bloqueada.
- Documento canónico afectado: environments.md.
- Resolución propuesta: propietario reemplaza `.env` con valores locales (`daemon_local`, `demo-*`) o provisiona staging; documentar el procedimiento en environments.md. **Acción operativa del propietario, no documental.**
- Dependencias: propietario del proyecto.
- Criterio de cierre: `php artisan serve` y tests locales funcionan con recursos locales; guard sigue pasando.

---

### GAP-006 — Sin `operations-runbook.md` consolidado

- Dominio: Operations
- Prioridad: P1
- Estado: abierta
- Problema: no existe `operations-runbook.md` único. Debe integrar deploy, rollback, backup, recovery, incident response y observability. El conocimiento está disperso en infraestructura-operativa.md, estado-nube, qa-produccion (historial de incidentes), monitoring/roadmap-post-merge (plan de observabilidad) y workflows. **Consolida el antiguo GAP-018 (observabilidad) como sección del runbook.**
- Evidencia: `find docs/60-operations` (5 archivos, ninguno es runbook formal); qa-produccion.md contiene historial de incidentes mezclado con checklist.
- Riesgo: deploy manual frágil, rollback improvisado, incidentes sin procedimiento, observabilidad sin consolidar.
- Impacto para agentes: cold start Q15-Q16 → PARTIAL.
- Documento canónico afectado: operations-runbook.md (deploy, backup, incidentes y observabilidad en un solo documento).
- Resolución propuesta: FND-5 — consolidar infraestructura-operativa + estado-nube + incidente 2026-07-18 + roadmap de monitoring en `operations-runbook.md`; separar historial de checklist en qa-produccion.
- Dependencias: FND-4.
- Criterio de cierre: operations-runbook.md publicado con secciones de deploy, backup/recovery, incident response y observabilidad, verificado contra workflows reales.

---

### GAP-007 — Sin `quality-gates.md` formal

- Dominio: Quality
- Prioridad: P1
- Estado: abierta
- Problema: no existe `quality-gates.md`. Debe integrar Definition of Done, testing strategy, gates bloqueantes e informativos y release checklist. El checklist vive en qa-produccion.md y los gates en workflows CI, sin formalizar. **Consolida el antiguo GAP-015 (testing strategy + release checklist) dentro de quality-gates.md.**
- Evidencia: qa-produccion.md (552 líneas) funciona como checklist de facto; sin documento único de DoD; cobertura desigual (Firestore legacy 7.84% según 01-data-authority).
- Riesgo: tareas "completadas" sin criterio objetivo; gates no documentados.
- Impacto para agentes: cold start Q25 → PARTIAL (sin DoD formal).
- Documento canónico afectado: quality-gates.md (incluye DoD, testing strategy y release checklist).
- Resolución propuesta: FND-6 — formalizar quality gates (distinguir bloqueante/informativo), DoD, estrategia de tests y release checklist en un solo documento.
- Dependencias: FND-2/3.
- Criterio de cierre: quality-gates.md publicado; AGENTS.md referencia el DoD; gates coinciden con CI.

---

### GAP-008 — Documentación desactualizada que contradice el código

- Dominio: Governance/Product/Architecture
- Prioridad: P1
- Estado: **en curso** (el estado global del producto quedó consolidado en FND-3B; api-crud.md pendiente)
- Problema: `api-crud.md` §9 lista endpoints "pendientes" ya implementados (bulk-destroy, publicar evaluación, aulas PUT/DELETE, cuentos admin); `crud-roadmap.md` (2026-07-06) marcaba frontend U/D como ❌ cuando existen `gestionar-*`.
- Evidencia: C-02, C-03 en foundation-assessment §9; comparación con `routes/api.php` y features/. En FND-3B: `crud-roadmap.md` marcado superseded y sustituido por el inventario de capacidades y el estado funcional de `product-overview.md`; el estado global del producto quedó consolidado.
- Riesgo: parcialmente resuelto — un agente ya no usa crud-roadmap como especificación; api-crud.md sigue pendiente de alineación.
- Impacto para agentes: cold start Q7 → PASS para producto (inventario canónico); la referencia API permanece desalineada.
- Documento canónico afectado: api-crud.md (referencia API), product-overview.md (estado, resuelto).
- Resolución propuesta: actualizar api-crud.md al estado real contra `php artisan route:list` (parte API pendiente para FND-4).
- Dependencias: FND-4 (parte API).
- Criterio de cierre: api-crud.md coincide con `php artisan route:list`; crud-roadmap ya no es especificación vigente (cumplido).

---

### GAP-009 — Variable de entorno IA incoherente (OpenRouter)

- Dominio: Operations/Security
- Prioridad: P0
- Estado: abierta
- Problema: `render.yaml` declara `OPENROUTER_API_KEY`, pero `OpenRouterProvider.php` lee `env('OPENROUTER_API_KEY_NUEVA')`. Además el baseline (00-baseline.md) reportó una credencial IA obfuscada en código histórico (P0-01) que debe considerarse comprometida.
- Evidencia: C-01 en foundation-assessment §9; `grep` de código; 00-baseline.md §Matriz de riesgos P0-01.
- Riesgo: chatbot IA falla en producción; credencial histórica comprometida.
- Impacto para agentes: implementaciones de IA usan variable equivocada.
- Documento canónico afectado: security-baseline.md (secretos), environments.md.
- Resolución propuesta: unificar nombre de variable, rotar credenciales comprometidas, eliminar fallbacks obfuscados (acción de código, autorizada en fase posterior).
- Dependencias: propietario (rotación) + FND-5 (política).
- Criterio de cierre: código y render.yaml coherentes; credenciales rotadas; scan-secretos sin hallazgos bloqueantes.

---

### GAP-010 — Enlaces y rutas de documentación rotas tras la reorganización

- Dominio: Governance
- Prioridad: P1
- Estado: abierta (enlaces principales de gobernanza corregidos en FND-2B; pendientes en producto/arquitectura)
- Problema: README.md, ai-project-context.md y documentación-audit/migration-map usan rutas pre-reorganización (`docs/portal-alumno.md`, `docs/qa-produccion.md`, `sistema-diseno/*`, `transformacion-estudiante/*`). route-inventory.md y frontend-audit apuntan a `00-DOCUMENTATION-STATUS.md` (eliminado).
- Evidencia: C-04, C-06, C-07 en foundation-assessment §9; `grep` de rutas viejas. En FND-2B se corrigieron los enlaces de gobernanza (docs/README, source-of-truth, agent-reading-order).
- Riesgo: un agente no encuentra la documentación vigente; usa mapas falsos.
- Impacto para agentes: cold start Q19 → PASS pero con fricción residual en producto/arquitectura.
- Documento canónico afectado: README.md, ai-project-context.md, agent-reading-order.
- Resolución propuesta: actualizar enlaces a rutas numeradas; archivar documentation-audit.md y documentation-migration-map.md en 90-audits-history.
- Dependencias: ninguna (acción documental menor).
- Criterio de cierre: `grep` de rutas viejas = 0 en docs vigentes; archivos de auditoría archivados.

---

### GAP-011 — Frontmatter de estado no coherente con la autoridad declarada

- Dominio: Governance
- Prioridad: P2
- Estado: **en curso**
- Problema: source-of-truth.md declara "canonical" a documentos con frontmatter `status: active` (ai-project-context, frontend-architecture, api-crud, firebase-auth, supabase-postgres, etc.). design-system auto-declara autoridad sin usar el sistema de estados.
- Evidencia: C-05 en foundation-assessment §9; lectura de frontmatters. En FND-2B la gobernanza quedó definida (document-statuses expandido con transiciones y regla de coherencia). En FND-3B los documentos de producto quedaron alineados: `product-overview.md` y `business-rules.md` con `status: canonical`, y las referencias activas de producto (portal-alumno, portal-familias, gamificacion-xp-daemons, sistema-mascotas-cosmeticos) con `status: active` + `normative: false` sin autoridad global.
- Riesgo: ambigüedad reducida en producto; otros dominios siguen pendientes.
- Impacto para agentes: cold start Q19 → PASS con matiz en dominios no alineados.
- Documento canónico afectado: source-of-truth.md, document-statuses.md.
- Resolución propuesta: alinear frontmatter con la tabla de gobernanza (regla definida en document-statuses FND-2B).
- Dependencias: FND-2B completado; FND-3B completado para producto; **pendiente**: migrar el frontmatter de los documentos de otros dominios (arquitectura, datos, seguridad, operaciones, calidad) en fases posteriores.
- Criterio de cierre: todo canónico declarado tiene `status: canonical` coherente.

---

### GAP-012 — Vocabulario sin fuente central (sin crear glossary.md)

- Dominio: Governance/Product
- Prioridad: P3
- Estado: **cerrada**
- Problema: términos como XP, DAEMONS, KIDS/TEENS, rol vs nivel, racha, Núcleo DAEMON, progreso_nivel aparecían en múltiples docs sin definición central. **No se crea `glossary.md`:** los términos de gobernanza se definen en `project-constitution.md` y los términos funcionales en `product-overview.md`.
- Evidencia: Sección 21 de project-constitution.md (vocabulario de gobernanza, aprobada en FND-2B); Apéndice B de product-overview.md (términos funcionales, canonical v1.0, aprobado en FND-3B).
- Riesgo: resuelto — vocabulario central definido sin documento separado.
- Impacto para agentes: interpretación consistente de términos de gobernanza y funcionales.
- Documento canónico afectado: project-constitution.md (vocabulario de gobernanza), product-overview.md (vocabulario funcional).
- Resolución propuesta: ejecutada — Constitución en FND-2B y product-overview en FND-3.
- Dependencias: FND-2, FND-3.
- Criterio de cierre: **cumplido en FND-2B + FND-3B** — ambos documentos incluyen sus secciones de términos; no existe glossary.md.

---

### GAP-013 — Sin arquitectura de sistema consolidada (C4)

- Dominio: Architecture
- Prioridad: P1
- Estado: abierta
- Problema: no existe `system-architecture.md` (C4 system/container/deployment + integration map en un solo documento). ai-project-context describe el estado pero sin diagramas C4.
- Evidencia: `find docs/20-architecture` (sin documento C4); foundation-assessment §6.
- Riesgo: decisiones de integración sin visión estructural; onboarding lento.
- Impacto para agentes: cold start Q8-Q10 → PASS vía texto, sin diagramas.
- Documento canónico afectado: system-architecture.md (futuro).
- Resolución propuesta: FND-4 — un único documento con C4 System Context, C4 Container, Deployment view e Integration map, con evidencia de render.yaml/firebase.json/workflows.
- Dependencias: FND-3.
- Criterio de cierre: system-architecture.md publicado con diagramas Mermaid/ASCII y verificación contra config.

---

### GAP-014 — Sin backend-architecture.md

- Dominio: Architecture
- Prioridad: P1
- Estado: abierta
- Problema: api-crud.md es una referencia de endpoints; no describe arquitectura del backend (carpetas, servicios, patrones, middleware, políticas).
- Evidencia: contenido de api-crud.md; estructura de app/ (Services por dominio, 6 middleware, sin Policies/).
- Riesgo: agentes implementan sin conocer patrones backend (Services + FormRequests + thin controllers).
- Impacto para agentes: cold start Q9 → PASS pero sin guía de convenciones.
- Documento canónico afectado: backend-architecture.md (futuro).
- Resolución propuesta: FND-4 — documentar arquitectura backend real, patrones, middleware y contratos.
- Dependencias: FND-3.
- Criterio de cierre: backend-architecture.md publicado; api-crud.md marcado como referencia API.

---

### GAP-015 — Sin estrategia de testing ni release checklist formal

- Dominio: Quality
- Prioridad: — (consolidada)
- Estado: **consolidada en GAP-007**
- Problema: los tests existen (161 backend, 104 frontend, 31 rules) pero no hay una estrategia de testing formal (niveles, cobertura, criterios) ni un release checklist; ambos se integrarán como secciones de quality-gates.md.
- Evidencia: ejecución de suites en FND-1; qa-produccion.md como checklist informal.
- Riesgo: cobertura desigual (Firestore legacy 7.84% según 01-data-authority), sin estrategia.
- Impacto para agentes: Q25 → PARTIAL.
- Documento canónico afectado: quality-gates.md (sección testing strategy + release checklist).
- Resolución propuesta: resuelto dentro de GAP-007 en FND-6.
- Dependencias: FND-6.
- Criterio de cierre: eliminado del registro al cerrarse GAP-007.

---

### GAP-016 — Sin política de migración de datos formal

- Dominio: Data
- Prioridad: P2
- Estado: abierta
- Problema: no existe política formal de migración; las reglas están implícitas (dry-run, backup, no dual-write, `migrate:status` + `--pretend`). Se integra en `data-ownership.md` para evitar fragmentación.
- Evidencia: ADR-002 (estrategia strangler), supabase-postgres.md (comandos de migración), AGENTS.md (DB/migrations).
- Riesgo: migraciones destructivas o dobles escrituras.
- Impacto para agentes: sin guía clara de cuándo/cómo migrar.
- Documento canónico afectado: data-ownership.md (sección de política de migración).
- Resolución propuesta: FND-5 — formalizar sección de migración dentro de data-ownership.md con ejemplos de comandos reales.
- Dependencias: FND-4.
- Criterio de cierre: sección publicada; coincide con barreras de EnvironmentSafety.

---

### GAP-017 — Falta lista formal de archivos prohibidos/stop-condition para agentes

- Dominio: Agent Readiness
- Prioridad: P1
- Estado: abierta
- Problema: AGENTS.md tiene reglas de seguridad pero no una lista explícita de archivos protegidos ni una stop-condition formal ("detente cuando...").
- Evidencia: cold start Q20/Q24 → PARTIAL; AGENTS.md §Safety rules.
- Riesgo: un agente modifica `.env`, service accounts o migraciones sin detenerse.
- Impacto para agentes: principal brecha de seguridad del flujo de agentes.
- Documento canónico afectado: AGENTS.md.
- Resolución propuesta: FND-6 — sección "Archivos prohibidos" + "Condición de parada" + DoD en AGENTS.md.
- Dependencias: FND-2 (constitución).
- Criterio de cierre: cold start Q20/Q24/Q25 → PASS.

---

### GAP-018 — Sin observabilidad consolidada

- Dominio: Operations
- Prioridad: — (consolidada)
- Estado: **consolidada en GAP-006**
- Problema: monitoring/roadmap-post-merge.md es un plan; no hay doc de observabilidad con logs, métricas, Sentry y telemetría.
- Evidencia: `find docs/60-operations/monitoring` (1 plan); Sentry instalado en ambos lados.
- Riesgo: incidentes sin trazabilidad consolidada.
- Impacto para agentes: medio.
- Documento canónico afectado: operations-runbook.md (sección de observabilidad).
- Resolución propuesta: resuelto dentro de GAP-006 en FND-5.
- Dependencias: FND-5.
- Criterio de cierre: eliminado del registro al cerrarse GAP-006.

---

### GAP-019 — Sin convención formal de ramas y commits para documentación

- Dominio: Governance
- Prioridad: P2
- Estado: **cerrada**
- Problema: CONTRIBUTING.md sugiere `feature/*` y Conventional Commits, pero no había convención explícita para ramas de documentación (`docs/*`) ni para cambios de gobernanza.
- Evidencia: documentation-policy.md §9 (FND-2B) define ramas `docs/...` y Conventional Commits con convención `docs(scope): descripción imperativa`; CONTRIBUTING.md; ramas recientes usan `docs/*` de facto.
- Riesgo: resuelto — naming consistente para tareas documentales.
- Impacto para agentes: cold start Q21 → PASS para documentación.
- Documento canónico afectado: documentation-policy.md, CONTRIBUTING.md.
- Resolución propuesta: ejecutada en FND-2B (documentation-policy §9).
- Dependencias: FND-2.
- Criterio de cierre: **cumplido** — convención documentada en documentation-policy.md.

---

### GAP-020 — Sin inventario de rutas verificado y sin openapi completo

- Dominio: Architecture/Product
- Prioridad: P2
- Estado: abierta
- Problema: openapi.yaml solo documenta 9 paths de los ~120 reales; route-inventory.md tiene rutas "inferidas" con puntero roto.
- Evidencia: contenido de openapi.yaml; `wc -l` y lectura; routes/api.php (completo).
- Riesgo: integradores externos sin contrato fiable.
- Impacto para agentes: Q6 → PASS pero con fuente incompleta.
- Documento canónico afectado: openapi.yaml, api-crud.md.
- Resolución propuesta: regenerar openapi desde rutas reales (herramienta o script); actualizar route-inventory.
- Dependencias: FND-4.
- Criterio de cierre: openapi cubre rutas públicas y autenticadas principales; route-inventory sin punteros rotos.

---

### GAP-021 — `audit_log.md` y artifacts de auditoría sin clasificación limpia

- Dominio: Governance
- Prioridad: P3
- Estado: abierta
- Problema: `docs/90-audits-history/audit_log.md` es una lista enorme de commits genéricos (ruido); frontend-audit tiene doble frontmatter (archived/active).
- Evidencia: C-11 en foundation-assessment §9; contenido de audit_log.md.
- Riesgo: bajo; ruido para agentes.
- Impacto para agentes: lectura innecesaria.
- Documento canónico afectado: 90-audits-history.
- Resolución propuesta: depurar audit_log (mantener solo entradas útiles), unificar frontmatter.
- Dependencias: ninguna.
- Criterio de cierre: frontmatter unificado; audit_log depurado.

---

### GAP-022 — `manual_programador.md` y `manual_usuario.md` sin estado claro de vigencia

- Dominio: Product
- Prioridad: P3
- Estado: abierta
- Problema: ambos tienen frontmatter `active` pero manual_programador menciona tokens legacy (`text-primary-900`, `shadow-bento`) y manual_usuario describe la interfaz sin fecha.
- Evidencia: C-12 en foundation-assessment §9; lectura de ambos.
- Riesgo: bajo; contradicción de tokens.
- Impacto para agentes: estilo incorrecto si se sigue manual_programador.
- Documento canónico afectado: manual_programador.md, token-map.md.
- Resolución propuesta: actualizar referencias de tokens o archivar manual_programador como histórico; conservar manual_usuario con fecha.
- Dependencias: FND-3.
- Criterio de cierre: sin referencias a tokens legacy.

---

## 3. Priorización (recalibrada por riesgo real)

| Orden | GAP | Prioridad | Dependencia | Fase propuesta |
|---|---|---|---|---|
| 1 | GAP-001 Constitución del Proyecto | P0 | — | **cerrada (FND-2B)** |
| 2 | GAP-003 ownership de datos | P0 | GAP-013 | FND-5 |
| 3 | GAP-004 seguridad (baseline/threat) | P0 | GAP-001 | FND-5 |
| 4 | GAP-009 variable OpenRouter (código) | P0 | propietario | Fuera de fase (acción de código autorizada) |
| 5 | GAP-005 `.env` local (operativo) | P0 | propietario | Fuera de fase (acción del propietario) |
| 6 | GAP-002 Producto (overview + business rules) | P1 | GAP-001 (cerrado) | **cerrada (FND-3B)** |
| 7 | GAP-008 Docs desactualizadas (api-crud, crud-roadmap) | P1 | GAP-002 | **en curso** (estado de producto consolidado FND-3B; api-crud pendiente FND-4) |
| 8 | GAP-013 Arquitectura de sistema (C4) | P1 | GAP-002 | FND-4 |
| 9 | GAP-014 backend-architecture | P1 | GAP-013 | FND-4 |
| 10 | GAP-006 operations-runbook (incl. observabilidad) | P1 | GAP-013 | FND-5 |
| 11 | GAP-007 quality-gates (DoD/testing/release) | P1 | GAP-001 | FND-6 |
| 12 | GAP-017 archivos prohibidos/stop-condition | P1 | GAP-001 | FND-6 |
| 13 | GAP-010 enlaces rotos | P1 | — | FND-2/3 (enlaces de gobernanza corregidos en FND-2B) |
| 14 | GAP-011 frontmatter coherente | P2 | GAP-001 | **en curso** (gobernanza definida FND-2B; migración de estados por dominio pendiente) |
| 15 | GAP-016 política de migración (en data-ownership) | P2 | GAP-003 | FND-5 |
| 16 | GAP-019 convención ramas/commits | P2 | GAP-001 | **cerrada (FND-2B)** |
| 17 | GAP-020 openapi/routes | P2 | GAP-013 | FND-4 |
| 18 | GAP-012 vocabulario (en constitution/product) | P3 | GAP-001/002 | **cerrada (FND-2B + FND-3B)** |
| 19 | GAP-021 auditoría limpia | P3 | — | FND-6 |
| 20 | GAP-022 manuales vigentes | P3 | GAP-002 | abierta (revisión puede reasignarse a UXA-1 o fase documental posterior; no se cierra en FND-3B) |
| — | GAP-015 (consolidado en GAP-007) | — | GAP-007 | FND-6 |
| — | GAP-018 (consolidado en GAP-006) | — | GAP-006 | FND-5 |

## 4. Roadmap documental recomendado

1. **FND-2 — Constitución del Proyecto.** `project-constitution.md` (identidad, alcance, jerarquía, gobernanza, vocabulario de gobernanza). **Ejecutado (FND-2A candidato + FND-2B activación).** Cierra GAP-001 y GAP-019; deja GAP-011 en curso y GAP-012 parcial (vocabulario de gobernanza cubierto) y corrige los enlaces principales de gobernanza de GAP-010.
2. **FND-3 — Producto.** `product-overview.md` (incluye users/portals, capability inventory de 25 filas y vocabulario funcional) y `business-rules.md`. **Ejecutado y cerrado (FND-3A candidato + FND-3A-R1/R2 correcciones + FND-3B activación).** Cierra **GAP-002** y **GAP-012**; GAP-008 parcialmente atendido (estado de producto consolidado; api-crud pendiente para FND-4); GAP-022 permanece abierto.
3. **FND-4 — Arquitectura.** `system-architecture.md` (C4 + deployment + integration map), `backend-architecture.md`, índice ADR, openapi regenerado, alineación de api-crud. Cierra GAP-013, GAP-014, GAP-020 y la parte API de GAP-008.
4. **FND-5 — Datos, seguridad y operación.** `data-ownership.md` (incluye política de migración), `entity-catalog.md`, `security-baseline.md` (incluye autenticación/autorización y secretos), `threat-model.md`, `environments.md` (normalizar nombre), `operations-runbook.md` (deploy, backup, incidentes, observabilidad). Cierra GAP-003, GAP-004, GAP-006 (+GAP-018), GAP-016.
5. **FND-6 — Calidad y Agent Readiness.** `quality-gates.md` (DoD, testing strategy, release checklist); AGENTS.md con archivos prohibidos + stop-condition + DoD; depuración de auditorías. Cierra GAP-007 (+GAP-015), GAP-017, GAP-021.
6. **Cold Start final.** Re-ejecutar las 25 preguntas; objetivo ≥ 90 (mature).
7. **Inicio de implementación.** Solo tras cerrar los P0 documentales y las acciones operativas del propietario (GAP-005, GAP-009).

Los P0 restantes se mantienen sin cambios de prioridad: GAP-003 (ownership de datos), GAP-004 (seguridad baseline/threat model), GAP-005 (entorno local productivo) y GAP-009 (variable OpenRouter incoherente).
