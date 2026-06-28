# Estado nube, GitHub y produccion

## Listo

- Supabase PostgreSQL conectado desde Laravel.
- Supabase Storage configurado como disco de archivos de negocio.
- Firebase Auth integrado para Google, email/password y recuperacion con handler oficial.
- Firebase Hosting desplegado en `https://daemonestudiante.web.app`.
- Firebase Hosting configurado con target `estudiante`.
- GitHub remoto configurado en `WILLIAMMDN/daemon`.
- GitHub Actions preparado para desplegar Firebase Hosting desde `main`.

## Pendiente critico

1. Hacer commit y push de la configuracion actual.

2. Desplegar el backend Laravel en una URL publica.

3. Cambiar `frontend-angular/src/environments/environment.ts` para que `apiUrl` apunte al backend publico.

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

- Handler propio de DAEMON para `/restablecer-clave` con correo enviado desde Laravel por SMTP propio.
- Backups programados de Supabase.
- Rotacion de credenciales de Supabase Storage y service accounts.
- Reglas operativas para no subir `.env`, dumps, backups ni llaves privadas al repositorio.

## Decision pendiente para backend

Elegir proveedor de despliegue para Laravel:

- Render: simple para empezar, plan gratis limitado.
- Railway: practico para Laravel, puede requerir tarjeta.
- Fly.io: profesional, mas tecnico.
- VPS: mas control, mas mantenimiento.
- Google Cloud Run: buena integracion con Firebase/GCP, requiere configurar contenedor.
