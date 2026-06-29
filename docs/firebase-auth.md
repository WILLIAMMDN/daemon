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
6. Activar la API de Google Cloud `Identity Toolkit API` (`identitytoolkit.googleapis.com`) para que Laravel pueda generar enlaces de recuperacion desde backend.
7. En Authentication > Settings > Authorized domains agregar:
   - `localhost`
   - `127.0.0.1`
   - `daemonestudiante.web.app`
   - el dominio final de produccion, cuando exista
8. En Project settings > General > Your apps crear una app Web y copiar el objeto `firebaseConfig`.
9. No depender de la plantilla de recuperacion de Firebase Console. DAEMON genera el link desde Laravel y envia su propio correo.

Firebase Console rechazo la actualizacion de la URL de accion con `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`. Por eso el flujo profesional ahora queda en Laravel: el backend genera el OOB link con Identity Platform y envia un correo propio hacia `/restablecer-clave`.

El enlace enviado por DAEMON incluye parametros como `mode=resetPassword` y `oobCode=...`; la pantalla `restablecer-clave` los usa para validar y confirmar la clave nueva en Firebase.

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
FIREBASE_SERVICE_ACCOUNT_BASE64=base64-del-json-service-account
FIREBASE_PASSWORD_RESET_URL=https://daemonestudiante.web.app/restablecer-clave
MAIL_MAILER=smtp
MAIL_HOST=smtp.tu-proveedor.com
MAIL_PORT=587
MAIL_USERNAME=tu-usuario-smtp
MAIL_PASSWORD=tu-password-smtp
MAIL_FROM_ADDRESS=soporte@tu-dominio.com
MAIL_FROM_NAME=DAEMON
```

El `projectId` debe ser el mismo que aparece dentro del objeto `firebaseConfig`. La cuenta de servicio debe tener permiso para Identity Platform/Firebase Authentication.

Para Render/produccion, se recomienda guardar el JSON de la service account como base64 en `FIREBASE_SERVICE_ACCOUNT_BASE64`. En local se puede usar `FIREBASE_SERVICE_ACCOUNT_PATH` apuntando al archivo descargado. Nunca se debe commitear el JSON.

Proveedor de correo recomendado para empezar gratis: Brevo SMTP o Resend. Si se usa SMTP, no hace falta instalar paquetes adicionales en Laravel.

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
2. Angular llama `POST /api/v1/auth/recuperar`.
3. Laravel responde siempre de forma generica para no revelar si una cuenta existe.
4. Si la cuenta existe, Laravel genera un enlace de recuperacion con Identity Platform usando la service account.
5. Laravel envia el correo propio de DAEMON mediante el mailer configurado.
6. El usuario abre `/restablecer-clave?mode=resetPassword&oobCode=...`.
7. Angular confirma la nueva clave en Firebase, inicia sesion y sincroniza `password_hash` en DAEMON.
