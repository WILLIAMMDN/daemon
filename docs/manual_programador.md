# Manual del Programador / Arquitectura de Software - DAEMON

Este documento está dirigido a ingenieros de software, arquitectos y desarrolladores DevOps que se integran al proyecto DAEMON. Define la arquitectura del sistema, el flujo de datos y las convenciones del código fuente.

---

## 1. Visión General de la Arquitectura

DAEMON es una aplicación web full-stack diseñada bajo una arquitectura moderna de cliente-servidor, con estricta separación de responsabilidades.

- **Frontend:** Angular 21 (Single Page Application). Patrón 100% Standalone (Sin `NgModules`). Gestión de estado reactivo nativo usando `Signals`.
- **Backend (API Auth & Lógica):** Laravel 12 (PHP 8.2+). Actúa como la única autoridad sobre los datos de negocio, gamificación y reglas.
- **Base de Datos:** PostgreSQL alojado en Supabase. Laravel actúa como el **único cliente** de la base de datos (no se exponen APIs de Supabase al frontend).
- **Gestión de Identidad (Auth):** Firebase Authentication. Se utiliza exclusivamente para la validación de correos, login social (Google) y recuperación de contraseñas.
- **Almacenamiento (Storage):** Supabase Storage (Bucket: `daemon-assets`) y Firebase Hosting para recursos estáticos del frontend.

---

## 2. Configuración del Entorno Local

Para ejecutar el ecosistema DAEMON localmente, necesitas:
- **Node.js** v24+
- **PHP** v8.2+
- **Composer** v2+
- Entorno de servidor local (ej. Laragon en Windows, Valet en Mac, o Docker/Sail).

### Pasos de Inicialización
1. **Frontend:**
   ```bash
   cd frontend-angular
   npm install
   npm run start # Levanta en http://localhost:4200
   ```
2. **Backend:**
   ```bash
   cd backend-laravel
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate
   php artisan serve # Levanta en http://localhost:8000
   ```
   *Nota: Verifica que el directorio `vendor` no sea un Symlink a carpetas temporales, esto romperá el autoloader de Composer.*

---

## 3. Autenticación Híbrida (Flujo Crítico)

DAEMON no utiliza una sesión típica. Implementa un modelo de seguridad **Híbrido (Firebase + Sanctum)** para garantizar máxima seguridad y aislamiento:

1. **Autenticación en Frontend:** El cliente inicia sesión usando el SDK de Firebase (`signInWithPopup` o `signInWithEmailAndPassword`).
2. **Generación de JWT:** Firebase devuelve un *ID Token* (JWT).
3. **Paso al Backend:** El cliente envía este JWT al endpoint de Laravel: `POST /api/v1/auth/firebase`.
4. **Verificación Server-side:** Laravel usa `FirebaseTokenVerifier.php` para descargar las claves públicas de Google, validar la firma `RS256`, el `aud` y el `iss`.
5. **Mapeo de Usuario:** `AutenticacionService.php` busca al usuario por `firebase_uid` o `email`. Si no existe (y se permite el registro), se crea el registro en PostgreSQL.
6. **Emisión de Token Sanctum:** Laravel destruye cualquier token anterior y emite un nuevo **Bearer Token** de Laravel Sanctum.
7. **Consumo de API:** A partir de ese momento, el cliente se comunica con Laravel usando *únicamente* el Token de Sanctum. Firebase ya no interviene hasta el próximo inicio de sesión.

---

## 4. Estructura del Código Fuente

### 4.1. Frontend (`frontend-angular/src/app`)
La arquitectura sigue la convención *Feature-based*:
- `/core`: Componentes "App-shell" que forman el esqueleto (Layouts, Sidebar, Topbar, Interceptores HTTP). *No debe importar de `/features`*.
- `/features`: Módulos de negocio (Alumno, Tutor, Tienda, Ranking). Tienen su propio enrutamiento.
- `/shared`: UI genérica (Botones, Tarjetas, Modales). Utilizan Tailwind intensivamente.
- `/styles`: Sistema de diseño (Tokens en `tailwind.config.js`). No hay CSS espagueti; todo hereda de tokens como `text-primary-900` o `shadow-bento`.

### 4.2. Backend (`backend-laravel/app`)
- `/Http/Controllers`: Muy delgados. Solo reciben la request, delegan y devuelven JSON.
- `/Services`: Contienen toda la lógica de negocio (ej. `GamificacionService`, `AutenticacionService`).
- `/Models`: Modelos de Eloquent. Usan Eager Loading (`with()`, `withCount()`) estrictamente para evitar problemas de N+1 queries.
- `routes/api.php`: Rutas protegidas por Middlewares de roles (`role:alumno`, `role:tutor`).

---

## 5. Despliegue y CI/CD

- **Frontend (Firebase Hosting):** 
  El frontend se compila bajo presupuestos estrictos (máximo 1MB initial bundle).
  ```bash
  npm run build
  firebase deploy --only hosting:estudiante --project daemon-a41f8
  ```
  *La caché de recursos estáticos está configurada a 1 año (`max-age=31536000`) en `firebase.json` aprovechando el cache busting de Angular.*

- **Backend (Render):**
  El backend se despliega automáticamente mediante conexión a GitHub. Cualquier commit directo a la rama `main` lanza un nuevo *build* en Render.

---

## 6. Convenciones y Seguridad

- **Seguridad CSP:** El `firebase.json` bloquea la carga de iframes (`X-Frame-Options: DENY`) y restringe los orígenes de scripts para mitigar inyecciones XSS.
- **XSS en Angular:** Está estrictamente prohibido el uso de `[innerHTML]` o el bypass del Sanitizer en toda la plataforma. Toda la data dinámica usa interpolación segura.
- **CORS:** Restringido explícitamente a los dominios de producción y localhost. No se permiten comodines `*`.
- **Accesibilidad:** Uso riguroso de roles ARIA (`aria-label`, `aria-hidden`) en componentes interactivos, auditado con éxito para WCAG 2.1 AA.

---
*Fin del Manual del Programador. Mantenido por el equipo de Arquitectura DAEMON.*
