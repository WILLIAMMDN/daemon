# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.
El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/), y este proyecto se adhiere vagamente a [Semantic Versioning](https://semver.org/).

## [Unreleased] - 2026-07-07

### Added
- **Licencia**: Se agregó la licencia MIT al repositorio.
- **Seguridad**: Se establecieron los archivos `SECURITY.md` y `CONTRIBUTING.md` para estandarizar la contribución comunitaria y el reporte de vulnerabilidades.
- **Backend CI/CD**: Implementación de GitHub Actions (`backend-tests.yml`) para la ejecución automatizada de tests de Laravel (`php artisan test`).
- **Frontend Testing**: Instalación base de `Jest` en Angular 21, reemplazando la configuración ausente de Karma.
- **Modelos**: Se agregaron las relaciones Eloquent faltantes a los modelos `Mision`, `Entrega`, y `Canje`.

### Fixed
- **Seguridad (Crítico)**: Se eliminó el mass assignment permisivo (`$guarded = []`) en `ModeloBase.php` y se cambió a `$guarded = ['id']` para proteger las llaves primarias.
- **Seguridad**: Se ocultó explícitamente el campo `datos_secretos` en el modelo `Premio` mediante la propiedad `$hidden`.
- **Rutas API**: Se eliminó la ruta duplicada `/login-google` en `routes/api.php`.
- **Rutas API**: Se corrigió el ordenamiento de rutas en el namespace `ia-modelos/admin` para evitar la colisión de `DELETE /bulk` con el parámetro `/{modelo}`.
- **Credenciales**: Se redactaron credenciales expuestas en texto plano dentro de la documentación (`docs/datos-prueba.txt` y `README.md`).
