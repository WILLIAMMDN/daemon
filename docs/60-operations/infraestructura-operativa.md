---
title: Infraestructura operativa DAEMON
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# Infraestructura operativa DAEMON

Estado tecnico al 15 de julio de 2026.

Actualización del 19 de julio: el monitor gratuito se ejecuta cada diez
minutos. Es una mitigación temporal sin SLA; ver
`implementacion-plataforma-estandar-2026-07-19.md`. La recuperación y las
barreras destructivas están en
`incidentes/2026-07-18-restauracion-supabase.md`.

## Topologia

```text
Firebase Hosting -> Angular -> Render/Laravel -> Supabase PostgreSQL
                                      |       -> Supabase Storage publico/privado
                                      |       -> Firebase Auth
                                      |       -> Pusher
                                      +------ -> Sentry
```

`render.yaml` define produccion. `render.staging.yaml` es una plantilla separada que nunca debe conectarse al proyecto Firebase, Supabase, Pusher o URLs de produccion.

## Puertas de despliegue

Un merge y un despliegue productivo son operaciones distintas. El
procedimiento completo esta en
[`despliegue-produccion.md`](despliegue-produccion.md).

- Los PR ejecutan auditoria npm/composer, Jest con cobertura, PHPUnit con cobertura, build Angular, E2E publico y CodeQL, y publican un preview channel de Firebase que expira a los 7 dias.
- Render queda declarado con `autoDeployTrigger: 'off'`: mergear a `main` no despliega el backend.
- Un push a `main` solo ejecuta *Main is deployable*, que construye y valida el commit **sin publicar nada**.
- La unica via de mutacion productiva es el workflow *Deploy production*, invocado explicitamente sobre un SHA exacto y aprobado en el environment `production`.
- El workflow de staging es manual y falla si detecta identificadores de produccion.
- Firebase admite OIDC/WIF con `GCP_WIF_PROVIDER` y `GCP_DEPLOY_SERVICE_ACCOUNT`. Mientras no se provisionen, conserva el secreto JSON como fallback para no interrumpir produccion.

## Runtime de Render

El entrypoint invalida caches cuando cambian variables, ejecuta
`daemon:check-environment-safety --operation=deploy` y solo después ejecuta la
migración incremental **si `RUN_MIGRATIONS` vale explícitamente `true`**. El
valor por defecto es `false`: un arranque de contenedor no declarado no muta el
esquema. Luego entrega PID 1 a Supervisor. Supervisor mantiene:

- Apache;
- `queue:work` con reciclaje cada hora;
- `schedule:work`.

No existe una ruta HTTP para ejecutar migraciones.

## Deploy Hook de Render

Con el auto-deploy apagado, el **Deploy Hook** del servicio `daemon` es el
mecanismo canonico de despliegue: el workflow *Deploy production* lo invoca
con `?ref=<SHA>` para publicar un commit exacto.

- **Helper reutilizable:** `scripts/render-deploy-hook.sh`
  - `bash scripts/render-deploy-hook.sh` — dispara deploy del ultimo commit de main.
  - `bash scripts/render-deploy-hook.sh --verify` — ademas monitorea `/salud` hasta que el commit cambie.
- **Credencial local (gitignored):** `scripts/render-deploy-hook.url` contiene la
  URL completa del hook. **Nunca committear ese archivo**: es una credencial que
  permite disparar deploys. Ya esta excluida en `.gitignore`.
- **CI/entorno:** el script tambien lee la variable `RENDER_DEPLOY_HOOK_URL`.
  En GitHub ese valor vive como **environment secret de `production`**, no
  como secret de repositorio: solo el despliegue aprobado puede usarlo.
- **Respuesta esperada:** `200` con `{"deploy":{"id":"dep-..."}}`.

El helper local es la via de escape si GitHub Actions no esta disponible.

## Backups

`.github/workflows/supabase-backup.yml` ejecuta diariamente:

1. `pg_dump` custom de PostgreSQL;
2. restauracion completa en un PostgreSQL 17 aislado;
3. checksum SHA-256;
4. copia de los buckets publico y privado, con verificacion del tar;
5. artefactos independientes de Supabase con retencion limitada.

Secretos requeridos en GitHub:

- `SUPABASE_BACKUP_DATABASE_URL`;
- `SUPABASE_STORAGE_ACCESS_KEY_ID`;
- `SUPABASE_STORAGE_SECRET_ACCESS_KEY`.

Restauracion segura:

```powershell
.\scripts\restore-supabase-backup.ps1 -BackupPath .\daemon-postgres.dump
.\scripts\restore-supabase-backup.ps1 -BackupPath .\daemon-postgres.dump -TargetDatabaseUrl $env:DAEMON_RESTORE_DATABASE_URL -Confirm
```

El primer comando solo valida. Produccion requiere ademas `-AllowProduction`; limpiar un destino requiere `-CleanTarget` explicito.

## Migracion de evidencias privadas

Despues de un backup verificado y de aplicar migraciones:

```powershell
cd backend-laravel
php artisan daemon:migrar-entregas-privadas
php artisan daemon:migrar-entregas-privadas --confirm
php artisan daemon:migrar-entregas-privadas --confirm --delete-source
```

Ejecutar primero la simulacion. La eliminacion del origen publico se hace solo despues de verificar que todos los objetos existen en `daemon-private`.

## Rollback

Procedimiento detallado en
[`despliegue-produccion.md`](despliegue-produccion.md#rollback). Resumen:

1. Suspender nuevos despliegues (el grupo de concurrencia `production-daemon` ya los serializa).
2. Restaurar la version anterior de Firebase Hosting desde su historial.
3. Volver a ejecutar *Deploy production* con el SHA anterior conocido como bueno.
4. Si una migracion no es compatible hacia atras, restaurar el backup verificado en una base aislada y validar antes de cambiar el destino de la API.
5. Ejecutar `scripts/smoke-produccion.ps1 -ExpectedRelease <SHA>` y comprobar `/api/v1/salud`.

No ejecutar `migrate:rollback` automaticamente en produccion: algunas migraciones transforman o cifran datos. `AppServiceProvider::boot()` ya prohibe `migrate:rollback`, `migrate:fresh`, `migrate:refresh`, `migrate:reset` y `db:wipe` cuando la conexion apunta a Supabase. La ventana de rollback se cierra en cuanto se crean datos nuevos sobre el esquema nuevo.

## Staging aislado

Para activar staging se deben crear recursos distintos y registrar variables/secrets en el environment GitHub `staging`:

- proyecto y sitio Firebase;
- servicio Render desde `render.staging.yaml`;
- proyecto Supabase y buckets `daemon-assets-staging`/`daemon-private-staging`;
- app Pusher;
- opcionalmente proyecto Sentry.

El workflow requiere `STAGING_FIREBASE_PROJECT_ID`, `STAGING_FIREBASE_SITE_ID`,
`STAGING_FRONTEND_URL`, `STAGING_API_URL`, `STAGING_ASSET_BASE_URL`,
`STAGING_SUPABASE_URL`, `STAGING_SUPABASE_BUCKET`,
`STAGING_SUPABASE_ANON_KEY`, `STAGING_PUSHER_KEY`,
`STAGING_PUSHER_CLUSTER` y `STAGING_FIREBASE_CONFIG_JSON`. Ver el contrato
completo en [`ENVIRONMENTS.md`](ENVIRONMENTS.md).
