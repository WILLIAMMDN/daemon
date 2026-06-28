# Firebase Auth en DAEMON

DAEMON usa Supabase para PostgreSQL y Storage. Firebase se usa solo como proveedor de identidad.

## Flujo implementado

1. Angular inicia sesion con Firebase Auth.
2. Angular obtiene un ID token de Firebase.
3. Laravel valida la firma del token con las llaves publicas de Firebase.
4. Laravel enlaza el `firebase_uid` con la tabla `usuarios`.
5. Laravel emite el token interno de Sanctum para conservar roles, permisos, tokens, insignias y progreso.

El login por usuario/clave local queda disponible para cuentas existentes. Si el campo de login contiene un correo, Angular intenta email/password con Firebase.

## Configuracion pendiente en Firebase Console

1. Crear o abrir el proyecto Firebase.
2. Ir a Authentication > Sign-in method.
3. Activar Google.
4. Activar Email/Password si se usara recuperacion por correo desde Firebase.
5. Activar Phone cuando se vaya a implementar login por telefono.
6. En Authentication > Settings > Authorized domains agregar:
   - `localhost`
   - `127.0.0.1`
   - `daemonestudiante.web.app`
   - el dominio final de produccion, cuando exista
7. En Project settings > General > Your apps crear una app Web y copiar el objeto `firebaseConfig`.
8. No personalizar por ahora el action URL de Authentication > Templates > Password reset.

Firebase Console esta rechazando la actualizacion de la URL de accion con `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`. Mientras esa restriccion exista, el flujo estable es usar el handler oficial de Firebase y volver a DAEMON mediante `continueUrl`.

El enlace de Firebase enviara parametros como `mode=resetPassword` y `oobCode=...`; la pantalla `restablecer-clave` los usa para validar y confirmar la clave nueva.

## Firebase Hosting y GitHub

El frontend se publica en Firebase Hosting desde:

```text
frontend-angular/dist/frontend-angular/browser
```

Archivos de configuracion:

- `firebase.json`: define el target `estudiante`, la carpeta publica y el rewrite de Angular hacia `index.html`.
- `.firebaserc`: apunta al proyecto `daemon-a41f8`.
- `.github/workflows/firebase-hosting-merge.yml`: despliega a produccion cuando hay push a `main`.
- `.github/workflows/firebase-hosting-pull-request.yml`: crea previews para pull requests.

GitHub Actions necesita el secret:

```text
FIREBASE_SERVICE_ACCOUNT_DAEMON_A41F8
```

Ese valor debe ser el JSON de una service account con permisos de Firebase Hosting. No debe guardarse en el repositorio.

Roles recomendados para la service account de despliegue:

- Firebase Hosting Admin
- Firebase Authentication Admin, si se usaran preview channels que deban agregarse a dominios autorizados
- API Keys Viewer, requerido por algunos despliegues del CLI

## Variables Laravel

En `backend-laravel/.env`:

```env
FIREBASE_PROJECT_ID=tu-project-id
```

El `projectId` debe ser el mismo que aparece dentro del objeto `firebaseConfig`.

## Configuracion Angular

En `frontend-angular/src/environments/environment.development.ts` y en produccion cuando toque desplegar:

```ts
firebase: {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
}
```

Esta configuracion web no es una clave secreta, pero debe pertenecer al proyecto Firebase correcto.

## Rutas nuevas

- `POST /api/v1/auth/firebase`
- `POST /api/v1/auth/firebase/perfil`
- `POST /api/v1/auth/me/sync-password`

`/api/v1/auth/google` queda disponible por compatibilidad, pero el frontend nuevo usa Firebase.

## Recuperacion de contrasena

El flujo correcto es:

1. El usuario escribe su correo en `/recuperar-clave`.
2. Angular pide a Firebase enviar un correo de recuperacion.
3. La respuesta visual siempre es generica para no revelar si una cuenta existe.
4. El usuario abre el enlace y Firebase muestra el formulario oficial de cambio de clave.
5. Al terminar, Firebase puede devolver al usuario a `https://daemonestudiante.web.app/login`.

La pantalla `/restablecer-clave` queda lista para un handler propio. Para usarla sin depender del bloqueo de plantillas de Firebase, el siguiente paso profesional seria enviar correos desde Laravel con SMTP propio y generar enlaces de reseteo mediante Firebase Admin.
