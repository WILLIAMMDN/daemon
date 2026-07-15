# DAEMON QA de produccion

Usar este checklist antes y despues de cambios relevantes en produccion.
No guardar contrasenas reales en este archivo.

## Verificacion automatica

```powershell
cd C:\laragon\www\daemon
.\scripts\smoke-produccion.ps1

cd C:\laragon\www\daemon\frontend-angular
npm test -- --runInBand
npm run build

cd C:\laragon\www\daemon\backend-laravel
php artisan test

cd C:\laragon\www\daemon
```

Resultado esperado:

- `smoke-produccion.ps1` termina con `Production smoke test finished successfully`.
- El build Angular termina sin errores.
- Las pruebas Jest y Laravel pasan.
- `/api/v1/salud` responde `ok: true`, base de datos OK y `uploads_disk: supabase`.
- `ngsw-worker.js` responde JavaScript y `ngsw.json` responde JSON.
- Los bundles desplegados contienen `verificacion=firebase` y `reset=firebase`.
- Los bundles desplegados no llaman `/auth/recuperar` ni `/auth/enviar-verificacion`.

## Modos de ejecucion local

El modo local predeterminado usa la infraestructura cloud de DAEMON:

```powershell
cd C:\laragon\www\daemon\frontend-angular
npm run start
```

Este comando inicia Angular con `environment.cloud.ts` y conecta con Render,
Supabase Storage y Firebase. No necesita Laravel en `localhost:8000`.

Para trabajar intencionalmente con un backend Laravel local:

```powershell
npm run start:local
```

`start:local` usa `environment.development.ts` y requiere la API en
`http://localhost:8000/api/v1`. Como `npm run start` consume servicios reales,
no ejecutar canjes, entregas, eliminaciones ni cambios destructivos durante QA.

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
  frontend-angular/src/app/shared/componentes/sidebar-portal `
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

## Auth y correos

- Registro con email debe crear cuenta en Firebase y DAEMON.
- Verificacion de correo debe volver a `/alumno?verificacion=firebase`.
- Recuperacion de clave debe usar Firebase y volver a `/login?reset=firebase`.
- El frontend no debe llamar `/auth/recuperar` ni `/auth/enviar-verificacion` en los flujos activos.
- Google login debe validar rol: alumno hacia `/alumno`, docente/admin hacia `/docente`.

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
