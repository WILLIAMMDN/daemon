# DAEMON con Supabase PostgreSQL

Esta guia deja la base de datos en la nube sin borrar la base MySQL/MariaDB local. La ruta recomendada es:

```text
Angular -> Laravel API -> Supabase PostgreSQL
```

Laravel sigue siendo el backend de DAEMON y Supabase queda como base PostgreSQL administrada.

## 1. Crear el proyecto en Supabase

1. Crea un proyecto en Supabase.
2. Entra a `Project Settings > Database > Connect`.
3. Copia los datos de conexion PostgreSQL.
4. Para desarrollo con Laravel, usa `Direct connection` si tu red soporta IPv6. Si no conecta o Windows no resuelve bien el host directo, usa `Session pooler`.
5. Evita `Transaction pooler` al inicio para no pelear con conexiones preparadas de Laravel.

## 2. Activar PostgreSQL en PHP/Laragon

Laravel necesita `pdo_pgsql` para conectarse a Supabase:

```powershell
php -m | findstr /i "pdo_pgsql pgsql"
```

Si no aparece, activa estas extensiones en el `php.ini` de Laragon:

```ini
extension=pgsql
extension=pdo_pgsql
```

Luego reinicia Laragon o la terminal.

## 3. Preparar el .env

Usa el ejemplo preparado:

```powershell
cd C:\laragon\www\daemon\backend-laravel
Copy-Item .env.supabase.example .env
php artisan key:generate
```

Edita `.env` y reemplaza:

```env
DB_CONNECTION=pgsql
DB_HOST=aws-1-sa-east-1.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.lbxdcvsrmkkynttgwblc
DB_PASSWORD=tu_password_de_supabase
DB_SSLMODE=require
```

Mantiene tambien la conexion local legacy para copiar los datos actuales:

```env
LEGACY_DB_HOST=127.0.0.1
LEGACY_DB_PORT=3306
LEGACY_DB_DATABASE=iaparateens_db
LEGACY_DB_USERNAME=root
LEGACY_DB_PASSWORD=
```

## 4. Hacer backup antes de copiar

Esto no lo usa Laravel directamente, pero es buena practica antes de cualquier migracion:

```powershell
cd C:\laragon\www\daemon
New-Item -ItemType Directory -Force database\backups
mysqldump -u root iaparateens_db > database\backups\iaparateens_db_backup.sql
```

Si tu MySQL tiene password:

```powershell
mysqldump -u root -p iaparateens_db > database\backups\iaparateens_db_backup.sql
```

## 5. Crear el esquema en Supabase

```powershell
cd C:\laragon\www\daemon\backend-laravel
php artisan config:clear
php artisan migrate
```

La migracion `2026_06_27_000000_create_daemon_schema_for_postgres.php` crea las tablas DAEMON en PostgreSQL. La migracion vieja de MySQL se mantiene intacta para instalaciones locales.

## 6. Revisar la copia sin escribir nada

Primero corre el comando sin `--confirm`:

```powershell
php artisan daemon:migrar-a-supabase
```

Ese modo solo revisa conexiones, tablas y conteos. No copia ni borra datos.

## 7. Copiar datos a Supabase desde MySQL local

Si el resumen se ve bien y las tablas destino estan vacias:

```powershell
php artisan daemon:migrar-a-supabase --confirm
```

Si ya hiciste una prueba y quieres volver a copiar desde cero:

```powershell
php artisan daemon:migrar-a-supabase --truncate-target --confirm
```

El comando solo lee de MySQL local. No elimina ni modifica la base original.

## 7B. Copiar datos desde el dump SQL

Si MySQL/Laragon no esta disponible, puedes importar desde el dump incluido:

```powershell
php artisan daemon:importar-dump-supabase
php artisan daemon:importar-dump-supabase --confirm
```

Si ya hiciste una prueba y quieres repetir la importacion:

```powershell
php artisan daemon:importar-dump-supabase --truncate-target --confirm
```

Este comando importa `backend-laravel/database/iaparateens_db.sql`, conserva los ids originales y sincroniza las secuencias de PostgreSQL para que los nuevos registros sigan incrementando correctamente.

## 8. Verificar DAEMON

```powershell
php artisan test
php artisan route:list --path=api/v1 -v
```

Luego ejecuta Angular como siempre:

```powershell
cd C:\laragon\www\daemon\frontend-angular
npm start -- --host 127.0.0.1 --port 4200
```

## 9. Subir archivos a Supabase Storage

La base ya prepara el bucket publico `daemon-assets` mediante migracion. El comando de archivos conserva las rutas que ya usa DAEMON:

```powershell
cd C:\laragon\www\daemon\backend-laravel
php artisan daemon:organizar-storage-supabase
```

Ese modo solo revisa. Cuando tengas las credenciales S3 de Supabase Storage, completa `.env`:

```env
UPLOADS_DISK=supabase
ASSET_CLOUD_URL=https://lbxdcvsrmkkynttgwblc.supabase.co/storage/v1/object/public/daemon-assets
SUPABASE_STORAGE_ENDPOINT=https://lbxdcvsrmkkynttgwblc.storage.supabase.co/storage/v1/s3
SUPABASE_STORAGE_PUBLIC_URL=https://lbxdcvsrmkkynttgwblc.supabase.co/storage/v1/object/public/daemon-assets
SUPABASE_STORAGE_BUCKET=daemon-assets
SUPABASE_STORAGE_REGION=sa-east-1
SUPABASE_STORAGE_ACCESS_KEY_ID=tu_access_key
SUPABASE_STORAGE_SECRET_ACCESS_KEY=tu_secret_key
```

Luego ejecuta la subida real:

```powershell
php artisan daemon:organizar-storage-supabase --confirm
```

Por seguridad, el comando deja en Storage solo archivos referenciados por la base de datos bajo carpetas de negocio (`uploads/perfiles`, `uploads/bots`, `uploads/tienda/premios`, `uploads/insignias`, `uploads/entregas`, `uploads/cuentos`). Los assets del frontend como `img`, `js`, `legacy`, `rive` y `audio` pertenecen al hosting de Angular, no al bucket.

## Notas de seguridad

- No subas `.env` al repositorio.
- No pegues claves de Supabase en Angular si no son publicas.
- Para backend Laravel usa solo usuario/password de PostgreSQL y claves S3 en `.env`.
- El comando de migracion se niega a copiar sobre tablas con datos salvo que uses `--truncate-target`.

## Endurecimiento del esquema

La migracion `2026_06_28_000000_harden_daemon_postgres_schema.php` elimina las tablas vacias heredadas de Laravel (`users` y `password_reset_tokens`) y deja `usuarios` como la tabla real de DAEMON.

Tambien agrega indices y llaves foraneas seguras en las tablas principales. `historial_movimientos` conserva los ids historicos invalidos en columnas `legacy_*`, limpia referencias imposibles y aplica FK reales hacia `usuarios` con `ON DELETE SET NULL`.

Para Firebase Auth, la base ya queda preparada con `firebase_uid` y `telefono` en `usuarios`. La integracion recomendada es mantener Firebase como proveedor de identidad y Supabase PostgreSQL como base de datos de negocio:

```text
usuarios              cuenta DAEMON, rol y enlace con Firebase
perfiles_alumno       datos publicos y personalizacion
progreso_alumno       tokens, rango, mision actual, metricas
perfiles_docente      datos especificos del docente
```

## Rendimiento en desarrollo

Si Laravel corre en tu PC y la base esta en Supabase, cada consulta viaja por internet. Para desarrollo es normal notar mas latencia que con MySQL local. Para mejorar:

- usa la region de Supabase mas cercana a tus usuarios;
- usa indices alineados con consultas frecuentes;
- en produccion, aloja el backend cerca de la region de la base;
- evita consultar muchas rutas en cascada al cargar una pantalla.
