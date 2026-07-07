# DAEMON Backend (Laravel)

Este es el backend principal para el ecosistema educativo DAEMON. Está construido con **Laravel 12** y provee una API RESTful protegida mediante **Laravel Sanctum** y **Firebase Auth**.

## 🚀 Tecnologías Principales
- **PHP 8.2+**
- **Laravel 12**
- **PostgreSQL** (alojado en Supabase)
- **Firebase Auth** (para verificación de correos y login social)
- **Supabase Storage** (para almacenamiento de archivos estáticos)

## 📦 Estructura Arquitectónica
- `app/Models`: Modelos Eloquent. Nota: `$guarded` protege el ID; valida siempre los datos de entrada masiva.
- `app/Services`: **Toda la lógica de negocio debe residir aquí**. Los controladores solo delegan a los servicios.
- `app/Http/Requests`: Validaciones (FormRequests). Todo input de la API debe ser validado aquí.
- `app/Http/Middleware`: Filtros personalizados, incluyendo verificación de roles (`EnsureRole`).

## ⚙️ Instalación Local

1. Clona el repositorio e ingresa a `backend-laravel`.
2. Instala las dependencias:
   ```bash
   composer install
   ```
3. Copia el archivo de entorno y configura tus variables:
   ```bash
   cp .env.example .env
   ```
4. Genera la llave de la aplicación:
   ```bash
   php artisan key:generate
   ```
5. Si trabajas localmente con MySQL o SQLite, corre las migraciones:
   ```bash
   php artisan migrate
   ```
   *(Nota: en producción usamos Supabase/PostgreSQL. Revisa `docs/supabase-postgres.md` para detalles).*
6. Inicia el servidor de desarrollo:
   ```bash
   php artisan serve
   ```

## 🧪 Pruebas (Testing)
Este proyecto utiliza PHPUnit/Pest. Para correr la suite completa:
```bash
php artisan test
```

## 🔒 Autenticación
La autenticación combina Firebase y Sanctum.
1. El frontend obtiene un JWT de Firebase tras el login.
2. El frontend envía el JWT al endpoint `/api/v1/auth/firebase`.
3. El backend verifica el token (usando las llaves públicas de Firebase) y emite un token/cookie de Sanctum para uso subsecuente.
