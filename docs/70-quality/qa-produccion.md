---
title: DAEMON QA de produccion
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# DAEMON QA de produccion

Usar este checklist antes y despues de cambios relevantes en produccion.
No guardar contrasenas reales en este archivo.

## Verificacion automatica

```powershell
cd C:\laragon\www\daemon
.\scripts\smoke-produccion.ps1

cd C:\laragon\www\daemon\frontend-angular
npm test -- --runInBand
npm run test:firestore-rules
npm run build

cd C:\laragon\www\daemon\backend-laravel
php artisan test --env=testing

cd C:\laragon\www\daemon
```

Resultado esperado:

- `smoke-produccion.ps1` termina con `Production smoke test finished successfully`.
- El build Angular termina sin errores.
- Las pruebas Jest y Laravel pasan.
- Las pruebas Firestore Rules pasan contra `demo-daemon-rules` y generan
  `reports/firestore-rules/rule-coverage-summary.json`.
- `/api/v1/salud` responde `ok: true`, base de datos OK y `uploads_disk: supabase`.
- `ngsw-worker.js` responde JavaScript y `ngsw.json` responde JSON.
- Los bundles desplegados contienen `verificacion=firebase` y `reset=firebase`.
- Los bundles desplegados no llaman `/auth/recuperar` ni `/auth/enviar-verificacion`.
- El grupo `app-shell` de `ngsw.json` precarga solo shell principal; chunks JS y
  CSS de módulos permanecen en el grupo lazy.

## Modos de ejecucion local

El modo local predeterminado usa exclusivamente infraestructura local:

```powershell
cd C:\laragon\www\daemon\frontend-angular
npm run start
```

Este comando usa `environment.development.ts`, requiere la API en
`http://localhost:8000/api/v1` y conecta Firebase Auth/Firestore a emuladores.
`npm run start:local` es un alias explícito del mismo perfil. Antes de arrancar,
seguir el precheck de [`ENVIRONMENTS.md`](../60-operations/ENVIRONMENTS.md).

## Firestore Rules local

`npm run test:firestore-rules` requiere Java 21 o superior, fija Firebase CLI y
arranca sólo Firestore Emulator con un project ID `demo-*`. El comando debe
mostrar que los servicios no emulados del proyecto demo fallan cerrados. Nunca
sustituir ese ID por `daemon-a41f8` para pruebas.

La suite exporta el JSON crudo y el resumen de cobertura bajo
`frontend-angular/reports/firestore-rules/`. CI conserva el artefacto 14 días.
No ejecutar `firebase deploy` desde la rama de refactor; el gate de despliegue
está documentado en
[`03-firestore-security.md`](../80-initiatives/student-transformation/03-firestore-security.md).

## QA visual del portal alumno

El rediseño del portal se validó con un backend Laravel local aislado y una
base SQLite temporal. Este método permite cargar dashboard, perfil, misiones,
ranking y tienda sin modificar Supabase ni cuentas reales.

Reglas para repetirlo:

- usar un puerto distinto al backend local habitual;
- crear la SQLite dentro de `backend-laravel/storage/framework/testing`;
- definir la conexión mediante variables de entorno del proceso;
- sembrar solo datos ficticios;
- eliminar base, logs y procesos temporales al terminar;
- restaurar `environment.development.ts` antes de hacer commit.

No documentar contraseñas de producción ni reutilizar un usuario real para una
prueba destructiva.

Resoluciones mínimas:

```text
Escritorio: 1440 x 900
Móvil:       390 x 844
```

Pantallas obligatorias:

- `/alumno`;
- `/alumno/perfil`;
- `/alumno/misiones`;
- `/alumno/misiones/:id`;
- `/alumno/ranking`;
- `/alumno/tienda`;
- `/alumno/canjes`.

Comprobar visualmente:

- header consistente entre módulos;
- sidebar y navegación inferior sin cambios de ruta;
- XP y DAEMONS con etiquetas y colores distintos;
- ranking visible, marcado para el usuario actual y limitado a su grupo;
- actividad semanal basada en fechas reales, no en siete casillas derivadas de la racha;
- tarjetas sin texto cortado;
- cuadrículas apiladas correctamente en móvil;
- botones táctiles y visibles;
- estados vacíos intencionales;
- fallback de premios cuando una imagen no existe.

## Auditoría del sistema visual

```powershell
cd C:\laragon\www\daemon\frontend-angular
$targets = @(
  'src\app\core\layouts\layout-alumno',
  'src\app\features\alumno',
  'src\app\features\misiones',
  'src\app\features\ranking',
  'src\app\features\tienda',
  'src\styles.scss',
  'src\styles\_components.scss',
  'src\index.html'
)
rg -n -- "linear-gradient|radial-gradient|bg-gradient|Outfit" $targets
```

La búsqueda debe terminar sin coincidencias en el alcance del portal alumno.
También verificar que no se modificó accidentalmente el componente sidebar:

```powershell
git diff --name-only -- `
  frontend-angular/src/app/core/layouts/sidebar-portal `
  frontend-angular/src/app/core/layouts/portal-sidebar.config.ts
```

## Flujo alumno

- Abrir `https://daemonestudiante.web.app/login`.
- Iniciar sesion con una cuenta de alumno de prueba.
- Confirmar que redirige a `/alumno` o `/bienvenida` si el perfil esta incompleto.
- Revisar que carguen panel, perfil, misiones, tienda, evaluaciones, chatbot, cuentos, ranking, comunidad y certificado.
- Si el alumno tiene correo no verificado, confirmar que aparece el banner de verificacion.
- No ejecutar canjes, entregas o cambios permanentes salvo que la cuenta sea de prueba.

## Flujo docente

- Abrir `https://daemonestudiante.web.app/login-docente`.
- Iniciar sesion con una cuenta docente o admin de prueba.
- Confirmar acceso a `/docente`.
- Revisar panel, alumnos, aulas, misiones, entregas, insignias, tienda, evaluaciones, competencia, rondas y tokens.
- Confirmar que un usuario alumno no pueda entrar al portal docente.
- No borrar alumnos, misiones, premios o archivos reales durante QA.

## Flujo familias

- Abrir `/familias/acceso` y probar email/clave y Google con una cuenta tutor.
- Confirmar que un correo no verificado no revele nombres, progreso ni vínculos
  de menores.
- Verificar el correo y regresar a `/familias?verificacion=firebase`.
- Aceptar una invitación declarando parentesco y confirmar que el menor aparece
  recién después de esa aceptación explícita.
- Revisar XP, misiones, evaluaciones, actividad y posición contextual del
  ranking; no debe aparecer el saldo de DAEMONS, chats ni evidencias privadas.
- Guardar límite diario y horario de descanso. En el portal alumno, confirmar
  la pausa amigable al excederlos y el restablecimiento al siguiente día.
- Confirmar que membresía/pagos solo enlaza un portal HTTPS externo y que ningún
  formulario DAEMON solicita tarjeta, CVC o datos bancarios.
- Probar escritorio `1440 x 900` y móvil `390 x 844`.

## Auth y correos

- Registro con email debe crear cuenta en Firebase y DAEMON.
- Verificacion de correo debe volver a `/alumno?verificacion=firebase`.
- Recuperacion de clave debe usar Firebase y volver a `/login?reset=firebase`.
- El frontend no debe llamar `/auth/recuperar` ni `/auth/enviar-verificacion` en los flujos activos.
- Google login debe validar rol: alumno hacia `/alumno`, docente/admin hacia `/docente` y tutor hacia `/familias`.

## Archivos y assets

- Assets estaticos (`img`, `galeria`, `audio`, `rive`, `legacy`) deben cargar desde Firebase Hosting.
- Uploads de negocio (`uploads/...`) deben resolver desde Supabase Storage.
- Confirmar visualmente avatar, fondos, insignias, premios y evidencias en una cuenta de prueba.
- Forzar una URL de premio inválida y confirmar que Tienda muestra el ícono de
  fallback en vez de texto o imagen rota.

## Seguridad rapida

- Confirmar `Access-Control-Allow-Origin: https://daemonestudiante.web.app`.
- Confirmar `Access-Control-Allow-Credentials: true`.
- Confirmar cabeceras `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY`.
- Revisar que no haya `.env`, service accounts, tokens privados ni dumps sensibles en Git.

## Verificación del despliegue

El flujo normal es:

```text
push de rama
  -> PR preview de Firebase
  -> merge convencional a main
  -> test Angular
  -> build Angular
  -> Firebase Hosting deploy
  -> smoke-produccion.ps1
```

Después del workflow, comparar el bundle local con el publicado:

```powershell
cd C:\laragon\www\daemon
$html = (Invoke-WebRequest `
  -Uri 'https://daemonestudiante.web.app' `
  -UseBasicParsing `
  -TimeoutSec 30).Content
$deployed = [regex]::Match($html, 'main-[A-Z0-9]+\.js').Value
$local = (Get-ChildItem `
  'frontend-angular\dist\frontend-angular\browser\main-*.js' |
  Select-Object -First 1).Name
$local -eq $deployed
```

Debe devolver `True`. Esto confirma que Firebase sirve el mismo bundle que se
validó localmente.
## Verificación del fix "login local -> Firebase" (PR #60)

Fecha de auditoría automática: 2026-08-03.

### Estado verificado automáticamente

| Check | Comando | Resultado | Conclusión |
|---|---|---|---|
| Frontend desplegado con el fix | `curl https://daemonestudiante.web.app/ \| grep daemon-release` | `740f77d...` | ✅ El frontend SÍ tiene el fix (release stamp = commit del PR #60) |
| Endpoint del fix en backend | `curl -X POST https://daemon-5vo1.onrender.com/api/v1/auth/firebase-token` | `404` | ❌ El backend NO tiene el fix desplegado |
| Commit desplegado en Render | `curl https://daemon-5vo1.onrender.com/api/v1/salud` | `7432305` (8 commits detrás de main) | ❌ Render está atrasado |

### BLOQUEANTE: el backend de Render debe redeployarse

Render usa `autoDeployTrigger: checksPass` sobre `main`. Al momento de la
auditoría seguía en `7432305` y el endpoint `POST /auth/firebase-token`
respondía `404` (en vez de `401` sin sesión). Mientras siga en 404:

- El login local llamará al endpoint, fallará y caerá al *best-effort*:
  el login no se rompe, pero la galería seguirá mostrando
  «No hay una sesión de Firebase activa».
- El login email y Google no dependen de este endpoint, así que esos dos
  flujos deberían funcionar ya.

Verificación de que el backend quedó al día (repetir hasta que pase):

```bash
curl https://daemon-5vo1.onrender.com/api/v1/salud | grep commit
# debe mostrar 740f77d (o un descendiente de main)

curl -o /dev/null -w '%{http_code}' \
  -X POST https://daemon-5vo1.onrender.com/api/v1/auth/firebase-token
# SIN sesión debe responder 401 (no 404)
```

### Plan manual de los 3 logins (ejecutar solo con cuentas de prueba)

Reglas: usar exclusivamente cuentas de prueba (nunca menores reales), no
canjear ni borrar datos, y anotar todo en la tabla de resultados.

#### 1. Login local (usuario/contraseña de Laravel)

1. Abrir `https://daemonestudiante.web.app/login` en ventana de incógnito.
2. Entrar con usuario + contraseña de prueba (sin `@`).
3. Confirmar que redirige a `/alumno`.
4. Abrir `/alumno/proyectos/cuentos`.
5. **Esperado:** la galería carga (tarjetas o estado vacío intencional).
   **No esperado:** tarjeta roja «No hay una sesión de Firebase activa».
6. Crear un cuento, añadir una página, guardar y recargar: el borrador debe
   persistir (se crea el usuario Firebase `daemon-{id}` en el primer uso).
7. Consola (F12): no debe aparecer el error de sesión de Firebase.

#### 2. Login email (Firebase email/password)

1. Ventana de incógnito nueva → `/login`.
2. Entrar con una cuenta de prueba con `@` (usa Firebase Auth).
3. Abrir `/alumno/proyectos/cuentos` → la galería debe cargar.
4. Si esa cuenta de prueba comparte email con una cuenta local previa,
   verificar que sus cuentos siguen siendo los mismos (reconciliación por
   email: el fix adopta el UID existente en lugar de partir la identidad).

#### 3. Login Google

1. Ventana de incógnito nueva → `/login` → botón de Google.
2. Entrar con una cuenta de prueba de Google.
3. Abrir `/alumno/proyectos/cuentos` → la galería debe cargar.
4. Reconciliación: si el email de Google coincide con una cuenta local,
   los cuentos deben aparecer intactos (mismo UID).

### Tabla de resultados (para llenar tras el redeploy del backend)

| Login | ¿Redirige bien? | ¿Galería carga? | ¿Error de sesión Firebase? | ¿Persiste borrador? | Consola limpia (salvo 403 broadcasting conocido)? | Observaciones |
|---|---|---|---|---|---|---|
| Local | | | | | | |
| Email | | | | | | |
| Google | | | | | | |

### Notas

- El `403` de `/broadcasting/auth` en consola es el problema de websockets
  ya conocido; no bloquea la galería.
- El warning de `favicon.png` (512x512 declarado, 128x128 real) es
  cosmético y se corrige aparte.
- No probar los 3 logins con la misma cuenta real de un menor; usar cuentas
  de prueba por cada flujo.

---

## Auditoría: por qué Render no desplegó `740f77d` (2026-08-03)

### Estado verificado (automático, sin tocar el dashboard)

| Check | Comando | Resultado | Conclusión |
|---|---|---|---|
| Commit desplegado en Render | `curl /api/v1/salud` | `743230502d8...` | Render está **10 commits atrás** de main |
| Endpoint `POST /auth/firebase-token` | `curl -X POST` | `404` | El fix de auth NO está en producción |
| Checks de GitHub en `740f77d` y `85e1f65` | `gh api .../check-runs` | `build_and_deploy` + `backend` verdes | `checksPass` está satisfecho del lado de GitHub |
| Webhooks de repo | `gh api repos/WILLIAMMDN/daemon/hooks` | lista vacía | Render usa GitHub App (no webhook clásico); no verificable por API |
| Migraciones nuevas `7432305..main` | `git diff --stat` | 0 archivos | Un redeploy **no ejecuta migraciones nuevas** (seguro) |
| `APP_VERSION` en el contenedor vivo | `config('app.version')` en `/salud` | `development` | El servicio de Render **no se creó desde `render.yaml`** (o sus env vars difieren) |

### Diagnóstico (CORREGIDO el 2026-08-03 tras el screenshot del dashboard)

**Causa raíz real: el build de Docker falla**, no el webhook. El dashboard de
Render muestra `Deploy failed for 740f77d` y `Deploy failed for 85e1f65` con
`Exited with status 1 while building your code`. El auto-deploy SÍ funciona
(`Deploy started for 740f77d` a las 18:30, disparado solo); lo que muere es el
build.

Reproducción local (sin `.env`, como en el build de Docker):

```bash
cd backend-laravel
# sin .env presente:
composer dump-autoload --optimize --no-dev   # ANTES: falla
# -> post-autoload-dump -> package:discover -> arranca Laravel sin env vars
# -> AppServiceProvider::boot() -> EnvironmentSafety::assertRuntimeSafe()
# -> LogicException (APP_ENV=production por defecto, sin DAEMON_ENVIRONMENT)
# -> exit 1  ===  "Exited with status 1 while building your code"

composer dump-autoload --optimize --no-dev --no-scripts   # DESPUÉS: exit 0
```

El `EnvironmentSafety::assertRuntimeSafe()` es correcto en runtime (protege
producción), pero rompía el **build** porque el Dockerfile corría los scripts
de Composer sin las env vars reales de Render.

### Fix aplicado (PR pendiente)

- `backend-laravel/Dockerfile`: `composer dump-autoload --optimize --no-dev`
  ahora incluye `--no-scripts` (no bootear Laravel en build).
- `backend-laravel/docker/entrypoint.sh`: se añade `php artisan
  package:discover --ansi` en el bloque de cache, con las env vars reales ya
  inyectadas por Render.
- Verificación local: `composer dump-autoload --optimize --no-dev --no-scripts`
  sin `.env` termina con `EXIT=0` (7589 clases).

### Acción requerida (tras merge del fix)

1. Mergear el fix del Dockerfile/entrypoint a `main` (PR).
2. Disparar el deploy:

```bash
bash scripts/render-deploy-hook.sh
```

3. Confirmar:

```bash
curl -s https://daemon-5vo1.onrender.com/api/v1/salud | grep commit
# esperado: 85e1f65... (o descendiente)
curl -s -o /dev/null -w '%{http_code}' -X POST \
  https://daemon-5vo1.onrender.com/api/v1/auth/firebase-token
# esperado: 401 (existe y exige sesión), ya NO 404
```

### Riesgo del redeploy

Bajo: no hay migraciones nuevas entre el commit desplegado y main; la suite
backend pasa (150 tests); el entrypoint solo cachea config y ejecuta
`migrate --force` (no-op). Si el usuario ya registró una cuenta de Firebase con
el mismo email, la reconciliación adopta ese UID (no se parte la identidad).

---

## SEGUIMIENTO 2026-08-04 (build arreglado, falta contrato de entorno)

### 1. Build de Docker — RESUELTO (PR #62, `3f5e595`)

El build fallaba con `Exited with status 1 while building your code` porque
`composer dump-autoload` corría `post-autoload-dump` → `package:discover` →
arrancaba Laravel sin `.env` → `EnvironmentSafety::assertRuntimeSafe()` lanzaba
`LogicException`.

Fix: `--no-scripts` en el `composer dump-autoload` del Dockerfile y
`php artisan package:discover --ansi` en `docker/entrypoint.sh` (con las env
vars reales ya inyectadas). Reproducido localmente sin `.env`: antes fallaba,
con el fix `EXIT=0`. El dashboard ahora muestra `while running your code` en
vez de `while building your code` → el build YA PASA.

### 2. Runtime — BLOQUEADO por el contrato de entorno (accion del usuario)

El entrypoint ejecuta `daemon:check-environment-safety --operation=deploy`,
que exige que las env vars de Render cumplan el contrato de produccion. El
dashboard NO esta sincronizado con `render.yaml` (evidencia: `/salud` reporta
`version: development` en vez de `2026.07`).

Simulaciones del check (solo lectura):

| Escenario | Resultado |
|---|---|
| Con todas las vars de `render.yaml` | `OK: el entorno Laravel es coherente` |
| Sin `APP_URL` | `Produccion no coincide con el fingerprint esperado de api` |
| Con `APP_DEBUG=true` | `APP_DEBUG debe estar desactivado en produccion` |
| Sin `DAEMON_ENVIRONMENT` (con RENDER=true) | OK (Render inyecta RENDER=true) |

**Accion en el dashboard de Render** (servicio `daemon` → Environment):
agregar/verificar como minimo:

```text
APP_URL=https://daemon-5vo1.onrender.com
APP_VERSION=2026.07
DAEMON_ENVIRONMENT=production
APP_DEBUG=false
FRONTEND_URL=https://daemonestudiante.web.app
FIREBASE_PROJECT_ID=daemon-a41f8
```

Y confirmar que el resto de `render.yaml` (DB, Storage, Pusher, Firebase
service account) este presente. Luego re-disparar:

```bash
bash scripts/render-deploy-hook.sh
```

Verificar:

```bash
curl -s https://daemon-5vo1.onrender.com/api/v1/salud | grep -oE '"(version|commit)":"[^"]+"'
# version debe ser 2026.07 y commit 3f5e595 (o descendiente)
curl -s -o /dev/null -w '%{http_code}' -X POST \
  https://daemon-5vo1.onrender.com/api/v1/auth/firebase-token
# 401 (existe y exige sesion), ya NO 404
```

## Incidente de deploy de Render: resolucion 2026-08-03/04

### Sintoma

Todos los deploys de Render posteriores al commit `7432305` fallaban con
`Exited with status 1 while building your code` en el dashboard. El servicio
seguia sirviendo el ultimo build bueno, por lo que `/salud` no cambiaba de
commit y el endpoint `/auth/firebase-token` respondia `404`.

### Causa raiz 1 (build): `package:discover` sin env vars

El refactor anadio `EnvironmentSafety::assertRuntimeSafe()` al `boot()` de
`AppServiceProvider`. En el Dockerfile, `composer dump-autoload` disparaba el
script `post-autoload-dump` -> `package:discover`, que arranca Laravel **sin
`.env` ni env vars reales** durante el build -> `LogicException` -> exit 1.

Fix (PR #62, commit `3f5e595`): `--no-scripts` en `composer dump-autoload` del
Dockerfile y `package:discover` ejecutado en `entrypoint.sh` con las env vars
ya inyectadas por Render. Reproducido localmente: antes fallaba, despues el
paso del build termina en `EXIT=0`.

### Causa raiz 2 (runtime): contrato de entorno no sincronizado

Con el build reparado, el contenedor moria al arrancar (`while running`): el
entrypoint ejecuta `daemon:check-environment-safety --operation=deploy`, y el
dashboard de Render no estaba sincronizado con `render.yaml` (evidencia:
`/salud` reportaba `version: development`).

Fix (dashboard de Render): agregar/verificar las vars de `render.yaml`:

```text
APP_URL=https://daemon-5vo1.onrender.com
APP_VERSION=2026.07
DAEMON_ENVIRONMENT=production
APP_DEBUG=false
FRONTEND_URL=https://daemonestudiante.web.app
FIREBASE_PROJECT_ID=daemon-a41f8
```

### Causa raiz 3: 500 sin `Accept: application/json`

Verificado en produccion que el endpoint respondia `401` con header `Accept`
pero `500` sin el: el middleware `Authenticate` resolvia `route('login')` (ruta
inexistente en una SPA API-first) **antes** de lanzar
`AuthenticationException` -> `RouteNotFoundException`.

Fix (PR #64, commit `fc39d19`):

- `redirectGuestsTo(fn => $request->is('api/*') ? null : route('login'))` en
  `bootstrap/app.php` -- los guests de `/api/*` ya no resuelven rutas inexistentes.
- `shouldRenderJsonWhen(fn => $request->is('api/*') || $request->expectsJson())`
  -- fuerza JSON en `/api/*` sin depender del header.

Test de caracterizacion: `backend-laravel/tests/Feature/FirebaseTokenEndpointTest.php`
(401 JSON con y sin `Accept`). Suite completa: **152 passed (519 assertions)**.

### Verificacion final en produccion (2026-08-04 01:24 UTC)

| Check | Resultado |
|---|---|
| `/api/v1/salud` | `version: 2026.07`, `commit: fc39d19`, `database.ok: true`, `uploads_disk: supabase` |
| `POST /api/v1/auth/firebase-token` con `Accept: application/json` | `401` |
| `POST /api/v1/auth/firebase-token` sin `Accept` | `401` (antes `500`) |
| Backend Tests (Laravel) post-merge | `success` |
| Deploy to Firebase Hosting on merge | `success` |
| Production Monitor | `success` |
| `https://daemonestudiante.web.app` | `HTTP 200` |

### Operacion: Deploy Hook de Render

La URL del Deploy Hook del servicio `daemon` esta guardada localmente en
`scripts/render-deploy-hook.url` (**gitignored, nunca se commitea** -- es una
credencial). Cualquier agente puede disparar un redeploy sin abrir el
dashboard:

```bash
bash scripts/render-deploy-hook.sh
# HTTP 202 Accepted = deploy encolado correctamente
```

El helper acepta `200/201/202` y solo imprime la URL host, nunca la clave.
Para monitorear el resultado:

```bash
curl -s https://daemon-5vo1.onrender.com/api/v1/salud | grep -oE '"(version|commit)":"[^"]+"'
curl -s -o /dev/null -w '%{http_code}' -X POST https://daemon-5vo1.onrender.com/api/v1/auth/firebase-token
# 401 (existe y exige sesion)
```

Nota: en el plan free de Render el build Docker tarda 5-15 min y mientras
construye `/salud` puede no responder momentaneamente; el servicio sigue
sirviendo el ultimo build bueno hasta que el nuevo completa.
