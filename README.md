# DAEMON - plataforma academica Angular + Laravel

Esta entrega separa la aplicacion PHP original en una plataforma academica DAEMON:

- `frontend-angular/`: interfaz Angular 21 por modulos, layouts, guardias, interceptor y servicios.
- `backend-laravel/`: API REST Laravel 12 con Sanctum, controladores, modelos y almacenamiento.
- `database/iaparateens_db.sql`: esquema y datos originales de MariaDB.
- `legado/`: ZIP original conservado como respaldo y referencia funcional.
- `frontend-angular/public/legacy/`: audio, CSS, JavaScript, PDFs y modelos de IA originales.

## Requisitos

- PHP 8.2 o superior con extensiones `pdo_mysql`, `mbstring`, `openssl` y `fileinfo`.
- Composer 2, Node.js 22, npm 11 y MariaDB/MySQL.
- Ollama con el modelo `gemma2:9b` para el chatbot.

## Instalacion

1. Crea una base vacia llamada `iaparateens_db`.
2. En `backend-laravel`, ejecuta `composer install`.
3. Copia `.env.example` como `.env`, revisa las credenciales de MariaDB y ejecuta `php artisan key:generate`.
4. Ejecuta `php artisan migrate`. La primera migracion importa `database/iaparateens_db.sql` y las siguientes agregan la infraestructura de Laravel/Sanctum.
5. Ejecuta `php artisan storage:link` y luego `php artisan serve`.
6. En `frontend-angular`, ejecuta `npm ci` y `npm start`.
7. Para IA local: `ollama pull gemma2:9b` y luego inicia Ollama.

Frontend: `http://localhost:4200`  
Backend: `http://localhost:8000`  
Salud API: `http://localhost:8000/api/v1/salud`

## Datos de prueba incluidos

- Alumno: `jose123` / `1234`
- Docente: `william1013` / `M_edina9735`

## Modulos conectados

Autenticacion, perfiles, comunidad, alumnos y tokens, insignias, misiones y entregas, tienda y canjes, evaluaciones y resultados, chatbot Ollama, cerebro de aprendizaje por refuerzo, competencia en vivo, cuentos, ranking, certificados y carga de archivos.

## Notas

- No publiques el `.env` de produccion ni una base con datos de estudiantes.
- La URL de la API Angular esta en `src/app/core/servicios/api.ts`.
- El modelo y la URL de Ollama se configuran con `OLLAMA_MODEL` y `OLLAMA_URL`.
- La carpeta `public/legacy` conserva recursos de juegos y laboratorio que pueden reutilizarse sin depender del PHP monolitico.
