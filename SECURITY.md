# Política de Seguridad de DAEMON

## Versiones Soportadas

Actualmente, solo la rama principal (`main`) y la versión en producción reciben actualizaciones de seguridad.

| Versión | Soportada          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporte de Vulnerabilidades

La seguridad es una prioridad absoluta para el ecosistema DAEMON, dado que gestionamos datos de estudiantes y docentes. Si descubres una vulnerabilidad de seguridad en el proyecto, te pedimos encarecidamente que **no la divulgues públicamente** hasta que hayamos tenido tiempo de solucionarla.

Por favor, envía tus reportes de seguridad directamente al equipo principal a través del correo electrónico:

**📧 williamir1234@gmail.com**

### Qué incluir en tu reporte
Para ayudarnos a triar y solucionar el problema rápidamente, por favor incluye:
- Una descripción clara de la vulnerabilidad.
- Los pasos exactos para reproducirla.
- El impacto potencial si la vulnerabilidad es explotada.
- Cualquier posible mitigación que hayas identificado.

### Nuestro compromiso
- Confirmaremos la recepción de tu reporte en un plazo de **48 horas**.
- Te mantendremos informado sobre el progreso hacia la solución.
- Una vez resuelto, publicaremos un aviso de seguridad y te daremos crédito (si así lo deseas).

## Prácticas de Seguridad en el Código
- **Autenticación**: Utilizamos Firebase Auth para el manejo seguro de identidades y Laravel Sanctum para la protección de la API.
- **Base de Datos**: Ningún modelo que reciba datos del exterior debe tener `$guarded = []`. Siempre se usan validaciones estrictas (`FormRequests`).
- **CORS y Cabeceras**: DAEMON implementa políticas estrictas de CORS y cabeceras de seguridad (`X-Frame-Options`, `Content-Security-Policy`).
