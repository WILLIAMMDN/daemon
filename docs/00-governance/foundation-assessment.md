---
title: DAEMON Foundation Assessment
status: draft
normative: false
phase: FND-1
date: 2026-08-06
branch: docs/foundation-assessment-v1
commit_base: 1792933
scope: Estudio de fundación documental, funcional, arquitectónica, técnica, operativa y de gobernanza de DAEMON (FND-1). No implementa ninguna recomendación.
---

# DAEMON Foundation Assessment

## 1. Resumen ejecutivo

**Estado general:** DAEMON es un sistema productivo con despliegue configurado y evidencia documental de operación. El estado remoto actual no fue validado directamente durante FND-1. La configuración declara frontend Angular 21 en Firebase Hosting, backend Laravel 12 en Render, base Supabase PostgreSQL, autenticación Firebase Auth y cuentos v2 con autoridad Firestore (ADR-002/003). El repositorio ha pasado por una reorganización documental reciente (FASE DOC-1), una Constitución Visual V1 aprobada y una iniciativa de endurecimiento (`student-transformation`) que cerró paquetes 0 a 6. La documentación de arquitectura, autenticación, datos, entornos y diseño visual es de alta calidad y verificable contra el código local.

**Nivel de madurez:** `managed` en Frontend; `defined` en Architecture (con brechas documentales explícitas) y Design System; `partial` en Governance, Product, Backend, Data, Security, Operations, Quality y Agent Readiness.

**Brechas P0 identificadas** (lista completa de brechas P0 en `documentation-gap-register.md` §2):

1. **[GAP-001] Sin Constitución General del Proyecto**: no existe `project-constitution.md` (identidad, alcance, jerarquía de autoridad, reglas de gobernanza y vocabulario de gobernanza). Un agente nuevo no puede responder con autoridad "qué es DAEMON" y "qué no debe cambiar" sin leer múltiples documentos. *(La ausencia de `product-overview.md` y `business-rules.md` es GAP-002, prioridad P1.)*
2. **[GAP-003] Sin matriz de ownership de datos formal**: el ADR-001 define autoridad por entidad, pero no existe `data-ownership.md` ni `entity-catalog.md` como documento operativo. La autoridad real de cuentos está en transición (PostgreSQL legado → Firestore v2) y no hay inventario verificado de documentos Firestore productivos.
3. **[GAP-004] Sin security-baseline ni threat-model**: la seguridad está documentada por piezas (firebase-auth, privacidad-kids-teens, ADR-003) pero no consolidada; no hay modelo de amenazas.
4. **[GAP-005] El `.env` local real apunta a recursos productivos** y queda bloqueado por `EnvironmentSafety` (verificado: `php artisan` lanza `LogicException`). El desarrollo local queda inutilizable hasta que el propietario reemplace el `.env` por valores locales (bloqueo intencional documentado en ADR-006/ENVIRONMENTS).
5. **[GAP-009] Discrepancia de variable de entorno de IA**: `render.yaml` declara `OPENROUTER_API_KEY`, pero `OpenRouterProvider.php` lee `OPENROUTER_API_KEY_NUEVA`. Riesgo funcional en producción (chatbot IA).

Riesgos P1 relevantes (fuera de la lista P0): contradicciones documentales heredadas de la reorganización (GAP-008) y documentación desactualizada frente al código (`api-crud.md`, `crud-roadmap.md`).

**Dominios mejor documentados:** Gobernanza dispone de jerarquía y orden de lectura útiles, aunque su madurez general permanece `partial` por la ausencia de Constitución y por la política documental incompleta; Arquitectura (ADR-001 a 006) y Frontend (arquitectura + checks automáticos) son las fortalezas más sólidas; Datos (supabase-postgres + ADR-001) y Diseño Visual (Constitución V1 + token map + accesibilidad, autoridad máxima únicamente dentro del dominio visual).

**Dominios más débiles:** Producto (sin overview ni business rules), Seguridad (sin baseline/threat model), Operaciones (sin runbooks formales), Calidad (sin quality gates ni DoD), Backend documental (sin backend-architecture; api-crud es referencia de endpoints, no arquitectura).

**Agent Readiness Score: 72/100 → categoría `partial`.**

**Recomendación de avance:** **AVANZAR a FND-2 (Constitución del Proyecto) con condición.** La base documental y de código es sólida; las brechas GAP-001, GAP-003 y GAP-004 se resuelven con documentación. La brecha GAP-005 (entorno local) es operativa y no bloquea la fase documental, pero sí bloquea la verificación local autónoma de un agente. La brecha GAP-009 (variable OpenRouter) debe corregirse en código antes de la siguiente fase de implementación, no en FND.

## 2. Metodología

- **Repositorio inspeccionado:** `C:\laragon\www\daemon` (rama `docs/foundation-assessment-v1`).
- **Comandos ejecutados (no destructivos):** `git branch --show-current`, `git status --short`, `git log -1 --oneline`, `git diff --name-status`, `git remote -v`, `find docs -type f`, `wc -l` sobre docs, `npm run check:docs`, `npm run check:architecture`, `npm run check:style-tokens`, `npm run check:student-visual`, `npm run build` (frontend), `npx jest --runInBand` (frontend), `php artisan test --env=testing` (backend), `composer validate --no-check-publish`, `php artisan --version` (bloqueado por guard, resultado registrado), `grep`/`rg` de verificación técnica.
- **Fuentes:** lectura completa de configuración (package.json, composer.json, angular.json, firebase.json, render.yaml, firestore.rules, firestore.indexes.json, .firebaserc, .env.example, .env.testing), rutas API, modelos, migraciones, servicios, workflows CI/CD y todos los Markdown de `docs/` (64).
- **Criterios de evidencia:** una afirmación técnica se considera verificada solo si se contrasta con código o configuración ejecutable; las afirmaciones documentales no verificadas se marcan explícitamente; las decisiones aceptadas (ADR) se tratan como directivas, no como descripción del estado desplegado.
- **Limitaciones:** no se inspeccionó el estado de producción (Firestore/Supabase/Render) mediante escritura ni acceso remoto; no se ejecutaron E2E autenticados (entorno local bloqueado); no se ejecutó `npm run lint` (el script no existe); no se desplegó nada. El `.env` real no se leyó en valores (solo nombres de variables) y se respetó su naturaleza bloqueada.

## 3. Estado del repositorio

| Ítem | Valor |
|---|---|
| Rama | `docs/foundation-assessment-v1` (creada desde `docs/foundation-authority-cleanup-v1`) |
| Commit base | `1792933` — `docs(design-system): approve visual constitution v1` |
| Worktree | limpio al inicio (`git status --short` vacío); sin cambios ajenos detectados |
| Remote | `origin → https://github.com/WILLIAMMDN/daemon.git` |
| Estructura | `frontend-angular/`, `backend-laravel/`, `docs/` (65 archivos, 64 Markdown), `database/`, `legado/`, `scripts/`, `.github/workflows/` |
| Aplicaciones | SPA Angular (frontend), API REST Laravel (backend) |

**Tecnologías verificadas (contraste código + configuración):**

| Capa | Tecnología | Evidencia |
|---|---|---|
| Frontend | Angular `21.2.18` | `frontend-angular/package.json` |
| Frontend | Standalone (`bootstrapApplication`, `standalone: true` en 27+ archivos, sin NgModules) | `src/main.ts`, `src/app/app.config.ts`, búsqueda `standalone: true` |
| Frontend | **Zoneless** (`provideZonelessChangeDetection()`) | `src/app/app.config.ts:11,28` |
| Frontend | `ChangeDetectionStrategy.OnPush` | 89+ componentes con OnPush |
| Frontend | Signals + RxJS | `core/dominio`, servicios, código de features |
| Frontend | Lazy loading (`loadComponent`) | `src/app/app.routes.ts` |
| Frontend | NG-ZORRO `21.3.2` | `package.json` + `angular.json` estilos |
| Frontend | Tailwind `3.4.19`, SCSS | `package.json`, `tailwind.config.js`, `src/styles.scss` |
| Frontend | Firebase JS SDK `12.15.0` | `package.json`, `core/servicios/firebase-auth.ts`, `firestore-app.ts` |
| Frontend | Rive, Sentry, Chart.js, Quill, driver.js, pusher-js, laravel-echo, ngx-spinner, ngx-image-cropper | `package.json` |
| Frontend | Tests Jest `30.4.2` (34 suites / 104 tests) + Playwright | `package.json`, ejecución `npx jest --runInBand` |
| Backend | Laravel `12` / PHP `8.2` (CI: 8.3) | `composer.json`, `php --version`, workflows |
| Backend | Sanctum `4.0`, `firebase/php-jwt`, `laravel/socialite`, `pusher/pusher-php-server`, `resend/resend-laravel` (instalado, inactivo), `sentry/sentry-laravel`, `intervention/image`, `league/flysystem-aws-s3-v3` (S3/Supabase), `doctrine/dbal` | `composer.json` |
| Backend | 52 modelos Eloquent, 30 controladores, 24 directorios de servicios, 33 migraciones, 6 middleware | `app/Models`, `app/Http/Controllers/Api/V1`, `app/Services`, `database/migrations`, `app/Http/Middleware` |
| Backend | Tests: **161 passed / 539 assertions** (SQLite `:memory:`) | `php artisan test --env=testing` |
| Auth | Firebase Auth (Google, email/password) → validación `FirebaseTokenVerifier` → Sanctum | `app/Services/Auth/`, rutas API |
| Datos | Supabase PostgreSQL (producción), SQLite `:memory:` (tests), Firestore (cuentos v2, emulador local) | `config/database.php`, `.env.testing`, `firestore.rules` |
| Storage | Supabase Storage buckets `daemon-assets` (público) y `daemon-private` (privado); Firebase Hosting para assets estáticos | `render.yaml`, migraciones, `Activos` |
| Realtime | Pusher + `laravel-echo` (Broadcast) | `composer.json`, `package.json`, `routes/channels.php` |
| IA | OpenRouter (chatbot, `OpenRouterProvider`) y Ollama (legacy), asistente IA de cuentos vía Laravel | `app/Services/Chatbot/`, `CuentoV2` |
| Deploy | Firebase Hosting (`daemonestudiante`, target `estudiante`) + Render Docker (`daemon-5vo1.onrender.com`) | `firebase.json`, `.firebaserc`, `render.yaml`, Dockerfile |
| CI/CD | 9 workflows GitHub Actions (backend-tests, frontend-ci, firebase-hosting-merge, firebase-hosting-pull-request, staging-deploy, supabase-backup, production-monitor, keep-alive, security-audit) | `.github/workflows/` |

## 4. Evaluación por dominio

| Dominio | Madurez | Evidencia | Riesgos | Recomendación |
|---|---|---|---|---|
| Governance | **partial** | `00-governance/` completo (source-of-truth, agent-reading-order, documentation-policy, document-statuses); AGENTS.md actúa como router; jerarquía y prohibiciones claras | `documentation-policy.md` es un stub (solo título); no hay constitution ni procedimiento formal de deprecación; 2 documentos sin estado en raíz de docs | Crear project-constitution.md; expandir documentation-policy; archivar audit/migration-map |
| Product | **partial** | `portal-alumno.md` excelente; `portal-familias.md`, `gamificacion-xp-daemons.md`, `sistema-mascotas-cosmeticos.md` sólidos | No hay product-overview.md ni business-rules.md; `crud-roadmap.md` desactualizado (2026-07-06) | FND-3: crear product-overview.md y business-rules.md |
| Architecture | **defined** (con brechas documentales explícitas) | ADR-001..006 aceptados y con referencias; `ai-project-context.md` (469 líneas); `frontend-architecture.md` | `api-crud.md` es referencia de endpoints, no arquitectura backend; falta `system-architecture.md` (C4 system/container/deployment + integration map), backend-architecture, ADR index; referencias de rutas viejas en ai-project-context | FND-4: system-architecture.md (C4 System Context, C4 Container, deployment view, integration map) + frontend-architecture.md (conservar) + backend-architecture.md + adr/ (índice); consolidar api-crud como referencia API |
| Frontend | **managed** | Arquitectura por capas con check automático (`check:architecture` OK), tokens (`check:style-tokens` OK), contrato visual (`check:student-visual` OK, 52 archivos); build pasa | Warnings conocidos: bundle inicial 1.28 MB > 1 MB warning, Sass `@import` deprecado, `quill-delta` CommonJS, `crear-cuento.scss` 39.73 kB > 32 kB; sin script `lint`; AGENTS.md afirma falsamente "bajo el presupuesto de 1 MB" | Documentar deuda real en quality-gates; añadir lint |
| Design System | **defined** | Constitución Visual V1 aprobada (`visual-constitution.md`, `token-map.md`, `color-accessibility.md`, `README.md`); `check:style-tokens` y `check:student-visual` en CI | Autoridad máxima únicamente dentro del dominio visual; no integrado al sistema de estados de gobernanza (C-05) | FND-2/3: enlazar desde gobernanza sin reauditar; conservar los cuatro documentos vigentes |
| Backend | **partial** | 161 tests OK; servicios por dominio; middleware de seguridad; rutas completas y protegidas | Sin `backend-architecture.md`; `api-crud.md` desactualizado (pendientes ya implementados); `composer validate` con 2 warnings (constraint exacta, `*` sin límite); sin Policies dir | FND-4: backend-architecture; actualizar api-crud |
| Data | **partial** | `supabase-postgres.md` completo; ADR-001 matriz de autoridad; migraciones de endurecimiento | Sin entity-catalog ni data-ownership.md formal; cuentos en transición dual (PostgreSQL legado + Firestore v2) sin inventario productivo | FND-5: data-ownership.md, entity-catalog.md |
| Security | **partial** | `firebase-auth.md`, `privacidad-kids-teens.md`, ADR-003 (rules v2 + tests emulador), scan-secretos.mjs, security-audit.yml, headers en firebase.json | No existen security-baseline.md ni threat-model.md; autenticación, autorización y secretos están dispersos; controles parciales ya implementados (rules v2 **no desplegadas**, claims custom no provisionados, App Check no activado); incoherencia de variable `OPENROUTER_API_KEY_NUEVA` vs render.yaml | FND-5: crear security-baseline.md integrando autenticación, autorización, secretos y controles mínimos; crear threat-model.md. La incoherencia OpenRouter requiere una fase de código autorizada |
| Operations | **partial** | `ENVIRONMENTS.md` (matriz de aislamiento), `infraestructura-operativa.md`, `estado-nube-github-produccion.md`, workflow backup/restore, keep-alive, monitor | Sin operations-runbook formal (deploy/backup/incidentes/observabilidad); staging no aprovisionado (fail-closed); `.env` local bloqueado; plan free Render sin SLA | FND-5: environments.md + operations-runbook.md |
| Quality | **partial** | `qa-produccion.md` (552 líneas), checks automáticos, CI con jest/build/audit/CodeQL, tests 161+104 | Sin quality-gates.md (DoD/testing/release) formal; lint ausente; crud-roadmap desactualizado | FND-6: quality-gates.md |
| Agent Readiness | **partial** | AGENTS.md sólido; orden de lectura; prohibiciones; comandos reales | Score 72/100; sin stop-condition explícita, sin lista formal de archivos protegidos, sin DoD; enlaces rotos en varios docs | FND-6 + corrección de enlaces |

## 5. Producto verificado

- **Propósito (verificado):** plataforma educativa gamificada para una academia de tecnología; centraliza aprendizaje por misiones, XP, DAEMONS, tienda, evaluaciones, cuentos, ranking, certificados, chatbot IA y competencias en vivo (README, ai-project-context, rutas API).
- **Usuarios:** estudiantes (niveles KIDS/TEENS), docentes, administradores, tutores/familias (rol `tutor`), instituciones (interoperabilidad OneRoster/LTI).
- **Portales (verificado por rutas y guards):** público `/`; alumno `/alumno`; docente `/docente`; familias `/familias`; aula `/aula` (layout-aula con Firestore); dev `/dev/design-system` (guard solo desarrollo).
- **KIDS vs TEENS (verificado):** un solo dominio y rutas; `usuarios.nivel` = `KIDS`/`TEENS` (legacy `PRO`/`DOCENTE` normalizados a TEENS por migración); perfil de experiencia tipado (`perfil-experiencia-estudiante.ts`); restricciones conservadoras de publicación (ADR-005); `rol` separado.
- **Capabilities (inventario preliminar de 25 capabilities, ver tabla completa a continuación; consolidación en FND-3):**

| Capability | Portal | Estado | Evidencia |
|---|---|---|---|
| Autenticación (Firebase + Sanctum) | Todos | implemented | rutas `/auth/*`, firebase-auth.ts |
| Panel alumno (dashboard, perfil) | Alumno | implemented | `/alumno`, AlumnoService |
| Misiones + entregas | Alumno/Docente | implemented | `/misiones*`, MisionController |
| XP / niveles / DAEMONS (ledger) | Alumno | implemented | GamificacionService, `movimientos_economia` |
| Ranking por XP | Alumno | implemented | `/ranking`, RankingController |
| Tienda / canjes / stock | Alumno/Docente | implemented | `/tienda*`, TiendaController |
| Insignias | Docente | implemented | `/docente/insignias*` |
| Evaluaciones (live, resultados) | Alumno/Docente | implemented | `/evaluaciones*` |
| Aulas / académico (cursos, lecciones) | Docente | implemented | `/academico`, `/docente/aulas` |
| Cuentos v1 (PostgreSQL legacy) | Alumno | deprecated (transición) | `/cuentos`, CuentoController |
| Cuentos v2 (Firestore, galería, editor, IA) | Alumno | implemented en rama; **no desplegado** el control plane completo | `/cuentos-v2*`, CuentoV2Controller, firestore.rules v2 |
| Comentarios/reacciones cuentos | Alumno | partial (server-only en rules v2, no desplegado) | ADR-003, firestore.rules |
| Chatbot IA (OpenRouter/Ollama) | Alumno | implemented | `/chatbot*`, ChatbotService |
| Mascota y cosméticos | Alumno | implemented | `/mascota*`, MascotaController |
| Competencia en vivo | Alumno/Docente | implemented | `/competencia*`, CompetenciaLive |
| Comunidad | Alumno/Docente | implemented | `/comunidad*` |
| Certificados | Alumno | implemented (lectura) | `/certificados`, CertificadoController |
| Portal familias (tutor) | Familias | implemented | `/tutor/*`, TutorPortalController |
| Bienestar digital (límites pantalla) | Familias/Alumno | implemented | `/bienestar-digital`, UsoPantallaDiario |
| Privacidad (exportar, eliminar, retención) | Todos | implemented | `/privacidad*`, PrivacidadService |
| Interoperabilidad OneRoster/LTI | Instituciones | experimental/parcial | `/interoperabilidad*`, `routes/interoperability.php` |
| Archivos (Supabase Storage) | Todos | implemented | `/archivos*`, ArchivoService |
| Notificaciones | Todos | implemented | `/notificaciones*`, NotificacionController |
| Telemetría (lista cerrada) | Todos | implemented | `/telemetria/eventos` |
| Seguridad comunidad (reportes/bloqueos) | Moderación | implemented | `/comunidad/reportes`, `/comunidad/bloqueos` |

- **Incertidumbres:** estado real de los documentos Firestore en producción (no inspeccionados); deploy del control plane de cuentos v2; si los custom claims están provisionados; estado del entorno staging (fail-closed por diseño); si `OPENROUTER_API_KEY_NUEVA` está definida en Render.

## 6. Arquitectura verificada

```text
Browser
  -> Firebase Hosting (https://daemonestudiante.web.app)  [Angular 21 SPA]
  -> Render (https://daemon-5vo1.onrender.com/api/v1)     [Laravel 12 + Sanctum]
  -> Supabase PostgreSQL (business data)                  [proyecto lbxdcvsrmkkynttgwblc]
  -> Supabase Storage (daemon-assets, daemon-private)     [uploads de negocio]
  -> Firebase Auth (Google, email/password, correos)      [identidad + verificación]
  -> Firestore (cuentos v2: /cuentos/{id}/versiones|paginas|comentarios|reacciones)
  -> Pusher (realtime/broadcast)  ->  Sentry (backend/frontend, observabilidad)
  -> OpenRouter / Ollama (IA)
```

- **Auth:** Angular usa Firebase SDK → envía ID token → Laravel valida (`FirebaseTokenVerifier`) → emite sesión/token Sanctum → `auth:sanctum` protege la API; `role:*` para autorización. Frontend usa también custom tokens para login local (Firestore rules v2).
- **Datos:** PostgreSQL es autoridad de negocio (usuarios, roles, académico, economía, familia, privacidad, mascotas, interop); Firestore es autoridad del agregado de cuentos v2; Storage guarda bytes con metadata/ownership en PostgreSQL.
- **Despliegue:** Firebase Hosting (frontend, merge a main + smoke), Render Docker (backend, `checksPass` + deploy hook manual), staging fail-closed no provisionado, CI GitHub Actions.
- **Integraciones:** Firebase Auth, Firestore (+ emulador), Supabase (PostgreSQL + Storage S3), Pusher, Sentry, Resend (instalado, inactivo), OpenRouter, Ollama (legacy), OneRoster/LTI (parcial).
- **Diagramas necesarios en FND-4:** C4 System Context, C4 Container (frontend/backend/Firebase/Supabase), Component para cuentos v2, Deployment view (Firebase Hosting/Render/Supabase/emuladores), Integration map (Pusher/Sentry/IA), Runtime flows (login Firebase, verificación, cuentos v2, canje).

## 7. Matriz preliminar de ownership de datos

| Entidad | Fuente de verdad | Tecnología | Lectores | Escritores | Evidencia | Riesgo |
|---|---|---|---|---|---|---|
| Identidad | Firebase Auth | Firebase | Angular, Laravel | Firebase Auth (Laravel admin vía service account) | firebase-auth.md, ADR-001 | Bajo |
| Usuario DAEMON | PostgreSQL `usuarios` | Supabase | Laravel → API | Laravel | ADR-001, migraciones | Bajo |
| Rol | PostgreSQL `usuarios.rol` | Supabase | Laravel, claims proyectados | Laravel | ADR-001/003 | Bajo (claims son proyección) |
| Perfil | PostgreSQL `usuarios` | Supabase | Laravel → API | Laravel | ADR-001 | Bajo |
| KIDS/TEENS (`nivel`) | PostgreSQL `usuarios.nivel` | Supabase | Laravel, proyección mínima | Laravel | ADR-005, portal-alumno | Bajo |
| Curso/Aula/Matrícula | PostgreSQL | Supabase | Laravel → API | Laravel (rol autorizado) | ADR-001 | Bajo |
| Misión/Entrega | PostgreSQL | Supabase | Laravel → API | Laravel | ADR-001 | Bajo |
| Evaluación/Respuesta | PostgreSQL | Supabase | Laravel → API | Laravel | ADR-001 | Bajo |
| XP / DAEMONS | PostgreSQL `usuarios.experiencia`/`tokens` + `movimientos_economia` | Supabase | Laravel → API | `GamificacionService` | gamificacion-xp-daemons.md, tests | Bajo |
| Cuento v2 | Firestore `/cuentos/{id}` | Firestore | Angular, Laravel (adaptador) | Autor (borrador, rules) + Laravel (comandos privilegiados) | ADR-002/003, firestore.rules | **Alto (transición, reglas no desplegadas)** |
| Página/Versión cuento | Firestore subcolecciones | Firestore | Angular, Laravel | Autor (borrador), Laravel (publicación) | ADR-002 | Alto (transición) |
| Comentario cuento | Firestore subcolección | Firestore | Angular (lectura), Laravel | Laravel (server-only) | ADR-003 | Alto (no desplegado) |
| Reacción cuento | Firestore subcolección (ID determinista UID) | Firestore | Angular | Usuario autenticado (rules) | ADR-003 | Medio |
| Archivos de negocio | Supabase Storage (bytes) + PostgreSQL (reserva/ownership) | Supabase | Angular (URL), Laravel | Laravel o URL acotada | ADR-004, ArchivoService | Medio |
| Notificaciones | PostgreSQL | Supabase | Laravel → API | Laravel | ADR-001 | Bajo |
| Consentimiento/vínculo familiar | PostgreSQL | Supabase | Laravel → API | Laravel | portal-familias, privacidad | Bajo |
| Uso de pantalla | PostgreSQL `uso_pantalla_diario` (agregado diario) | Supabase | Laravel → API | Laravel | privacidad-kids-teens | Bajo |
| Moderación/reportes | PostgreSQL (decisión) + Firestore (proyección) | Supabase/Firestore | Moderadores | Laravel | ADR-002/003 | Medio |
| Mascota/cosméticos | PostgreSQL | Supabase | Laravel → API | Laravel | sistema-mascotas-cosmeticos | Bajo |
| Interoperabilidad | PostgreSQL | Supabase | SIS/LMS | Laravel (admin) | interoperabilidad-oneroster-lti | Medio |
| Telemetría | PostgreSQL | Supabase | Laravel (analítica) | Laravel (lista cerrada) | privacidad-kids-teens | Bajo |

## 8. Documentación existente

- **Volumen:** 64 Markdown en `docs/` + AGENTS.md, README.md, CONTRIBUTING.md, SECURITY.md, CHANGELOG.md (raíz) + openapi.yaml.
- **Distribución:** 00-governance (4), 10-product (7), 20-architecture (12, incluidos 6 ADR), 30-design-system (4), 40-data (1), 50-security (2), 60-operations (5), 70-quality (1), 80-initiatives (16), 90-audits-history (7), 99-archive (1), raíz de docs (3: README, documentation-audit, documentation-migration-map).
- **Autoridad:** jerarquía definida en agent-reading-order y source-of-truth; design system declara su propia autoridad interna (**visual-constitution.md = autoridad máxima únicamente dentro del dominio visual**). **Discrepancia:** source-of-truth declara "canonical" para docs cuyo frontmatter dice `status: active` (p. ej. portal-alumno.md).
- **Duplicación:** autoridad de datos aparece en ADR-001, supabase-postgres.md y ai-project-context.md (coherentes entre sí); entornos en ENVIRONMENTS.md, infraestructura-operativa.md, estado-nube-github-produccion.md y ADR-006 (coherentes); QA/operaciones mezclan runbook e incidentes en qa-produccion.md.
- **Contradicciones:** ver Sección 9. Las más relevantes: `api-crud.md`/`crud-roadmap.md` desactualizados vs rutas reales; rutas de archivos viejas en README.md y ai-project-context.md; `documentation-audit.md`/`documentation-migration-map.md` refieren archivos que ya no existen.
- **Rutas rotas:** README.md y ai-project-context.md usan rutas pre-reorganización (`docs/portal-alumno.md`, `docs/qa-produccion.md`, `docs/supabase-postgres.md`, etc.); `route-inventory.md` y `frontend-audit-2026-07-20.md` apuntan a `00-DOCUMENTATION-STATUS.md` (eliminado en DOC-1A).

## 9. Contradicciones relevantes

| ID | Severidad | Dominio | Fuentes | Riesgo | Recomendación |
|---|---|---|---|---|---|
| C-01 | **critical** | Variable de entorno IA | `render.yaml` (`OPENROUTER_API_KEY`) vs `OpenRouterProvider.php` (`env('OPENROUTER_API_KEY_NUEVA')`) | Chatbot IA falla en producción si la variable real no coincide | Corregir el nombre de variable en código/config y rotar; registrar en gap register |
| C-02 | **high** | Documentación vs código | `api-crud.md` §9 "Pendientes próximos" (bulk-destroy, publicar evaluación, aulas PUT/DELETE, cuentos admin) vs `routes/api.php` (todos implementados) | Un agente cree que faltan endpoints y los reimplementa | Actualizar api-crud.md a estado actual |
| C-03 | **high** | Documentación vs código | `crud-roadmap.md` (2026-07-06) marca frontend U/D ❌ para misiones/tienda/evaluaciones/insignias; el frontend tiene `gestionar-*` implementados | Un agente duplica trabajo o reporta deuda inexistente | Reescribir como estado histórico o archivar |
| C-04 | **high** | Rutas rotas | `README.md` y `ai-project-context.md` referencian `docs/portal-alumno.md`, `docs/qa-produccion.md`, `docs/supabase-postgres.md`, `docs/sistema-mascotas-cosmeticos.md`, `docs/release-2026-07-14-portal-alumno.md` (rutas viejas) | Un agente no encuentra la doc canónica | Actualizar enlaces a rutas numeradas |
| C-05 | **medium** | Autoridad duplicada | `source-of-truth.md` declara canónicos (portal-alumno, ai-project-context, etc.) con frontmatter `status: active`; design-system declara autoridad máxima interna | Ambigüedad sobre qué es normativo | Alinear frontmatter con la tabla de gobernanza |
| C-06 | **medium** | Artefactos de reorganización | `docs/documentation-audit.md` y `docs/documentation-migration-map.md` refieren `sistema-diseno/*`, `transformacion-estudiante/*`, `adr/*` en rutas viejas y "Enlaces actualizados: Pendiente" | Un agente usa un mapa falso del árbol | Archivar en 90-audits-history |
| C-07 | **medium** | Enlaces rotos | `route-inventory.md` y `frontend-audit-2026-07-20.md` apuntan a `00-DOCUMENTATION-STATUS.md` (eliminado) | Puntero muerto para el agente | Eliminar nota o apuntar a doc vigente |
| C-08 | **medium** | AGENTS.md vs build | AGENTS.md: "bundle bajo el presupuesto de 1 MB"; build real: 1.28 MB (warning) | Un agente acepta un warning que debería investigar | Actualizar afirmación en AGENTS.md |
| C-09 | **medium** | Operaciones vs config | `estado-nube-github-produccion.md` lista "Configurar backups" como pendiente; `supabase-backup.yml` existe y corre diario | Confusión sobre si hay backups | Actualizar doc |
| C-10 | **low** | Documentación interna | `ai-project-context.md` menciona "Tailwind/DaisyUI"; DaisyUI no está en `package.json` (Tailwind + NG-ZORRO + custom) | Un agente usa una librería inexistente | Corregir mención |
| C-11 | **low** | Frontmatter doble | `frontend-audit-2026-07-20.md` tiene dos bloques frontmatter (primero `archived`, luego `active`) | Clasificación ambigua | Unificar a `archived` |
| C-12 | **low** | Manual vs tokens | `manual_programador.md` menciona tokens `text-primary-900`/`shadow-bento` (sistema legacy); el sistema vigente usa `--daemon-*` | Estilo contradictorio | Actualizar o marcar como histórico |

## 10. Cold Start Test

Simulación: agente nuevo sin memoria, solo con el repositorio.

| # | Pregunta | Respuesta encontrada | Fuente | Confianza | Resultado |
|---|---|---|---|---|---|
| 1 | ¿Qué es DAEMON? | Plataforma educativa gamificada Angular+Laravel+IA | AGENTS.md, README | Alta | **PASS** |
| 2 | ¿Qué problema resuelve? | Centraliza aprendizaje con misiones/XP/tienda | README | Alta | **PASS** |
| 3 | ¿Quiénes son sus usuarios? | Alumnos, docentes, admin, tutores | README, rutas | Alta | **PASS** |
| 4 | ¿Qué portales existen? | Público, alumno, docente, familias, aula | app.routes.ts, guards | Alta | **PASS** |
| 5 | Diferencia KIDS/TEENS | Nivel de audiencia, una sola base, perfil tipado | ADR-005, portal-alumno | Alta | **PASS** |
| 6 | ¿Qué módulos están implementados? | 25 capabilities listadas (misiones, tienda, cuentos, etc.) | rutas API + features | Alta | **PASS** |
| 7 | ¿Qué módulos están incompletos? | Cuentos v2 (control plane no desplegado), interop parcial, staging | ADR-002/006, initiatives | Media | **PARTIAL** (crud-roadmap desactualizado) |
| 8 | Tecnologías frontend | Angular 21, zoneless, standalone, OnPush, NG-ZORRO, Tailwind, Signals | package.json + código | Alta | **PASS** |
| 9 | Tecnologías backend | Laravel 12, Sanctum, PHP 8.2, Supabase, Firebase | composer.json | Alta | **PASS** |
| 10 | ¿Dónde se autentican? | Firebase Auth (Google/email) → Laravel valida → Sanctum | firebase-auth.md | Alta | **PASS** |
| 11 | ¿Dónde vive cada clase de datos? | Matriz ADR-001: PostgreSQL negocio, Firestore cuentos, Storage archivos | ADR-001 | Alta | **PASS** |
| 12 | ¿Quién puede escribir en Firestore? | Rules v2: owner borradores/reacciones, comentarios server-only, resto denegado | firestore.rules, ADR-003 | Media (no desplegado) | **PARTIAL** |
| 13 | ¿Qué datos pertenecen a PostgreSQL? | Usuarios, roles, académico, economía, familia, privacidad | ADR-001 | Alta | **PASS** |
| 14 | ¿Dónde se almacenan archivos? | Supabase Storage `daemon-assets`/`daemon-private`; estáticos en Hosting | supabase-postgres.md | Alta | **PASS** |
| 15 | ¿Cómo se ejecuta el frontend? | `npm start` (development local + emuladores); `npm run build` | README, ENVIRONMENTS | Alta | **PASS** |
| 16 | ¿Cómo se ejecuta el backend? | `php artisan serve`; precheck obligatorio; `.env` local actual bloqueado | ENVIRONMENTS, ADR-006 | Media | **PARTIAL** (bloqueo local) |
| 17 | ¿Cómo se ejecutan los tests? | `php artisan test --env=testing`; `npm run test:ci`; rules emulador | qa-produccion | Alta | **PASS** |
| 18 | ¿Qué comandos validan cambios? | check:docs, check:architecture, check:style-tokens, build, test | AGENTS.md, package.json | Alta | **PASS** |
| 19 | ¿Qué documentación es normativa? | AGENTS.md → README → source-of-truth → canónicos; design system propio | agent-reading-order | Alta | **PASS** |
| 20 | ¿Qué archivos no debe modificar? | Reglas de seguridad, `.env`, service accounts, migraciones sin aprobación | AGENTS.md, SECURITY.md | Media (sin lista formal de archivos) | **PARTIAL** |
| 21 | ¿Cómo crear una rama? | CONTRIBUTING sugiere `feature/...`; sin convención formal para ramas de docs | CONTRIBUTING.md | Media | **PARTIAL** |
| 22 | ¿Qué hacer antes del commit? | Ejecutar tests, build, checks; revisar git status | AGENTS.md, qa-produccion | Alta | **PASS** |
| 23 | ¿Qué decisiones no puede cambiar? | Autoridad de datos (ADR-001), Firestore cuentos, XP no decrece, KIDS/TEENS, entorno fail-closed | ADRs, ai-project-context | Alta | **PASS** |
| 24 | ¿Cuándo debe detenerse? | Ante entorno inseguro, migración destructiva, datos productivos sin autorización | ADR-006, ENVIRONMENTS | Media | **PARTIAL** (sin stop-condition formal) |
| 25 | ¿Cómo saber que una tarea está completa? | Checklist QA + verification commands; sin DoD formal | qa-produccion | Media | **PARTIAL** |

## 11. Agent Readiness Score

**Puntaje: 18 PASS + 7 PARTIAL + 0 FAIL = 72/100 → categoría `partial` (60–74).**

Interpretación honesta: un agente nuevo puede operar con seguridad en los dominios bien documentados (gobernanza, arquitectura, frontend, datos, diseño), autenticación y comandos de validación; pero para producto, seguridad consolidada, operaciones y cierre de tareas necesita leer varias fuentes y se topa con rutas rotas y documentos desactualizados. La falta de DoD, stop-condition y lista formal de archivos protegidos impide el salto a `adequate`.

**Principales bloqueos:**
1. No existe documento único de identidad/alcance del producto.
2. No existe security-baseline ni threat-model.
3. `api-crud.md`/`crud-roadmap.md` desactualizados.
4. Enlaces rotos tras la reorganización.
5. Entorno local de backend bloqueado (impide verificación autónoma).
6. Sin DoD / stop-condition / release-checklist.

## 12. Conclusión

- **¿Está DAEMON listo para que un agente nuevo trabaje autónomamente?** No del todo. Puede trabajar con **supervisión** en la mayoría de dominios (calificación `partial`, 72/100). La documentación de gobernanza, arquitectura, frontend y datos es suficiente; la de producto, seguridad consolidada y operaciones no lo es. Un agente autónomo de extremo a extremo correría riesgo de decisiones equivocadas por documentos desactualizados y rutas rotas.
- **¿Qué debe cerrarse antes de implementar cambios amplios?** (1) Corregir la variable `OPENROUTER_API_KEY_NUEVA` (GAP-009, código); (2) crear la Constitución del Proyecto (GAP-001) y product-overview/business-rules (GAP-002, documental); (3) data-ownership.md + entity-catalog (GAP-003, documental); (4) security-baseline + threat-model (GAP-004, documental); (5) corregir enlaces y archivar artefactos de reorganización (GAP-010); (6) el propietario debe reconfigurar el `.env` local o aprovisionar staging para desbloquear verificación local (GAP-005).
- **¿Cuál debe ser la siguiente fase?** **FND-2:** `project-constitution.md`. **FND-3:** `product-overview.md` + `business-rules.md`. **FND-4:** `system-architecture.md` + `backend-architecture.md` + índice ADR. **FND-5:** `data-ownership.md`, `entity-catalog.md`, `security-baseline.md`, `threat-model.md`, `environments.md`, `operations-runbook.md`. **FND-6:** `quality-gates.md` + actualización controlada de AGENTS.md (archivos protegidos, stop-condition y DoD). No se implementa ninguna recomendación en esta fase.
