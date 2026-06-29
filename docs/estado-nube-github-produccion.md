# Estado nube, GitHub y produccion

## Listo

- Supabase PostgreSQL conectado desde Laravel.
- Supabase Storage configurado como disco de archivos de negocio.
- Firebase Auth integrado para Google, email/password y recuperacion con handler oficial.
- Registro profesional en dos pasos: cuenta primero, `/bienvenida` despues para perfil.
- Verificacion de correo con token propio Laravel y banner persistente en portales.
- Recuperacion de clave con correo propio Laravel y token firmado por `APP_KEY`.
- Firebase Hosting desplegado en `https://daemonestudiante.web.app`.
- Firebase Hosting configurado con target `estudiante`.
- Backend Laravel desplegado en Render en `https://daemon-5vo1.onrender.com`.
- GitHub remoto configurado en `WILLIAMMDN/daemon`.
- GitHub Actions preparado para desplegar Firebase Hosting desde `main`.

## Pendiente critico

1. Hacer commit y push de la configuracion actual.

2. Revisar que Render tenga las variables de entorno de produccion actualizadas.

3. Confirmar que `frontend-angular/src/environments/environment.ts` apunte al backend publico.

4. Configurar variables de entorno del backend en el proveedor donde se despliegue Laravel.

5. Probar el flujo completo en nube:

   ```text
   Angular Hosting -> Laravel publico -> Supabase PostgreSQL/Storage -> Firebase Auth
   ```

## GitHub Actions

El secret de GitHub Actions ya fue creado:

   ```text
   FIREBASE_SERVICE_ACCOUNT_DAEMON_A41F8
   ```

El JSON usado pertenece a una service account externa y se le otorgaron permisos sobre el proyecto Firebase `daemon-a41f8`. Esto es valido para despliegue siempre que la service account conserve los roles requeridos en el proyecto objetivo.

Roles otorgados en `daemon-a41f8`:

- Firebase Authentication Admin
- Firebase Hosting Admin
- API Keys Viewer
- Service Usage Consumer
- Cloud Run Viewer
- Cloud Functions Developer

## Pendiente planificado

- Backups programados de Supabase.
- Rotacion de credenciales de Supabase Storage y service accounts.
- Reglas operativas para no subir `.env`, dumps, backups ni llaves privadas al repositorio.

## Variables clave del backend en Render

En produccion, Laravel debe resolver archivos asi:

- `ASSET_PUBLIC_URL=https://daemonestudiante.web.app` para assets del frontend como `img`, `galeria`, `audio`, `rive`, `docs`.
- `ASSET_CLOUD_URL=https://lbxdcvsrmkkynttgwblc.supabase.co/storage/v1/object/public/daemon-assets` para archivos de negocio bajo `uploads`.
- `UPLOADS_DISK=supabase` para que nuevos archivos subidos desde DAEMON se guarden en Supabase Storage.
- `APP_URL=https://daemon-5vo1.onrender.com` para URLs propias del backend.
- `FRONTEND_URL=https://daemonestudiante.web.app` para CORS y redirecciones.
- `FRONTEND_EMAIL_VERIFICATION_URL=https://daemonestudiante.web.app/verificar-correo` para correos de verificacion.
- `FIREBASE_PASSWORD_RESET_URL=https://daemonestudiante.web.app/restablecer-clave` para correos de recuperacion.

## Decision pendiente para backend

Elegir proveedor de despliegue para Laravel:

- Render: simple para empezar, plan gratis limitado.
- Railway: practico para Laravel, puede requerir tarjeta.
- Fly.io: profesional, mas tecnico.
- VPS: mas control, mas mantenimiento.
- Google Cloud Run: buena integracion con Firebase/GCP, requiere configurar contenedor.
