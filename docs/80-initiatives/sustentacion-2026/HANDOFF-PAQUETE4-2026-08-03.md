---
title: Handoff — Paquete 4: Cuentos v2 (corte local completo) — 2026-08-03
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# Handoff — Paquete 4: Cuentos v2 (corte local completo) — 2026-08-03

> **Propósito:** checkpoint del trabajo dejado por el agente (Codex) que se quedó sin
> tokens. Todo lo de este documento está **commiteado y validado** en la rama
> `refactor/student-production-hardening` del checkout `C:\laragon\www\daemon`.
> **No se desplegó nada a producción** durante este trabajo.

---

## 1. Qué es el Paquete 4

Bajo el contrato de `docs/sustentacion-2026/PROMPT-AGENTE-DEFINITIVO.md`:

- **Separar** dominio, aplicación, datos y presentación del módulo **Cuentos**
  (arquitectura hexagonal en el frontend Angular).
- **Mover el control plane a Laravel**: publicación, eliminación, comentarios,
  reacciones, activos e IA de cuentos pasan por comandos HTTP **idempotentes con
  precondiciones de versión de Firestore**; el navegador ya no eleva estado ni
  borra físicamente.
- **Reglas Firestore v2**: exigen `request.auth.uid`, timestamps de servidor y
  comandos privilegiados (solo el backend escribe agregados).
- **Storage validado por Laravel**: propiedad, MIME, dimensiones y path se validan
  en el servidor; los activos viven en disco privado con URLs temporales.

---

## 2. Frontend — arquitectura hexagonal (`frontend-angular/src/app/features/cuentos/`)

Nuevas carpetas (todas creadas en esta sesión):

| Capa | Archivos |
|---|---|
| `dominio/` | `cuento.modelo.ts`, `pagina-cuento.modelo.ts`, `comentario-cuento.modelo.ts`, `reaccion-cuento.modelo.ts`, `visibilidad-cuento.ts`, `estado-cuento.ts`, `politicas-cuento.ts`, `errores-cuento.ts` |
| `aplicacion/` | `crear-borrador.caso-uso.ts`, `actualizar-borrador.caso-uso.ts`, `publicar-cuento.caso-uso.ts`, `eliminar-cuento.caso-uso.ts`, `comentar-cuento.caso-uso.ts`, `reaccionar-cuento.caso-uso.ts`, `borrador-local-cuento.ts` (revisión optimista), `identificadores-cuento.ts`, `plantillas-cuento.ts`, `editor-cuento.facade.ts`, `galeria-cuentos.facade.ts`, `lectura-cuento.facade.ts`, `asistente-lectura-cuento.ts` |
| `acceso-datos/` | contratos: `cuento.repositorio.ts`, `comandos-cuento.gateway.ts`, `activos-cuento.repositorio.ts`, `asistente-cuento.gateway.ts`; adaptadores: `firestore/firestore-cuento.repositorio.ts` + converters, `http/api-comandos-cuento.adapter.ts`, `http/cuentos-ia.adapter.ts`, `storage/supabase-activos-cuento.adapter.ts`; `proveedores-cuentos.ts` (DI lazy) |
| `presentacion/` | `cuento-vista.modelo.ts`, `cuento-detalle-vista.modelo.ts` |

Páginas reescritas: `crear-cuento`, `galeria-proyectos`, `ver-cuento` (+ componentes
`cuento-hero`, `cuento-lectura`, `cuento-sidebar`, `cuento-comentarios`).
Nuevo servicio de imágenes: `services/cuentos-imagen.service.ts` + spec.

Eliminados (legacy): `models/cuento.models.ts`, `services/cuento.ts`,
`services/cuentos-ia.service.ts` y su spec, `core/servicios/almacenamiento-archivos.ts`
(la subida ahora va por Laravel).

Invariantes del borrador: autoguardado con debounce 2.5 s, revisión optimista para
evitar sobrescritura entre pestañas, recuperación local solo si coincide con la
revisión del servidor, publicación idempotente server-side.

---

## 3. Backend — control plane `CuentoV2` (`backend-laravel/app/`)

| Pieza | Archivo |
|---|---|
| Contrato | `Contracts/Cuento/CuentoDocumentoGateway.php`, `Contracts/Cuento/GeneradorTextoCuento.php` |
| Gateway REST | `Services/Cuento/FirestoreRestCuentoGateway.php` (Firestore por REST con service account; sin SDK de Firebase) |
| Servicio | `Services/Cuento/CuentoV2Service.php` (idempotencia, propiedad `autor_uid`, precondiciones de versión) |
| Activos | `Services/Cuento/ActivosCuentoService.php` (MIME, dimensiones, path seguro, disco privado, URLs TTL 5 min) |
| Asistente IA | `Services/Cuento/AsistenteCuentoService.php`, `ProveedorChatCuentoAdapter.php` |
| Controller | `Http/Controllers/Api/V1/CuentoV2Controller.php` |
| Requests | `ComandoCuentoV2Request`, `ComentarCuentoV2Request`, `EditarComentarioCuentoV2Request`, `ReaccionarCuentoV2Request`, `SubirActivoCuentoV2Request`, `GestionarActivoCuentoV2Request`, `LimpiarActivosCuentoV2Request`, `AsistirCuentoV2Request`, `PublicarCuentoV2AdminRequest` |
| Config | `config/cuentos.php`, `config/services.php`, `routes/api.php` (`/cuentos-v2/**` con throttle) |

Se reutilizan los providers de chatbot (`OllamaProvider`, `OpenRouterProvider`) para
el asistente de cuentos; los prompts viven en Laravel, no en Angular.

---

## 4. Reglas Firestore v2

- `firestore.rules` (nuevo): `request.auth.uid`, timestamps de servidor
  (`request.time`), escrituras de comentarios/reacciones vía comandos del backend,
  consultas acotadas, contadores autoritativos (sin `limit(100)` ni `length`).
- `firestore.indexes.json` (nuevo).
- `firebase.json`: emuladores de auth/firestore/UI configurados.
- Pruebas: `frontend-angular/tests/firestore/firestore.rules.test.mjs`
  (`npm run test:firestore-rules`) → **31/31 OK, 97.68% de cobertura de expresiones**
  (requiere JDK ≥ 21; local usa `C:\Program Files\Java\jdk-23`).

---

## 5. Entorno / tipado (frontend)

- `environments/environment.model.ts` (contrato `DaemonEnvironment`),
  `environment.assert.ts` (`assertEnvironmentContract` llamado en `main.ts`),
  `environment.production.ts`; se elimina `environment.cloud.ts`.
- `core/servicios/firebase-auth.ts` y `firestore-app.ts`: soporte de **emuladores**
  vía `environment.firebaseEmulators`.
- Indicador de entorno en `app.ts`/`app.html`/`app.scss`.
- `setup-jest.ts`: polyfill de `TextDecoder`/`TextEncoder`/streams/`MessagePort`/
  `fetch` (undici) para que los specs que importan `firebase/auth` corran en jsdom.

---

## 6. Validación (todo verde en este checkout)

| Comando | Resultado |
|---|---|
| `npm run build` (frontend-angular) | ✅ OK (solo warnings de presupuesto/bundle pre-existentes) |
| `php artisan test --env=testing` (backend) | ✅ **144 tests, 507 assertions** |
| `npm run test:ci` (frontend) | ✅ 23 suites / 77 tests + environment-safety + architecture + style-tokens + student-visual |
| `npm run test:firestore-rules` | ✅ 31/31 (JDK 23) |

Correcciones aplicadas durante el corte para dejarlo compilable:
1. `editor-cuento.facade.ts`: `this.activos.eliminar(referencia)` →
   `eliminarActivo(cuentoId, referencia)` (contrato del repositorio).
2. `setup-jest.ts`: polyfill de globals de Node para firebase/auth en jest.

---

## 7. Pendiente / próximos pasos (importante)

1. **No activar las reglas v2 en producción** sin migrar los datos: los borradores
   existentes usan el esquema legacy (`data_1..6`, sin UID/timestamps/version).
   El corte de código es reversible y local; la activación es una operación
   productiva que requiere plan de migración y OK del dueño.
2. Revisar `storage.rules` de Firebase (el adaptador ya sube por Laravel a disco
   privado; falta asegurar que Storage bloquee escrituras anónimas directas).
3. `cuento-legacy.ts` (utils) conserva utilidades de migración — evaluar su uso.
4. La rama `refactor/student-production-hardening` **no tiene upstream** todavía;
   falta push + PR cuando el dueño lo decida.
5. `.env.example` del backend quedó apuntando a local/emulador
   (`FIREBASE_PROJECT_ID=demo-daemon-local`, DB local); en Render/producción se
   debe restaurar `daemon-a41f8` y el pooler de Supabase.

---

## 8. Notas de la rama

- El branch acumula también trabajo de sesiones anteriores (environment-safety,
  staging, workflows, ADRs en `docs/adr/`, `docs/transformacion-estudiante/`,
  `docs/monitoring/`, `docs/ENVIRONMENTS.md`); se commiteó en una fase `chore(infra)`
  separada para no mezclar con el Paquete 4.
- Los tests usan sqlite `:memory:`; no se tocó la DB de producción.
- Se agregó `storage/framework/views/.gitignore` y `firestore-debug.log` a `.gitignore`.
