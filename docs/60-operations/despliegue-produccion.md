---
title: Despliegue productivo DAEMON
status: active
owner: -
last_reviewed: 2026-09-03
applies_to: DAEMON
supersedes:
related: infraestructura-operativa.md
---

# Despliegue productivo DAEMON

Un **merge** y un **despliegue productivo** son dos operaciones distintas.
Mergear a `main` no publica nada: deja el commit desplegable. Publicarlo es
una decision explicita, aprobada y registrada.

```text
PR
 -> CI + preview de Firebase (automatico)
 -> merge a main
 -> "Main is deployable" verifica el commit (NO despliega)
 -> main queda desplegable, no desplegado
 -> alguien ejecuta "Deploy production" con un SHA exacto
 -> preflight (SHA, CI, punto de recuperacion, contrato, migraciones)
 -> aprobacion humana del environment production
 -> deploy del backend en Render + migraciones controladas
 -> health check con verificacion de commit
 -> deploy de Firebase hosting:arc
 -> smoke productivo
 -> registro del despliegue
```

## Como desplegar

1. Abre **Actions -> Deploy production -> Run workflow**.
2. `commit_sha`: el SHA completo (40 hex) que quieres publicar. Si lo dejas
   vacio, el workflow resuelve `main` a un SHA inmutable en ese instante y
   trabaja sobre ese SHA, no sobre "lo que `main` sea" diez minutos despues.
3. `max_backup_age_hours`: antiguedad maxima aceptada del punto de
   recuperacion verificado. Por defecto 48 h (el drill corre a diario).
4. El job **Preflight** corre primero y es de solo lectura. Revisa su resumen
   antes de aprobar: ahi estan el SHA objetivo, el estado de CI, la edad del
   backup verificado y **los nombres de las migraciones que se aplicaran**.
5. Aprueba el environment `production`. Esa aprobacion es la unica
   autorizacion para mutar produccion.

Los despliegues se serializan con el grupo de concurrencia `production-daemon`:
un segundo despliegue espera, nunca corre en paralelo con una migracion, un
arranque de Render o un smoke.

## Puertas del preflight

| Puerta | Regla |
| --- | --- |
| SHA objetivo | 40 hex, existe y es **alcanzable desde `main`** (un commit de PR sin mergear no lo es) |
| CI | los checks `backend` y `deployable` estan en verde para ese SHA y ningun otro check esta en rojo |
| Punto de recuperacion | el ultimo run verde de *Supabase Backup and Restore Drill* es mas reciente que `max_backup_age_hours` y su artefacto sigue vigente |
| Contrato productivo | `render.yaml` declara storage privado y auto-deploy apagado; `firebase.json`/`.firebaserc` declaran `arc` y ningun target `estudiante` |
| Base de datos | `/api/v1/salud` responde con `database.ok = true` |
| Migraciones | se listan por nombre las migraciones nuevas entre el commit desplegado y el objetivo |

El drill de backup no solo hace `pg_dump`: **restaura el dump en un PostgreSQL
aislado y falla si la restauracion no funciona**. Por eso un run verde cuenta
como punto de recuperacion verificado y un run verde con artefacto expirado no.

Si el punto de recuperacion es demasiado viejo, ejecuta manualmente
*Supabase Backup and Restore Drill* y vuelve a lanzar el despliegue.

## Autoridad de migracion

Las migraciones se aplican en el arranque del contenedor
(`backend-laravel/docker/entrypoint.sh`), y solo si `RUN_MIGRATIONS=true`.

Antes ese valor tenia **`true` por defecto**: cualquier arranque de
contenedor, incluido el despertar tras el spin-down del plan free de Render,
podia ejecutar `php artisan migrate --force` sin que nadie lo hubiera
decidido. Ahora el valor por defecto es `false`: sin declaracion explicita,
el contenedor no migra.

Con `autoDeployTrigger: 'off'`, un commit nuevo solo llega a ese contenedor
a traves de *Deploy production*. La cadena queda:

```text
aprobacion humana -> deploy hook con ?ref=<SHA> -> arranque del contenedor -> migraciones
```

Hay una sola autoridad de migracion y esta detras de la aprobacion.

**Limite conocido:** la ejecucion de las migraciones sigue viviendo en el
contenedor, no en el workflow. Moverla al runner exigiria copiar en GitHub la
`DATABASE_URL` productiva y la `APP_KEY` productiva (varias migraciones
cifran datos y con otra `APP_KEY` los corromperian). Se decidio no ampliar esa
superficie de credenciales. El workflow *reporta* las migraciones antes de
autorizar y falla si el contenedor no arranca sano despues de aplicarlas.

## Aceptacion del backend

Que Render acepte la peticion no es un despliegue. El workflow consulta
`/api/v1/salud` hasta ~30 min y exige:

```text
ok = true
database.ok = true
commit = TARGET_SHA
assets.public_url_configured = true
assets.cloud_url_configured  = true
assets.uploads_disk          = supabase
assets.private_uploads_disk  = supabase_private
```

## Aceptacion del frontend

Solo despues de que el backend sirve el SHA objetivo se construye y publica
`hosting:arc` en el proyecto `daemon-a41f8`. La aceptacion es que
`https://daemonarc.web.app/login` responda 200 y exponga
`<meta name="daemon-release" content="TARGET_SHA">`.

`daemonestudiante` esta retirado y no se despliega. `daemonedu` no se toca.

## Smoke productivo

Automatizado, sin datos academicos sinteticos:

- `scripts/smoke-produccion.ps1 -ExpectedRelease <SHA>` (frontend, cabeceras,
  CSP, Rive, service worker, salud del backend y coincidencia de commit);
- contrato de autenticacion: `GET /auth/yo` sin token responde 401 y el
  preflight CORS de `/auth/firebase` autoriza el origen productivo;
- carga de las rutas canonicas `/`, `/login`, `/alumno`, `/docente` y
  `/docente/cursos` con el release correcto;
- `scripts/verify-retired-public-assets.mjs`.

**Smoke manual del owner** (requiere sesion real; no se automatiza para no
guardar credenciales de una persona en CI):

- [ ] Google Sign-In
- [ ] Inicio
- [ ] Aprender / Mis cursos
- [ ] IA: Origen
- [ ] Agenda
- [ ] Docente -> Revisiones
- [ ] Docente -> Sesiones
- [ ] Course Studio
- [ ] Subida y descarga de una evidencia privada real (autorizada y anonima
      denegada)

La autenticacion productiva es Firebase real en el proyecto `daemon-a41f8`.
El emulador de Auth nunca se activa en produccion.

## Registro

Cada ejecucion queda en el historial del environment `production`
(*Settings -> Environments -> production*, o la pestana **Deployments** del
repositorio) con actor, timestamp y SHA. El job **Deployment record** escribe
ademas un resumen con el estado real del sistema, tambien cuando algo falla.

No hay base de datos de despliegues propia. Las etiquetas canonicas del
repositorio siguen siendo checkpoints de codigo fuente, no de despliegue.

## Despliegue parcial

Si el backend avanza y el frontend no (o al reves), el job **Deployment
record** publica el estado real:

```text
CURRENT BACKEND SHA:      <medido en /api/v1/salud>
CURRENT FRONTEND SHA:     <medido en el meta daemon-release>
DATABASE MIGRATION STATE: <aplicadas | sin cambios | desconocido>
ROLLBACK REQUIRED:        NO | DECISION HUMANA
```

El workflow **falla** de forma visible. Nunca convierte un fallo productivo
en aviso, y nunca lanza una restauracion destructiva de base de datos por su
cuenta.

## Rollback

### Backend

Vuelve a ejecutar *Deploy production* con el SHA anterior conocido como bueno
(el que aparece como `CURRENT BACKEND SHA` antes del intento fallido). El
health check verifica que el backend regresa a ese commit.

Si Actions no esta disponible, el deploy hook manual sigue existiendo:

```bash
bash scripts/render-deploy-hook.sh --verify
```

### Frontend

Restaura la version anterior desde el historial de Firebase Hosting
(*Hosting -> daemonarc -> Release history -> Rollback*), o vuelve a ejecutar
*Deploy production* con el SHA anterior.

### Base de datos

**No existe rollback automatico.** `migrate:rollback`, `migrate:fresh`,
`migrate:refresh`, `migrate:reset` y `db:wipe` estan prohibidos por codigo
cuando la conexion apunta a Supabase (`AppServiceProvider::boot()`). No se
puede prometer `migrate:rollback` universal: varias migraciones transforman o
cifran datos y no son reversibles.

El procedimiento real es restaurar el backup verificado en una base aislada,
validarlo y solo entonces decidir el destino de la API:

```powershell
.\scripts\restore-supabase-backup.ps1 -BackupPath .\daemon-postgres.dump
.\scripts\restore-supabase-backup.ps1 -BackupPath .\daemon-postgres.dump -TargetDatabaseUrl $env:DAEMON_RESTORE_DATABASE_URL -Confirm
```

**La ventana de rollback se cierra sola.** En cuanto los usuarios crean datos
sobre el esquema nuevo, restaurar el backup pierde ese trabajo. Cuanto mas
tarde la decision, mas caro es el rollback: decidir rapido es parte del
procedimiento.

## Configuracion de plataforma requerida

El repositorio no puede cambiar por si solo la configuracion de Render ni las
reglas de proteccion del environment de GitHub. Estas acciones son manuales y
deben completarse **antes** de mergear el PR que introduce este control:

1. **Render -> servicio `daemon` -> Settings -> Build & Deploy -> Auto-Deploy:
   `No`.** `render.yaml` declara `autoDeployTrigger: 'off'`, pero el
   comportamiento observado en produccion fue *On Commit*: manda el ajuste del
   dashboard. Mientras siga en *On Commit*, mergear a `main` desplegara el
   backend automaticamente y el control de este PR quedara anulado.
2. **Render -> servicio `daemon` -> Environment -> `RUN_MIGRATIONS`.**
   Debe seguir existiendo con valor `true` para que el despliegue autorizado
   aplique migraciones. Si la variable se borra, el contenedor ya no migra
   (fail-closed) y las migraciones quedarian pendientes en silencio.
3. **GitHub -> Settings -> Environments -> `production` -> Required
   reviewers.** Anadir al menos un revisor. Sin eso, el environment registra
   el despliegue pero no exige aprobacion humana.
4. **GitHub -> Settings -> Environments -> `production` -> Environment
   secrets -> `RENDER_DEPLOY_HOOK_URL`.** La URL del deploy hook del servicio
   `daemon` (la misma que vive en `scripts/render-deploy-hook.url`). Es una
   credencial: no se commitea y solo debe existir en el environment
   `production`, no a nivel de repositorio.
5. **Nada que cambiar en branch protection.** Los checks requeridos de `main`
   (`backend`, `frontend`, `dependencies`, `codeql`) siguen intactos.
   `build_and_deploy` desaparece con el workflow de merge, pero nunca fue un
   check requerido. El nuevo check `deployable` corre sobre commits **ya en
   `main`**, no sobre PRs: no sirve como puerta de merge, sirve como puerta de
   despliegue (el preflight lo exige en verde).

Ninguna de estas acciones se ha ejecutado desde este PR: modificar Render o
las reglas del environment es una decision del owner.
