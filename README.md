# DAEMON

DAEMON es una plataforma academica para gestionar una academia con estudiantes, docentes, actividades, recompensas e inteligencia artificial local. Su objetivo es centralizar el aprendizaje en un entorno digital donde el alumno pueda avanzar por misiones, usar un asistente IA, ganar tokens, canjear premios, rendir evaluaciones y participar en dinamicas de aula.

## Que permite hacer

- Registrar alumnos y docentes.
- Iniciar sesion con roles separados.
- Gestionar paneles para estudiante y docente.
- Crear y revisar misiones con evidencias.
- Administrar tokens, insignias, tienda y canjes.
- Crear evaluaciones y revisar resultados.
- Usar un chatbot educativo conectado a Ollama.
- Trabajar con cuentos, ranking, certificados y competencia en vivo.
- Conservar recursos interactivos para laboratorio, juegos y aprendizaje con IA.

## Estado actual

- Frontend Angular con rutas para alumno, docente y paginas publicas.
- Backend Laravel con API REST versionada en `api/v1`.
- Autenticacion con Laravel Sanctum.
- Panel principal de alumno con resumen de tokens, misiones, insignias y canjes.
- Panel docente con metricas de aula, economia escolar, pendientes y ranking.
- Integracion preparada para IA local mediante Ollama.
- Base de datos conectada a los modulos principales de la plataforma.

## Tecnologias

- Angular 21
- Laravel 12
- PHP 8.2+
- MariaDB/MySQL
- Laravel Sanctum
- Ollama con `gemma2:9b`

## Estructura del proyecto

```text
backend-laravel/              API REST, autenticacion, modelos, servicios y pruebas
frontend-angular/             Aplicacion web Angular para alumnos y docentes
database/iaparateens_db.sql   Base inicial del proyecto
legado/                       Referencia historica del sistema anterior
scripts/iniciar.ps1           Arranque local de backend y frontend
docs/                         Documentacion del proyecto
```

## Requisitos

- PHP 8.2 o superior con `pdo_mysql`, `mbstring`, `openssl` y `fileinfo`
- Composer 2
- Node.js 22 y npm 11
- MariaDB o MySQL
- Ollama, solo si usaras el chatbot local

## Instalacion local

Clona el repositorio:

```powershell
git clone https://github.com/WILLIAMMDN/daemon.git C:\laragon\www\daemon
cd C:\laragon\www\daemon
```

Configura el backend:

```powershell
cd backend-laravel
composer install
Copy-Item .env.example .env
php artisan key:generate
```

En `backend-laravel/.env`, revisa estos valores:

```env
APP_NAME=DAEMON
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=yachayia_rural
DB_USERNAME=root
DB_PASSWORD=
FRONTEND_URL=http://localhost:4200
```

Crea la base de datos vacia `yachayia_rural` en MySQL/MariaDB y ejecuta:

```powershell
php artisan migrate
php artisan storage:link
```

Configura el frontend:

```powershell
cd ..\frontend-angular
npm ci
```

## Ejecutar el proyecto

Inicia el backend:

```powershell
cd C:\laragon\www\daemon\backend-laravel
php artisan serve --host=127.0.0.1 --port=8000
```

Inicia el frontend en otra terminal:

```powershell
cd C:\laragon\www\daemon\frontend-angular
npm start -- --host 127.0.0.1 --port 4200
```

URLs locales:

- Frontend: `http://127.0.0.1:4200`
- Backend: `http://127.0.0.1:8000`
- Salud API: `http://127.0.0.1:8000/api/v1/salud`

Tambien puedes usar:

```powershell
.\scripts\iniciar.ps1
```

## IA local con Ollama

Instala el modelo usado por el chatbot:

```powershell
ollama pull gemma2:9b
```

Variables relacionadas:

```env
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma2:9b
```

## Datos de prueba

- Alumno: `jose123` / `1234`
- Docente: `william1013` / `M_edina9735`

## Modulos de DAEMON

- Autenticacion y recuperacion de clave
- Panel de alumno
- Panel docente
- Perfil y comunidad
- Alumnos, tokens e historial
- Insignias
- Misiones y entregas
- Tienda y canjes
- Evaluaciones y resultados
- Chatbot con Ollama
- Laboratorio IA
- Competencia en vivo
- Cuentos
- Ranking
- Certificados
- Carga de archivos

## Comandos utiles

Pruebas backend:

```powershell
cd C:\laragon\www\daemon\backend-laravel
php artisan test
php artisan route:list --path=api/v1 -v
```

Build frontend:

```powershell
cd C:\laragon\www\daemon\frontend-angular
npm run build
```

Verificar estado de Git:

```powershell
cd C:\laragon\www\daemon
git status --short --branch
```

## Creditos de terceros

- Mascota interactiva del login: "Login Teddy" by yoonikuu, remix de "Animated Login Screen" by JcToon, licencia CC BY 4.0. Fuente: https://rive.app/marketplace/4771-9633-login-teddy/

## Notas de seguridad

- No subas `backend-laravel/.env`.
- No publiques bases de datos reales con informacion sensible de estudiantes.
- Antes de despliegue publico, revisa credenciales, CORS, `APP_DEBUG=false` y configuracion de almacenamiento.

## Roadmap inmediato

- Convertir pantallas genericas de `PaginaApi` en vistas finales.
- Pulir flujos de misiones, tienda, evaluaciones, lista de alumnos, perfil y ranking.
- Preparar configuracion de despliegue.
- Revisar branding visual final: logo, favicon, colores y textos publicos.
