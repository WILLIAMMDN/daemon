---
title: Changelog de transformación del portal estudiante
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# Changelog de transformación del portal estudiante

Este registro cubre únicamente la iniciativa
`refactor/student-production-hardening`. No implica despliegue ni estado
production-ready.

## 2026-08-02 — Paquete 3: Firestore versionado y seguro

### Añadido

- `firestore.rules` deny-by-default para el agregado v2 de cuentos.
- `firestore.indexes.json` con consultas de galería, borradores y comentarios.
- 31 escenarios con `@firebase/rules-unit-testing` y reporte de cobertura.
- Ejecución de Emulator Suite y artefacto de cobertura en Frontend CI.

### Corregido

- Ownership basado únicamente en Firebase UID.
- Campos, tipos, tamaños, enums, timestamps y updates quedan allowlisted.
- Comentarios directos son server-only y reacciones usan documento UID.
- Publicación, moderación, contadores, roles/XP y borrado del cuento dejan de
  estar disponibles para el cliente.

### Evidencia y gate

- 31/31 pruebas; 960/986 expresiones evaluadas (97.36%).
- No se desplegaron reglas ni índices.
- El deploy permanece bloqueado hasta migrar Angular legacy, claims y control
  plane Laravel en los siguientes paquetes.

## 2026-08-02 — Paquete 2: aislamiento de entornos

### Añadido

- Contrato frontend tipado para development, staging y production.
- Firebase Auth/Firestore Emulator Suite en desarrollo y etiqueta visible de
  entorno no productivo.
- Guard `scripts/check-environment-safety.mjs` con siete pruebas negativas.
- Guard Laravel de arranque y autorización exacta para comandos destructivos.
- Manual `docs/ENVIRONMENTS.md` e informe `02-environments.md`.

### Corregido

- `npm start` y Playwright dejaron de usar servicios cloud productivos.
- `.env.example` y `.env.testing` dejaron de contener destinos productivos.
- `.firebaserc` usa un proyecto `demo-*` seguro por defecto.
- Los PR dejaron de desplegar previews sobre Firebase production.
- `composer setup` dejó de ejecutar `migrate --force` automáticamente.

### Pendiente

- Aprovisionar proyecto Firebase, Supabase/PostgreSQL, Storage, Pusher y URLs
  reales de staging; la plantilla actual falla cerrada.
- Ejecutar E2E autenticado completo cuando existan fixtures y emuladores del
  siguiente paquete.

## 2026-08-02 — Paquete 1: arquitectura y autoridad de datos

### Añadido

- ADR-001: matriz de autoridad por entidad.
- ADR-002: autoridad Firestore y transición strangler de cuentos.
- ADR-003: autorización Firestore por UID, claims mínimos y control plane
  Laravel.
- ADR-004: contrato `RepositorioActivosCuento` y ciclo de vida de Storage.
- ADR-005: perfil de experiencia compartido KIDS/TEENS.
- ADR-006: aislamiento obligatorio de local, test, staging y producción.
- Informe `01-data-authority.md` con diagnóstico, aceptación y riesgos.
- Pruebas unitarias para la capa extraída de IA y validación de imágenes de
  cuentos.

### Corregido

- Se completó la extracción local incompleta de IA/imagen que impedía compilar
  `CrearCuento`, sin cambiar su flujo observable.
- El request Laravel vuelve a aceptar las seis escenas legacy y sanea su HTML,
  conservando el endpoint durante la transición strangler.
- Build/TypeScript y las suites frontend/Laravel vuelven a finalizar
  correctamente.

### Seguridad

- Se documentó que no se permite dual-write de cuentos.
- Publicación/moderación/borrado definitivo quedan reservados al servidor.
- No se habilitó acceso público, deploy, migración ni escritura productiva.

### Pendiente antes del siguiente paquete

- Aislar entornos antes de ejecutar E2E, reglas o scripts con escritura.
- Investigar los warnings de presupuesto de bundle/SCSS sin mezclar el trabajo
  arquitectónico con un rediseño visual.

## 2026-08-02 — Paquete 0: baseline y protección

### Añadido

- `00-baseline.md`.
- `00-command-results.md`.

### Detectado

- Build Angular en rojo por un refactor local incompleto de cuentos.
- Una prueba Laravel en rojo por reglas faltantes de la sexta escena.
- Configuraciones de desarrollo/cloud conectadas a producción.
- Doble autoridad mutable de cuentos y baja cobertura del módulo.
- Riesgo crítico de credencial IA versionada, pendiente de rotación externa.

## 2026-08-03 — Paquete 4/5: cierre documental, KIDS/TEENS, observabilidad y pruebas

### Añadido

- Informes 04 a 10 de la transformación y `docs/MIGRACION-CUENTOS.md`.
- `scripts/migrar-cuentos-dry-run.mjs` (solo emulador, no escribe) y
  `scripts/scan-secretos.mjs` (auditoría de secretos en CI).
- Contrato `perfil-experiencia-estudiante.ts` (KIDS/TEENS) con spec.
- Wrapper `core/servicios/observabilidad.ts` (Sentry sin PII) y cableado en el
  adaptador de comandos de cuentos.
- Specs de converters (cuento, página, comentario, reacción) y de casos de uso
  (crear/actualizar borrador, publicar, comentar, reaccionar).
- E2E `e2e/cuentos.spec.ts` con mocks estables.
- Catálogo interno `/dev/design-system` con guard de solo desarrollo.

### Reglas operativas

- Ningún comando tocó producción; el deploy de reglas v2 sigue bloqueado hasta
  migrar datos legacy y decidir el proveedor de Storage (bloque 1 diferido por
  el dueño).
