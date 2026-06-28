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
   - el dominio final de produccion
7. En Project settings > General > Your apps crear una app Web y copiar el objeto `firebaseConfig`.

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

`/api/v1/auth/google` queda disponible por compatibilidad, pero el frontend nuevo usa Firebase.
