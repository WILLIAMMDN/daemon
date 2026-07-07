# Contribuir a DAEMON

¡Gracias por tu interés en contribuir a DAEMON! DAEMON es una plataforma educativa gamificada que integra Angular, Laravel y modelos de IA locales. Toda contribución, desde reportar un bug hasta implementar una nueva característica, es bienvenida.

## Código de Conducta
Al participar en este proyecto, esperamos que te adhieras a un comportamiento profesional y respetuoso con todos los miembros de la comunidad.

## Estructura del Proyecto
El proyecto está dividido en dos partes principales:
- `/frontend-angular`: SPA en Angular 21. Usa TailwindCSS y NG-ZORRO.
- `/backend-laravel`: API REST en Laravel 12 conectada a Supabase (PostgreSQL).

## Proceso de Desarrollo
1. **Fork** el repositorio y clónalo localmente.
2. Crea una rama para tu feature o bugfix: `git checkout -b feature/mi-nueva-caracteristica`.
3. Sigue las guías de estilo:
   - **Frontend**: Usa standalone components de Angular y maneja el estado con Signals.
   - **Backend**: Coloca la lógica de negocio en la capa de `Services`, valida los datos con `FormRequests` y mantén los controladores delgados.
4. **Testing**:
   - Backend: Asegúrate de que los tests pasen ejecutando `php artisan test`.
   - Frontend: Ejecuta `npm test` para asegurar que las pruebas de Jest pasan.
5. Haz commit de tus cambios siguiendo [Conventional Commits](https://www.conventionalcommits.org/).
   - Ejemplo: `feat(misiones): añadir validación de fecha de entrega`
6. Haz push a tu fork y abre un **Pull Request** hacia la rama `main`.

## Reporte de Bugs
Si encuentras un bug, por favor abre un issue incluyendo:
- Pasos para reproducir.
- Comportamiento esperado vs actual.
- Entorno (Navegador, versión de Node/PHP).

¿Dudas adicionales? Contáctanos en williamir1234@gmail.com.
