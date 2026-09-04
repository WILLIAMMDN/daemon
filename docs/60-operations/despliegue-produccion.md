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

El despliegue productivo es **automatico**. Un commit que aterriza en `main`
llega a produccion sin que nadie tenga que abrir GitHub ni Render.

El invariante que protege este sistema es:

> **Codigo sin probar no llega a `main`.**

No es "todo despliegue exige un clic humano". Una vez que un commit paso la
proteccion de `main`, publicarlo es mecanico; lo que no es mecanico es
*verificar* que produccion quedo realmente en ese commit, y eso lo hace el
workflow.

```text
PR
 -> CI requerida en verde + preview de Firebase (7 dias)
 -> merge a main protegida
 -> Render construye y despliega el backend (auto-deploy)
 -> el entrypoint aplica las migraciones del release
 -> "Deploy production" verifica /api/v1/salud commit = SHA
 -> publica Firebase hosting:arc con ese SHA estampado
 -> verifica daemon-release = SHA
 -> smoke productivo
 -> registro del despliegue
```

El owner interviene **solo cuando algo falla**: CI en rojo, despliegue que no
converge, migracion fallida, smoke en rojo o rollback.

## Operacion normal

No hay ninguna. Se mergea el PR y se espera. El workflow *Deploy production*
arranca solo con el push a `main`.

Si algo va mal, el run queda en rojo y el job **Deployment record** dice en
que estado quedo produccion de verdad.

## Disparo manual (redeploy y rollback)

*Actions -> Deploy production -> Run workflow* existe para dos casos que el
auto-deploy no cubre:

| Caso | Como |
| --- | --- |
| Rollback a un commit anterior | `commit_sha` = SHA de 40 hex conocido como bueno |
| Redesplegar el HEAD actual de `main` | `commit_sha` vacio |

`max_backup_age_hours` (48 h por defecto) es la antiguedad maxima aceptada del
punto de recuperacion verificado cuando el release aplica migraciones.

En un disparo manual el workflow usa el **deploy hook** de Render con
`?ref=<SHA>`: el auto-deploy nunca desplegaria un commit que no es el HEAD de
`main`. El hook es opcional (ver
[Deploy hook](#deploy-hook-de-render-opcional)).

## Serializacion y releases superados

Los despliegues se serializan con el grupo de concurrencia `production-daemon`
y `cancel-in-progress: false`: un despliegue nunca se abandona a medias ni
corre en paralelo con una migracion, un arranque de Render o un smoke.

Si un segundo merge aterriza mientras el primero se despliega, el run del
commit viejo se marca **superado** y no publica nada: publicar seria hacer
retroceder produccion. El run del commit nuevo, encolado detras, es el que
manda. Un release superado **no** es un fallo y no deja el run en rojo.

## Puertas automaticas del preflight

Ninguna pide aprobacion. Todas fallan solas si no se cumplen.

| Puerta | Regla |
| --- | --- |
| SHA objetivo | 40 hex, existe y es **alcanzable desde `main`** (un commit de PR sin mergear no lo es) |
| CI | espera a que el check `backend` concluya en verde para ese SHA, y aborta si cualquier otro check esta en rojo |
| Contrato productivo | `render.yaml` declara storage privado; `firebase.json` / `.firebaserc` declaran `arc` y ningun target `estudiante` |
| Contrato de entornos | `scripts/check-environment-safety.mjs --ci` sobre el arbol del SHA objetivo |
| Base de datos | `/api/v1/salud` responde con `database.ok = true` |
| Migraciones | se listan por nombre las migraciones nuevas entre el commit desplegado y el objetivo |
| Punto de recuperacion | **bloqueante solo si el release migra**: el ultimo run verde de *Supabase Backup and Restore Drill* es mas reciente que `max_backup_age_hours` y su artefacto sigue vigente |

El drill de backup no solo hace `pg_dump`: **restaura el dump en un PostgreSQL
aislado y falla si la restauracion no funciona**. Por eso un run verde cuenta
como punto de recuperacion verificado y un run verde con artefacto expirado no.

La puerta del punto de recuperacion es bloqueante unicamente cuando el release
muta el esquema, porque es la unica parte irreversible del despliegue. Un
release sin migraciones se revierte redesplegando el commit anterior, asi que
un drill atrasado no frena un despliegue rutinario ni un hotfix: solo deja un
aviso. Si bloquea, ejecuta *Supabase Backup and Restore Drill* y reintenta.

## La proteccion de `main` es la puerta real

Este workflow no sustituye a la proteccion de rama: la asume.

| Regla | Estado |
| --- | --- |
| Pull request obligatorio | si |
| Checks requeridos | `backend`, `frontend`, `dependencies`, `codeql` |
| Rama actualizada antes de mergear | si (`strict`) |
| Push directo a `main` | bloqueado para usuarios sin permiso de administracion |
| Force push / borrado de `main` | bloqueados |
| Historial lineal | obligatorio |
| Conversaciones resueltas | obligatorio |
| **Administradores exentos** (`enforce_admins`) | **si: un administrador puede empujar directo a `main`** |

La exencion de administradores es la **unica** via por la que codigo sin CI
puede entrar en `main` y, por tanto, desplegarse. Cerrarla es *Settings ->
Branches -> main -> Do not allow bypassing the above settings*. Es un ajuste
del owner, no del repositorio.

Aun con esa exencion abierta, un push directo no se publica en silencio: el
workflow espera a que el check `backend` termine en verde sobre ese commit
antes de publicar `hosting:arc`, y falla en rojo si no lo hace.

## Autoridad de migracion

Las migraciones se aplican en el arranque del contenedor
(`backend-laravel/docker/entrypoint.sh`), **una vez por release**:

```text
merge a main -> Render construye -> arranca el contenedor
             -> marca != RENDER_GIT_COMMIT -> php artisan migrate --force
             -> marca := RENDER_GIT_COMMIT
```

- **Release nuevo** (sin marca, o marca de otro commit): migra.
- **Despertar tras el spin-down del plan free** (misma marca): no migra. Antes
  cualquier arranque reejecutaba `migrate --force` sin que hubiera ningun
  release detras.
- **Fallo**: la marca **no** se escribe, el entrypoint termina en error, el
  contenedor no arranca, el health check de Render deja el deploy en rojo y el
  workflow falla al no ver nunca el SHA objetivo en `/api/v1/salud`. Un fallo
  de migracion nunca se ignora en silencio, y el siguiente arranque lo
  reintenta.
- `RUN_MIGRATIONS=false` en Render congela el esquema explicitamente (por
  ejemplo durante una restauracion) sin tocar el codigo. No hace falta
  declararla para operar: el valor por defecto es `true`.

**Limite conocido:** la ejecucion de las migraciones vive en el contenedor, no
en el workflow. Moverla al runner exigiria copiar en GitHub la `DATABASE_URL`
productiva y la `APP_KEY` productiva (varias migraciones cifran datos y con
otra `APP_KEY` los corromperian). Se decidio no ampliar esa superficie de
credenciales. El workflow *reporta* las migraciones antes de publicar el
frontend y falla si el contenedor no arranca sano despues de aplicarlas.

## Aceptacion del backend

Que Render acepte un commit no es un despliegue. El workflow consulta
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

Si a los ~8 min el backend no ha llegado al SHA objetivo y existe el secret
`RENDER_DEPLOY_HOOK_URL`, el workflow dispara el hook una vez con `?ref=<SHA>`
para desatascar el despliegue. Sigue esperando igual si el secret no existe.

## Aceptacion del frontend

Solo despues de que el backend sirve el SHA objetivo se publica `hosting:arc`
en el proyecto `daemon-a41f8` (el build ya se hizo antes, para que un build
roto falle sin tocar produccion). La aceptacion es que
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
repositorio) con actor, timestamp y SHA. El environment no exige aprobacion:
aporta el registro y el alcance de los secrets, no una puerta humana.

El job **Deployment record** escribe ademas un resumen con el estado real del
sistema, tambien cuando algo falla.

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

*Actions -> Deploy production -> Run workflow* con `commit_sha` = el SHA
anterior conocido como bueno (el que aparece como `CURRENT BACKEND SHA` antes
del intento fallido). El health check verifica que el backend regresa a ese
commit.

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

## Configuracion de plataforma

Nada de esto es obligatorio para operar. El despliegue automatico funciona con
la configuracion actual.

### Recomendado

1. **Render -> servicio `daemon` -> Settings -> Build & Deploy -> Auto-Deploy:
   `After CI Checks Pass`.** `render.yaml` declara `autoDeployTrigger:
   checksPass`, pero manda el ajuste del dashboard, y el comportamiento
   observado fue *On Commit*. Las dos opciones despliegan automaticamente; con
   *Checks Pass* Render espera ademas a que los check runs del commit esten en
   verde, asi que codigo con CI en rojo no llega ni a construirse. **No hay que
   apagar el Auto-Deploy.**
2. **GitHub -> Settings -> Branches -> `main` -> Do not allow bypassing the
   above settings.** Hoy `enforce_admins` esta desactivado: un administrador
   puede empujar directo a `main` sin PR ni CI. Es el unico hueco real del
   invariante "codigo sin probar no llega a `main`".

### Opcional

3. **GitHub -> Settings -> Environments -> `production` -> Environment secrets
   -> `RENDER_DEPLOY_HOOK_URL`.** La URL del deploy hook del servicio `daemon`
   (la misma que vive en `scripts/render-deploy-hook.url`). Sin ella el
   despliegue rutinario funciona igual; con ella el workflow puede desatascar
   un backend que no converge y hacer rollback a un SHA arbitrario sin salir de
   Actions. Es una credencial: no se commitea y debe vivir en el environment
   `production`, no a nivel de repositorio.

### Nada que cambiar

- **Branch protection.** Los checks requeridos de `main` (`backend`,
  `frontend`, `dependencies`, `codeql`) siguen intactos. El antiguo
  `build_and_deploy` desaparece con el workflow de merge, pero nunca fue un
  check requerido.
- **`production` environment.** No necesita *required reviewers*: el modelo no
  pide aprobacion por despliegue.
- **`RUN_MIGRATIONS` en Render.** Puede seguir en `true` o no existir: el valor
  por defecto ya es `true` y el entrypoint acota la migracion a un release.
