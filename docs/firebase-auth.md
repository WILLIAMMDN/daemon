# Firebase Auth en DAEMON

DAEMON usa Firebase Auth como proveedor de identidad y entrega de correos de
auth. Laravel sigue siendo la API principal y Supabase PostgreSQL sigue siendo
la base de datos de negocio.

## Decision actual

La decision activa es:

```text
Firebase Auth:
  - Google login
  - Email/password login
  - Email verification delivery
  - Password reset delivery

Laravel/Sanctum:
  - Validar Firebase ID tokens
  - Emitir sesion DAEMON
  - Mantener roles y permisos
  - Mantener usuarios, tokens, misiones, insignias, tienda, evaluaciones, etc.
  - Sincronizar email_verified_at desde Firebase
```

Esta decision se tomo porque Resend en modo prueba solo envia al correo dueno
de la cuenta. Para enviar correos a alumnos reales con Resend hay que verificar
un dominio propio. Mientras no exista ese dominio, Firebase es el proveedor que
funciona sin costo extra para verificacion y recuperacion.

## Flujo de login con Firebase

1. Angular inicia sesion con Firebase Auth.
2. Angular obtiene un ID token.
3. Angular llama `POST /api/v1/auth/firebase`.
4. Laravel valida el token con las llaves publicas de Firebase.
5. Laravel enlaza o crea el registro en `usuarios`.
6. Laravel emite sesion/token de Sanctum.
7. Angular guarda la sesion DAEMON.

Archivos:

```text
frontend-angular/src/app/core/servicios/firebase-auth.ts
frontend-angular/src/app/core/servicios/autenticacion.ts
backend-laravel/app/Services/Auth/FirebaseTokenVerifier.php
backend-laravel/app/Services/Auth/AutenticacionService.php
backend-laravel/app/Http/Controllers/Api/V1/AutenticacionController.php
```

## Registro email/password

1. Usuario se registra en Angular con correo y clave.
2. Angular crea la cuenta en Firebase.
3. Firebase envia correo de verificacion.
4. Angular envia ID token a Laravel.
5. Laravel crea/enlaza `usuarios.firebase_uid`.
6. Si `email_verified=false`, `email_verified_at` queda `null`.
7. Si el perfil esta incompleto, Angular redirige a `/bienvenida`.

El perfil DAEMON se completa despues con:

```text
PATCH /api/v1/auth/me/perfil
```

## Verificacion de correo

Estado actual:

- El correo de verificacion lo envia Firebase.
- El remitente y plantilla son de Firebase, no DAEMON.
- Esto es aceptado porque funciona para alumnos reales sin comprar dominio.
- El retorno configurado es:

```text
https://daemonestudiante.web.app/alumno?verificacion=firebase
```

Cuando el usuario vuelve a DAEMON con esa URL:

1. `EmailVerificationBanner` detecta `verificacion=firebase`.
2. Angular recarga el usuario actual de Firebase.
3. Si Firebase dice `emailVerified=true`, Angular obtiene un ID token fresco.
4. Angular llama otra vez `POST /api/v1/auth/firebase`.
5. Laravel sincroniza `email_verified_at`.
6. El banner desaparece al refrescar `/auth/yo`.

## Recuperacion de contrasena

Estado actual:

- `/recuperar-clave` llama Firebase `sendPasswordResetEmail`.
- No usa `POST /api/v1/auth/recuperar` desde el frontend actual.
- Firebase envia el correo de recuperacion.
- La URL de retorno configurada es:

```text
https://daemonestudiante.web.app/login?reset=firebase
```

`/restablecer-clave` aun soporta tokens antiguos de DAEMON y `oobCode` de
Firebase, pero el flujo activo para alumnos reales es el correo oficial de
Firebase.

## Google login

Google se gestiona con Firebase Auth. DAEMON acepta el ID token de Firebase y
lo valida en Laravel. Google normalmente ya valido el correo, asi que Laravel
puede marcar `email_verified_at`.

El login docente usa el mismo proveedor, pero Laravel/Angular verifican el rol
DAEMON antes de permitir entrada al portal docente.

### Vinculacion de cuentas legacy

Las cuentas historicas que solo tienen `usuario` y `password_hash` no se pueden
asociar a Google por nombre, porque eso permitiria apropiarse de otro perfil.
El acceso de estudiante ofrece una vinculacion explicita:

1. Firebase valida la identidad de Google.
2. El alumno confirma el usuario y la contrasena de su cuenta anterior.
3. Laravel vuelve a validar ambos factores y asigna `firebase_uid` al mismo
   registro de `usuarios`.
4. Si un intento anterior creo un perfil Firebase incompleto, se elimina solo
   ese placeholder sin usuario y se conserva la cuenta legacy con su mismo ID,
   XP, DAEMONS, matriculas y progreso.
5. Se invalidan sesiones anteriores y Laravel emite una sesion nueva.

```text
POST /api/v1/auth/firebase/vincular-legacy
```

Una identidad Google vinculada a una cuenta completa, una clave local
incorrecta o un rol que no sea estudiante bloquean la operacion. Una cuenta
nueva con Google solo se crea cuando el usuario lo elige expresamente.

Laravel exige que el token venga del proveedor `google.com`, que incluya la
identidad Google y que esta no pertenezca a otra cuenta. La coincidencia del
nombre de usuario nunca basta para vincular perfiles.

### Diagnostico en desarrollo local

`php artisan serve` hereda las variables de entorno al arrancar. Si se cambia
`.env`, se copia otra configuracion o se alterna entre una base de pruebas y
Supabase, el proceso que ya escucha en `localhost:8000` puede seguir usando la
configuracion anterior aunque `php artisan config:clear` muestre valores
correctos en una terminal nueva.

Sintomas tipicos:

- `POST /auth/login` devuelve `422` para una credencial que si coincide en la
  base actual.
- `POST /auth/firebase` responde `Firebase no esta configurado en el backend`
  aunque `FIREBASE_PROJECT_ID` exista.
- La CLI y el navegador parecen consultar estados diferentes.

Procedimiento seguro:

1. Detener solamente el proceso Laravel que escucha en el puerto `8000`.
2. Ejecutar `php artisan config:clear` desde `backend-laravel`.
3. Iniciar de nuevo `php artisan serve --host=localhost --port=8000`.
4. Verificar `/api/v1/salud` y realizar un login real; no basta con inspeccionar
   el `.env`.

La credencial canonica del alumno historico de QA es `jose123 / 1234`. Su hash
puede sincronizarse para pruebas sin cambiar el ID, XP, DAEMONS, matriculas ni
progreso de la cuenta.

## Acceso de familias y tutores

El portal familiar usa una cuenta Firebase independiente con rol DAEMON
`tutor`. Angular envía el ID token a:

```text
POST /api/v1/auth/tutor/firebase
```

Laravel no convierte una cuenta existente de alumno, docente o admin a tutor.
El tutor puede iniciar sesión antes de verificar el correo, pero no puede listar
ni aceptar invitaciones de menores hasta que Firebase confirme
`email_verified=true`. El correo de verificación regresa a:

```text
https://daemonestudiante.web.app/familias?verificacion=firebase
```

Aceptar una invitación es una acción separada y explícita. Recién entonces el
API familiar entrega el reporte semanal del estudiante.

## Endpoints relacionados

Activos en el frontend:

```text
POST /api/v1/auth/firebase
POST /api/v1/auth/tutor/firebase
PATCH /api/v1/auth/me/perfil
GET  /api/v1/auth/yo
POST /api/v1/auth/logout
POST /api/v1/auth/me/sync-password
```

Disponibles por compatibilidad o para un futuro con dominio propio:

```text
POST /api/v1/auth/recuperar
POST /api/v1/auth/confirmar-reset
POST /api/v1/auth/enviar-verificacion
POST /api/v1/auth/confirmar-verificar
```

No borrar esos endpoints sin revisar tests y compatibilidad historica.

## Firebase Console

Debe estar habilitado:

- Authentication > Sign-in method > Google.
- Authentication > Sign-in method > Email/Password.
- Authentication > Settings > Authorized domains:
  - `localhost`
  - `127.0.0.1`
  - `daemonestudiante.web.app`
  - dominio final, cuando exista

Si se intenta personalizar profundamente las plantillas de Firebase, la consola
puede rechazar cambios de URL de accion. Para la etapa gratis, aceptar los
correos oficiales de Firebase.

## Variables frontend

En `frontend-angular/src/environments/environment.ts`:

```ts
apiUrl: 'https://daemon-5vo1.onrender.com/api/v1'
assetBaseUrl: 'https://lbxdcvsrmkkynttgwblc.supabase.co/storage/v1/object/public/daemon-assets'
firebase.projectId: 'daemon-a41f8'
```

La config web de Firebase no es secreto. Las service accounts si son secreto.

## Variables backend

Laravel necesita:

```env
FIREBASE_PROJECT_ID=daemon-a41f8
FIREBASE_SERVICE_ACCOUNT_BASE64=...
FRONTEND_URL=https://daemonestudiante.web.app
FRONTEND_PRODUCTION_URL=https://daemonestudiante.web.app
```

`FIREBASE_SERVICE_ACCOUNT_BASE64` se usa para operaciones administrativas como
sincronizacion de clave si corresponde. No commitear el JSON ni el base64.

## Resend y correos propios

Resend queda como opcion futura. Para usarlo en produccion real:

1. Comprar o tener un dominio.
2. Verificarlo en Resend.
3. Configurar DNS.
4. Usar remitente del dominio verificado:

```env
MAIL_MAILER=resend
RESEND_API_KEY=...
MAIL_FROM_ADDRESS=no-reply@tudominio.com
MAIL_FROM_NAME=DAEMON
```

Sin dominio verificado, Resend puede rechazar correos con:

```text
You can only send testing emails to your own email address.
```

No reactivar Resend como flujo principal para alumnos hasta resolver eso.
