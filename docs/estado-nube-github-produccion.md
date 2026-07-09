# Estado nube, GitHub y produccion

Este documento resume el estado operativo de DAEMON en nube.

## Listo

- GitHub remoto configurado en `WILLIAMMDN/daemon`.
- Frontend Angular desplegado en Firebase Hosting.
- Hosting publico: `https://daemonestudiante.web.app`.
- Firebase Hosting target: `estudiante`.
- Firebase project: `daemon-a41f8`.
- Backend Laravel desplegado en Render.
- Backend publico: `https://daemon-5vo1.onrender.com/api/v1`.
- Health endpoint: `https://daemon-5vo1.onrender.com/api/v1/salud`.
- Supabase PostgreSQL conectado como base de datos de negocio.
- Supabase Storage configurado para uploads de negocio.
- Firebase Auth integrado para Google, email/password, verificacion y
  recuperacion de clave.
- Registro profesional en dos pasos: cuenta primero, perfil en `/bienvenida`.
- Firebase Hosting con `Cache-Control: no-store` para evitar bundles viejos.
- Firebase Hosting `retainedReleaseCount` reducido a `5` para evitar bloqueo
  por cuota de storage.
- GitHub Actions preparado para despliegue de Firebase Hosting desde `main`.

## Decision actual de correos

Firebase envia los correos de verificacion y recuperacion. Es menos
personalizado visualmente, pero funciona gratis con alumnos reales.

Resend/Laravel mail queda como opcion futura cuando exista dominio verificado.
No usar Resend como camino principal si no hay dominio, porque Resend rechaza
destinatarios que no sean el correo dueno de la cuenta en modo prueba.

## Firebase Hosting

Archivos:

```text
.firebaserc
firebase.json
.github/workflows/firebase-hosting-merge.yml
.github/workflows/firebase-hosting-pull-request.yml
```

Comando manual:

```powershell
cd C:\laragon\www\daemon
firebase deploy --only hosting:estudiante --project daemon-a41f8
```

`firebase.json` publica:

```text
frontend-angular/dist/frontend-angular/browser
```

## GitHub Actions

Secret requerido:

```text
FIREBASE_SERVICE_ACCOUNT_DAEMON_A41F8
```

Debe contener el JSON de la service account con permisos de Firebase Hosting.
No guardar ese JSON en el repositorio.

Roles que fueron usados para la service account:

- Firebase Authentication Admin
- Firebase Hosting Admin
- API Keys Viewer
- Service Usage Consumer
- Cloud Run Viewer
- Cloud Functions Developer

## Render backend

Variables importantes de produccion:

```env
APP_URL=https://daemon-5vo1.onrender.com
FRONTEND_URL=https://daemonestudiante.web.app
FRONTEND_PRODUCTION_URL=https://daemonestudiante.web.app
CORS_SUPPORTS_CREDENTIALS=true
AUTH_COOKIE_SAME_SITE=none
AUTH_COOKIE_SECURE=true
DB_CONNECTION=pgsql
DB_SSLMODE=require
ASSET_PUBLIC_URL=https://daemonestudiante.web.app
ASSET_CLOUD_URL=https://lbxdcvsrmkkynttgwblc.supabase.co/storage/v1/object/public/daemon-assets
UPLOADS_DISK=supabase
FIREBASE_PROJECT_ID=daemon-a41f8
```

Si se cambia el backend, verificar que Render haya desplegado el commit nuevo.

## Supabase

Base:

```text
PostgreSQL en Supabase
```

Storage:

```text
Bucket: daemon-assets
Region: sa-east-1
```

Uploads que van a Supabase Storage:

```text
uploads/perfiles
uploads/bots
uploads/tienda/premios
uploads/insignias
uploads/entregas
uploads/cuentos
```

Assets que se quedan en Firebase Hosting:

```text
img/
galeria/
audio/
rive/
legacy/
docs/
```

## Verificacion rapida de produccion

```powershell
cd C:\laragon\www\daemon
.\scripts\smoke-produccion.ps1
```

## Pendiente recomendado

- Comprar/verificar dominio cuando se quiera correo transaccional con marca
  propia DAEMON.
- Configurar backups programados de Supabase.
- Rotar credenciales despues de exposiciones accidentales.
- Mantener `.env`, dumps privados y service accounts fuera de git.
- Optimizar bundle Angular cuando los flujos principales esten estables.
