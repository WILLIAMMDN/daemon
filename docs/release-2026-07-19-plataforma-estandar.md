# Evidencia de release — plataforma estándar — 19 de julio de 2026

## Alcance publicado

El código funcional publicado corresponde al commit
`2d76c4558149a48b6b4f91013dc00d6e1afe2ce4`. Incluye el núcleo académico,
ledger de XP/DAEMONS, OneRoster 1.2 de lectura, lanzamiento LTI 1.3,
moderación, bloqueos, analítica minimizada, outbox, correlación de solicitudes
y las pantallas de currículo para estudiante y docente.

El commit tiene como ancestro `919aa7ae53225c2d527469ad06c017b4fd31704b`,
que contiene el rediseño del panel de estadísticas del alumno. Los cambios
locales posteriores de interfaz no se mezclaron con este release.

## Evidencia automatizada

| Comprobación | Resultado |
| --- | --- |
| Laravel | 134 tests, 475 assertions, OK |
| Frontend unitario | 11 suites, 39 tests, OK |
| Arquitectura Angular | `npm run check:architecture`, OK |
| Build Angular | 912,08 kB iniciales, dentro del presupuesto, OK |
| E2E público | 1 escenario, OK |
| CI backend con PostgreSQL | GitHub run `29669712909`, OK |
| Firebase build/deploy/smoke | GitHub run `29669712861`, OK |
| Smoke integral posterior | `scripts/smoke-produccion.ps1`, OK |

Las advertencias Sass por `@import` pertenecen a la línea base previa; no se
aceptó ninguna advertencia nueva de presupuesto de bundle.

## Evidencia de producción

Verificación posterior al despliegue:

```text
Frontend:       https://daemonestudiante.web.app
Backend commit: 2d76c4558149a48b6b4f91013dc00d6e1afe2ce4
Database:       ok=true
usuarios:       50
instituciones:  1
migraciones:    31
```

Se comprobó la presencia de `cursos`, `movimientos_economia`,
`clientes_oneroster`, `registros_lti` y `eventos_producto`. OneRoster rechaza
acceso sin token con HTTP 401 y LTI devuelve HTTP 422 JSON cuando faltan los
parámetros OIDC obligatorios.

## Operación de Render

El monitor de disponibilidad corre cada diez minutos. Es una mitigación para
la instancia gratuita, no una garantía de disponibilidad ni un sustituto de
un plan con SLA. No se realizó ninguna compra ni cambio de plan sin autorización
económica del propietario.

## Interoperabilidad pendiente de un tercero

La implementación no se presenta como certificada por 1EdTech. Para activar
una integración concreta aún se requieren las credenciales y metadatos del
SIS/LMS socio. AGS y NRPS deben verificarse de extremo a extremo con los
endpoints y scopes reales que ese LMS anuncie.

## Recuperación de datos relacionada

Durante el QA ocurrió el incidente documentado en
`docs/incidentes/2026-07-18-restauracion-supabase.md`. La base fue restaurada
desde el backup de las 08:57 UTC del 18 de julio y luego migrada de forma
incremental a 31 migraciones. Toda escritura ocurrida entre ese backup y la
restauración debe considerarse potencialmente ausente y reconciliarse con
Firebase Auth y los registros operativos disponibles.
