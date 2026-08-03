# Entornos DAEMON

Este documento es el contrato operativo de `development`, `testing`, `staging`
y `production`. Ningún perfil puede usar recursos de otro como fallback.

## Matriz de aislamiento

| Perfil      | Angular/API                            | Firebase                                        | Datos                                     | Storage/realtime                                            | Indicador |
| ----------- | -------------------------------------- | ----------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------- | --------- |
| Development | `localhost:4200` / `localhost:8000`    | Auth y Firestore Emulator, proyecto `demo-*`    | PostgreSQL local                          | Supabase local o discos Laravel locales; Pusher desactivado | `LOCAL`   |
| Testing     | proceso Jest/PHPUnit/Playwright        | proyecto `demo-*`; sin credenciales de servidor | SQLite `:memory:` o contenedor CI efímero | discos/fakes locales; broadcast nulo                        | `LOCAL`   |
| Staging     | URLs HTTPS exclusivas                  | proyecto y sitio exclusivos                     | PostgreSQL/Supabase exclusivo             | buckets terminados en `-staging`, app Pusher separada       | `STAGING` |
| Production  | Firebase Hosting y API Render públicos | proyecto productivo                             | Supabase productivo                       | buckets y proveedores productivos                           | oculto    |

La configuración web pública de Firebase y la clave `anon` de Supabase no son
secretos de servidor. Aun así, pertenecen a un entorno concreto. Service
accounts, claves S3, `service_role`, passwords, tokens y secretos Pusher nunca
se versionan ni se imprimen en el precheck.

## Desarrollo local

Requisitos:

- PostgreSQL local en `127.0.0.1:5432` con una base `daemon_local`;
- Firebase CLI y Java para Auth/Firestore Emulator Suite;
- opcionalmente Supabase local en `127.0.0.1:54321` si se prueban subidas;
- datos sintéticos, nunca una copia cruda de estudiantes reales.

`backend-laravel/.env.example` ya contiene nombres locales. Si existe un `.env`
anterior, no se sobrescribe a ciegas: se reemplazan manualmente sus destinos y
se conserva cualquier backup fuera del repositorio.

Precheck y arranque:

```powershell
cd C:\laragon\www\daemon
node scripts/check-environment-safety.mjs --env-file=backend-laravel/.env
firebase emulators:start --project demo-daemon-local --only auth,firestore

cd backend-laravel
php artisan daemon:check-environment-safety
php artisan serve

cd ..\frontend-angular
npm start
```

`npm start`, `npm run start:local` y el servidor Playwright usan
`environment.development.ts`. No existe `start:cloud`. `.firebaserc` tiene
`demo-daemon-local` como proyecto por defecto para que una omisión de
`--project` no seleccione producción.

## Pruebas seguras

```powershell
cd C:\laragon\www\daemon
node scripts/check-environment-safety.mjs --ci
node --test scripts/check-environment-safety.test.mjs

cd frontend-angular
npm run test:ci

cd ..\backend-laravel
composer test
# Equivalente explícito:
php artisan test --env=testing
```

`--env=testing` es obligatorio cuando el `.env` habitual no es seguro: Laravel
debe cargar `.env.testing` antes de bootear providers. Testing fija SQLite en
memoria, Firebase `demo-*`, discos locales, correo array, cola sync y broadcast
nulo.

## Guard y excepción de solo lectura

El guard estático inspecciona archivos versionados. Para inspeccionar un archivo
efectivo sin mostrar sus valores:

```powershell
node scripts/check-environment-safety.mjs --env-file=backend-laravel/.env
```

Un diagnóstico local de solo lectura contra una URL productiva necesita el
flag temporal `--allow-production-read`. Este flag solo permite que el script
termine: no autoriza Laravel, E2E, escrituras ni comandos destructivos.

```powershell
node scripts/check-environment-safety.mjs `
  --env-file=backend-laravel/.env `
  --operation=read `
  --allow-production-read
```

`--operation=destructive` siempre falla si detecta producción. Los comandos
Artisan DAEMON con `--confirm` tienen una segunda barrera. En producción exigen
que `DAEMON_ALLOW_PRODUCTION_DESTRUCTIVE` sea exactamente el nombre del comando,
por ejemplo `daemon:aplicar-retencion`, y que esa autorización temporal se
retire al terminar. No se guarda en `.env.example` ni en el repositorio.

Laravel también prohíbe `migrate:fresh`, `migrate:refresh`, `migrate:reset`,
`migrate:rollback` y `db:wipe` cuando la conexión es Supabase. `composer setup`
no ejecuta migraciones. Toda migración local debe apuntar primero a la base
local, revisar `migrate:status` y usar `migrate --pretend` antes de una ejecución
explícita.

## Staging

Staging permanece fail-closed hasta que el propietario provisione recursos
separados. La plantilla versionada contiene dominios inválidos y no puede
ejecutarse ni desplegarse. El workflow manual genera el archivo real en el
runner y vuelve a ejecutar el precheck antes del deploy.

Variables GitHub `staging` requeridas:

- `STAGING_FIREBASE_PROJECT_ID`
- `STAGING_FIREBASE_SITE_ID`
- `STAGING_FRONTEND_URL`
- `STAGING_API_URL`
- `STAGING_ASSET_BASE_URL`
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_BUCKET` (termina en `-staging`)
- `STAGING_PUSHER_KEY`
- `STAGING_PUSHER_CLUSTER`
- `GCP_WIF_PROVIDER` y `GCP_DEPLOY_SERVICE_ACCOUNT`, cuando WIF esté disponible

Secrets GitHub `staging` requeridos:

- `STAGING_FIREBASE_CONFIG_JSON`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_FIREBASE_SERVICE_ACCOUNT_JSON` solo como fallback de WIF
- `STAGING_SENTRY_DSN`, opcional

Render staging debe usar `APP_ENV=staging`, `DAEMON_ENVIRONMENT=staging`, DB
distinta, `FIREBASE_PROJECT_ID` distinto y buckets
`daemon-assets-staging`/`daemon-private-staging`. `render.staging.yaml` declara
las variables sin valores sensibles.

## Producción y CI/CD

- Los PR compilan y prueban; no despliegan previews en el proyecto productivo.
- Staging se despliega solo por `workflow_dispatch` y GitHub environment
  `staging`.
- Firebase production se despliega solo desde `main`, en environment
  `production`, con proyecto y target explícitos y precheck previo.
- El entrypoint Render ejecuta el precheck antes de cualquier migración
  incremental controlada.
- Esta transformación no ejecuta deploys, migraciones ni escrituras en
  producción.

Variables backend mínimas por entorno remoto: `APP_ENV`,
`DAEMON_ENVIRONMENT`, `APP_URL`, `FRONTEND_URL`, `DB_*`,
`FIREBASE_PROJECT_ID`, credencial Firebase inyectada, `UPLOADS_DISK`,
`PRIVATE_UPLOADS_DISK`, `SUPABASE_STORAGE_*`, cola/cache/sesión y las variables
del proveedor realtime. Los valores se administran en Render/GitHub, no en
archivos versionados.

## Diagnóstico de bloqueo

Un mensaje `DAEMON bloqueo el entorno` es intencional. Corregir el destino; no
comentar el provider, no usar `--force` y no copiar credenciales de producción.
El error enumera campos y tipos de recurso, pero nunca imprime sus valores.

Referencias: [ADR-006](adr/ADR-006-entornos.md),
[infraestructura operativa](infraestructura-operativa.md) y
[Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite).
