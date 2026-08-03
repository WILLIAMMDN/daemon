## Paquete completado

Paquete 2 — aislamiento real y fail-closed de entornos.

### Objetivo

Impedir que desarrollo, tests, E2E, agentes o staging alcancen por accidente la
API, Firebase, PostgreSQL/Supabase, Storage o realtime productivos. Una
configuración incompleta o mezclada debe fallar antes de iniciar la aplicación,
probar o desplegar.

### Diagnóstico verificado

- `npm start` y Playwright arrancaban `environment.cloud.ts`, conectado a
  Render, Firebase, Supabase y Pusher productivos.
- `environment.development.ts` combinaba API local con Firebase y Storage
  productivos.
- `.firebaserc` seleccionaba producción cuando se omitía `--project`.
- `.env.example` proponía PostgreSQL, Firebase, URLs y Storage productivos.
- El `.env` local ignorado sigue conteniendo destinos productivos conocidos.
- `.env.testing` usaba SQLite, pero no fijaba Firebase/Storage ni el root de la
  aplicación ante un `vendor` compartido por junction.
- `composer setup` ejecutaba `migrate --force` automáticamente.
- Los comandos DAEMON con `--confirm` tenían dry-run, pero no una autorización
  adicional por destino.
- Los PR desplegaban previews dentro del proyecto Firebase productivo.
- Staging tenía controles parciales, pero no configuración Supabase web ni
  comprobación de coherencia entre el proyecto de deploy y el proyecto Auth.

### Decisiones adoptadas

- `environment.ts` es seguro por defecto y reexporta development; producción y
  staging sólo entran mediante file replacement explícito.
- Development usa API loopback, Supabase local, Firebase `demo-*`, Auth
  Emulator y Firestore Emulator; realtime externo está desactivado.
- Staging conserva una plantilla deliberadamente inválida hasta que el workflow
  manual genere una configuración aislada y verificable.
- Production es el único archivo frontend con fingerprints productivos.
- Los entornos no productivos muestran `LOCAL` o `STAGING`; producción no
  muestra indicador.
- El guard Node inspecciona archivos versionados y archivos `.env` efectivos
  sin imprimir valores.
- Laravel valida `APP_ENV`, `DAEMON_ENVIRONMENT`, DB, Firebase, URLs, Storage y
  realtime durante el boot. Staging exige recursos/credenciales presentes y
  producción exige fingerprints conocidos.
- Los comandos destructivos DAEMON requieren autorización exacta y temporal en
  producción; los comandos destructivos nativos de migración siguen
  prohibidos sobre Supabase.
- PR valida y compila sin deploy. Staging es manual. Production permanece
  restringida a `main`, environment protegido, proyecto explícito y precheck.
- No se modificó el `.env` local ignorado para no sobrescribir credenciales del
  propietario: ahora queda bloqueado hasta que se reconfigure a recursos
  locales.

### Archivos creados

- `scripts/check-environment-safety.mjs`
- `scripts/check-environment-safety.test.mjs`
- `docs/ENVIRONMENTS.md`
- `docs/transformacion-estudiante/02-environments.md`
- `frontend-angular/src/environments/environment.model.ts`
- `frontend-angular/src/environments/environment.assert.ts`
- `frontend-angular/src/environments/environment.production.ts`
- `backend-laravel/config/environment-safety.php`
- `backend-laravel/app/Support/EnvironmentSafety.php`
- `backend-laravel/app/Console/Commands/CheckEnvironmentSafety.php`
- `backend-laravel/app/Console/Commands/Concerns/ProtectsDestructiveOperations.php`
- `backend-laravel/tests/Unit/EnvironmentSafetyTest.php`

### Archivos modificados

- Entornos/build/arranque Angular: `angular.json`, `package.json`,
  `playwright.config.ts`, `environment.ts`, `environment.development.ts`,
  `environment.staging.ts`, `main.ts`.
- Firebase/realtime frontend: `firebase-auth.ts`, `firestore-app.ts`,
  `notificaciones.service.ts`.
- Indicador visual: `app.ts`, `app.html`, `app.scss`.
- Generación staging: `generate-staging-environment.mjs`.
- Configuración local/test Laravel: `.env.example`, `.env.testing`,
  `phpunit.xml`, `composer.json`, `tests/TestCase.php`.
- Guard backend/runtime: `AppServiceProvider.php`, `docker/entrypoint.sh` y seis
  comandos DAEMON destructivos.
- Firebase/Render: `.firebaserc`, `firebase.json`, `render.staging.yaml`.
- CI/CD: workflows frontend, backend, PR Firebase, merge Firebase y staging.
- Documentación: `README.md`, `frontend-angular/README.md`, `docs/README.md`,
  `docs/qa-produccion.md`, `docs/infraestructura-operativa.md`, ADR-006 y
  changelog de transformación.

### Archivos eliminados

- `frontend-angular/src/environments/environment.cloud.ts`

### Comandos ejecutados

- `node scripts/check-environment-safety.mjs --ci`
- `node --test scripts/check-environment-safety.test.mjs`
- prechecks negativos contra `.env` local, staging placeholder y operación
  destructiva/configuración Firebase discordante
- generación staging sintética aislada y revalidación (sin secretos reales)
- `npm run build`
- `npm run test:ci`
- `npx playwright install chromium`
- `npm run e2e:public`
- `composer test`
- `php artisan daemon:check-environment-safety --env=testing`
- `vendor/bin/pint ...`
- `npx prettier --write ...`
- `git diff --check`
- `git status --short --branch`

No se ejecutó `firebase deploy`, deploy Render, migración, seed, tinker, query a
PostgreSQL/Supabase ni escritura productiva.

### Pruebas

| Prueba                       | Resultado             | Evidencia                                                                                                                    |
| ---------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Guard estático versionado    | OK                    | Development/test sin fingerprints productivos; production y CI coherentes.                                                   |
| Regresiones Node             | OK                    | 7/7: DB local productiva, Firebase de test productivo, staging compartido, destructivo productivo y autorización de lectura. |
| `.env` local efectivo        | Bloqueo esperado      | Exit 1; detecta DB/Firebase/Storage/Pusher productivos sin mostrar valores.                                                  |
| Staging placeholder          | Bloqueo esperado      | Exit 1 con `--require-configured-staging`.                                                                                   |
| Staging sintético aislado    | OK                    | Generador, precheck y build pasan con proyectos/URLs ficticios distintos.                                                    |
| Staging Firebase discordante | Bloqueo esperado      | El JSON Auth y el project ID de deploy distintos producen exit 1.                                                            |
| Build Angular production     | OK con deuda conocida | Compila; mantiene warnings de bundle/SCSS/Angular/Sass/CommonJS documentados.                                                |
| Checks y Jest frontend       | OK                    | 22 suites, 77 tests; 71.56% statements, 49.37% branches.                                                                     |
| Laravel                      | OK                    | 139 tests, 482 assertions, SQLite en memoria.                                                                                |
| E2E público Playwright       | OK                    | 1/1 contra `start:local`; no alcanzó servicios productivos.                                                                  |
| Pint acotado/Prettier/diff   | OK                    | Archivos del paquete con formato válido y sin whitespace errors.                                                             |

### Comparación antes/después

| Antes                                                            | Después                                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `npm start`/E2E usaban cloud productivo                          | Ambos usan development local y emuladores.                                |
| Development mezclaba API local con Firebase/Supabase productivos | Todos los destinos son loopback/demo y Pusher está apagado.               |
| Producción era el contenido implícito de `environment.ts`        | Producción requiere `environment.production.ts` por replacement.          |
| Firebase CLI elegía producción por defecto                       | El default es `demo-daemon-local`; deploys remotos fijan proyecto.        |
| `.env.example` enseñaba destinos productivos                     | Enseña PostgreSQL/Firebase/Storage locales sin credenciales.              |
| Un APP_ENV erróneo podía bootear contra producción               | Node y Laravel comparan nombre con fingerprints reales y fallan cerrados. |
| `composer setup` migraba con `--force`                           | Sólo genera key y ejecuta precheck; la migración es explícita.            |
| `--confirm` bastaba para comandos DAEMON productivos             | Se exige además autorización exacta y temporal.                           |
| PR desplegaba preview en Firebase production                     | PR sólo prueba y compila.                                                 |
| Staging podía mezclar proyectos no productivos distintos         | Generador compara Firebase deploy/Auth y revalida todo antes de deploy.   |

### Riesgos resueltos

- Escrituras accidentales desde Angular development, Playwright o tests hacia
  servicios productivos.
- Selección implícita del proyecto Firebase productivo.
- Bootstrap Laravel local/test contra PostgreSQL, Firebase o Storage
  productivos.
- Migración destructiva automática desde `composer setup`.
- Comandos DAEMON destructivos autorizados sólo por un `--confirm` genérico.
- Preview de PR desplegado dentro del proyecto Firebase productivo.
- Staging con placeholders o project IDs discordantes llegando al deploy.
- Inferencia errónea del root de Laravel cuando `vendor` es junction/symlink.

### Riesgos pendientes

- El `.env` local real conserva destinos productivos. Ya no puede bootear, pero
  el propietario debe reemplazarlo por valores locales antes de desarrollar.
- Los recursos reales de staging aún no están aprovisionados; el workflow falla
  cerradamente hasta entonces.
- Las reglas Firestore existentes y sus pruebas con Rules Unit Testing se
  abordan en el Paquete 3.
- El build conserva deuda previa: bundle inicial ~1.29 MB sobre warning de 1 MB,
  `crear-cuento.scss` ~34.72 kB, imports Angular no usados, `@import` Sass
  deprecado y `quill-delta` CommonJS.
- `pint --test` global detecta deuda de formato preexistente fuera del paquete;
  el check acotado a todos los PHP creados/modificados por este paquete pasa.
- La suite E2E autenticada necesita fixtures y estado determinista de
  emuladores; sólo se ejecutó el smoke público seguro.

### Bloqueos

No hay bloqueo de código para cerrar el Paquete 2. Hay dos bloqueos operativos
intencionales: `.env` local inseguro y staging no aprovisionado. Ambos fallan
antes de cualquier conexión/escritura y no se resolvieron copiando secretos ni
usando producción como fallback.

### Próximo paquete

Paquete 3 — endurecimiento de Firestore Rules, claims mínimos, índices y tests
deterministas con `@firebase/rules-unit-testing` sobre Emulator Suite. No se
desplegarán reglas a producción desde esta rama.
