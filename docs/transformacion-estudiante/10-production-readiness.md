# Paquete 10 — Production readiness

- Estado: matriz de riesgos y checklist; pendientes declarados
- Fecha: 2026-08-03
- Rama: `refactor/student-production-hardening`
- Cambios productivos: ninguno

## Matriz de riesgos restantes

| # | Riesgo | Severidad | Mitigación | Estado |
|---|---|---|---|---|
| 1 | Reglas Firestore v2 no activadas en producción | Alta | Deploy bloqueado hasta migrar datos legacy y custom claims | Pendiente (dueño) |
| 2 | Datos legacy de cuentos (`data_1..6`) en Firestore/PostgreSQL | Alta | `docs/MIGRACION-CUENTOS.md` + dry-run en emulador | Plan listo, migración no ejecutada |
| 3 | Storage sin activar; proveedor en decisión | Media | Abstracción lista; bloque 1 diferido por el dueño | Pendiente (dueño) |
| 4 | Moderación de contenido de menores | Media | Estado `moderacion_estado` en reglas + `publicarModerado` admin; reportes/razón pendientes | Parcial |
| 5 | Custom claims DAEMON (docente/admin) sin proyección verificada en reglas | Media | Documentado en 03-firestore-security | Pendiente |
| 6 | E2E autenticados dependen de credenciales locales | Baja | Mocks estables + emulador | Parcial |
| 7 | Contraste/zoom 200 % por tema | Baja | Catálogo `/dev/design-system` + checklist A11y | Parcial |

## Checklist de terminado

- [x] Arquitectura documentada (ADR-001..006 + transformación 00..06).
- [x] TypeScript sin errores; build producción correcto.
- [x] Sin `any` nuevo; sin secretos nuevos; sin escrituras públicas innecesarias.
- [x] Firestore Rules tests correctos (31/31 en emulador).
- [x] Laravel tests correctos (144).
- [x] Frontend unit + checks verdes (77+).
- [x] Sin tocar producción.
- [ ] E2E crítico completo (en curso).
- [ ] Mobile/tablet/desktop validado en todos los viewports (parcial).
- [ ] Contraste y focus validados por tema (parcial).
- [ ] Imágenes optimizadas (pendiente).
- [ ] Medición de rendimiento real (pendiente).

## Conclusión

La transformación está en una fase **verificable y reversible**: la rama
compila, las suites pasan y ningún cambio afectó producción. El paso a
production-ready requiere, en orden: (1) decidir el proveedor de Storage,
(2) ejecutar la migración de cuentos con dry-run previo, (3) activar reglas v2
y (4) cerrar moderación y E2E. No se declara "production ready" sin esa
evidencia.
