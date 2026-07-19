# Implementación de plataforma educativa estándar — 19 de julio de 2026

Este documento registra el alcance técnico ejecutado para convertir DAEMON en
una plataforma académica, gamificada e interoperable sin sustituir su
arquitectura Angular/Laravel/Supabase/Firebase.

## Resultado

Se añadió una capa compatible hacia atrás. `usuarios.id_aula`, misiones,
evaluaciones, tienda y mascota continúan operando; las nuevas matrículas,
currículo, eventos y ledger complementan esas tablas en vez de reemplazarlas.

### Núcleo académico

- `periodos_academicos`: año, semestre, trimestre y período de calificación.
- `cursos`: currículo versionable con estados `draft`, `published`, `archived`.
- `unidades_curso`, `lecciones` y contenido por bloques JSON.
- `objetivos_aprendizaje` y relación muchos-a-muchos por lección.
- `matriculas_aula`: una persona puede participar en varias clases; una puede
  mantenerse como principal para compatibilidad con `usuarios.id_aula`.
- `progresos_leccion`: estado, porcentaje, fechas y evidencia mínima.
- Backfill automático: cada institución recibe período y curso base; aulas y
  usuarios existentes reciben `sourced_id` no basado en PII y matrículas.

API autenticada:

```text
GET  /api/v1/academico
POST /api/v1/academico/periodos
POST /api/v1/academico/cursos
PUT  /api/v1/academico/cursos/{curso}
POST /api/v1/academico/cursos/{curso}/unidades
POST /api/v1/academico/unidades/{unidad}/lecciones
PUT  /api/v1/academico/aulas/{aula}/curso
POST /api/v1/academico/aulas/{aula}/usuarios/{usuario}
GET  /api/v1/alumno/aprendizaje
PUT  /api/v1/alumno/aprendizaje/lecciones/{leccion}/progreso
```

Los docentes quedan limitados a su institución. Un administrador conserva
alcance global. Curso, período y aula deben pertenecer a la misma institución.

### Economía de gamificación

`movimientos_economia` es un libro append-only con moneda `xp` o `daemons`,
variación, saldo antes/después, actor, origen, UUID y clave de idempotencia.
Misiones, evaluaciones, competencias, ajustes docentes y canjes escriben en el
ledger. XP sigue siendo progreso histórico y nunca se gasta; DAEMONS sigue
siendo saldo canjeable. `usuarios.experiencia` y `usuarios.tokens` permanecen
como proyecciones rápidas dentro de la misma transacción.

### Seguridad infantil y comunidad

- Reportes tipificados para acoso, amenaza, contenido sexual, autolesión,
  spam, suplantación u otros.
- Severidad alta automática para categorías de riesgo.
- Cola administrativa de revisión y resolución.
- Bloqueo/desbloqueo; perfiles y chat dejan de mostrar personas bloqueadas.
- La comunidad de estudiantes se limita a su institución/aula.

No se añadió vigilancia. No se registran URLs visitadas, texto de chat,
pulsaciones, dirección IP ni contenido escrito en la analítica.

### Analítica, eventos y observabilidad

`eventos_producto` acepta únicamente una lista cerrada de eventos y
propiedades. La sesión se almacena como hash. `eventos_dominio` implementa el
patrón outbox; economía, publicación de cursos y finalización de lecciones
producen eventos sin PII textual.

Cada respuesta API incluye `X-Request-ID`; el mismo UUID se adjunta al contexto
de logs para correlación con Sentry y Render.

### UX Angular

- `/alumno/recursos` consume el currículo real: cursos, unidades, lecciones,
  progreso, skeleton, estado vacío, reintento y diseño móvil.
- Finalizar una lección actualiza la pantalla y envía telemetría no bloqueante.
- `/docente/curriculo` crea períodos, cursos, unidades y lecciones y publica
  cursos.
- El sidebar docente incorpora `Currículo` sin modificar el trabajo visual
  abierto en el componente del sidebar.

### Operación

- El monitor de producción pasó de 15 a 10 minutos y tiene timeout de cinco
  minutos.
- Es una mitigación del *spin-down* gratuito, no un SLA: GitHub cron puede
  retrasarse y una instancia gratuita puede continuar teniendo arranque frío.
- Se añadió `.env.testing` SQLite y una prohibición de `migrate:fresh`,
  `refresh`, `reset`, `rollback` y `db:wipe` cuando el host es Supabase. Las
  migraciones incrementales de Render continúan permitidas.

## Validación ejecutada

```text
Migración completa SQLite: OK (31 migraciones)
Suite Laravel heredada: 129 tests / 431 assertions, OK
Pruebas nuevas dirigidas: 5 tests / 44 assertions, OK
Smoke de producción tras recuperación: OK
```

Antes de publicar se exige además:

```powershell
cd frontend-angular
npm run test:ci
npm run check:architecture
npm run build

cd ..\backend-laravel
php artisan test
```

## Trabajo externo que no puede fingirse

- La certificación oficial OneRoster requiere el programa de conformidad de
  1EdTech; implementar el contrato no equivale a estar certificado.
- Cada LMS LTI debe proporcionar issuer, client ID, deployment ID, login OIDC,
  token URL y JWKS. El registro queda inactivo hasta validar su JWKS.
- AGS y NRPS solo pueden comprobarse de extremo a extremo contra un LMS socio.
- Un plan de Render con SLA implica una compra y no se modificó sin autorización
  económica explícita.

## Referencias normativas

- [OneRoster 1.2](https://standards.1edtech.org/oneroster/specifications/standards/v1p2)
- [OneRoster Rostering Service](https://standards.1edtech.org/oneroster/specifications/standards/v1p2/services/rostering/im)
- [LTI Implementation Guide](https://standards.1edtech.org/lti/guides/implementation_guide/implementation-guide)
- [LTI Core 1.3.1](https://standards.1edtech.org/lti/specifications/core/lti-spec1p3p1)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
