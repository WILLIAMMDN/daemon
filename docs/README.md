# Índice de documentación DAEMON

Última actualización del índice: 19 de julio de 2026.

Empieza por `AGENTS.md` en la raíz y después lee
`docs/ai-project-context.md` completo. El contexto maestro distingue
PRODUCCIÓN, MAIN, PR, LOCAL y EXTERNO para no confundir una propuesta con una
función desplegada.

## Contexto y operación

| Documento | Uso |
| --- | --- |
| `ai-project-context.md` | Mapa maestro: producto, arquitectura, módulos, estados, PR, riesgos, validación y handoff. |
| `estado-nube-github-produccion.md` | Firebase, Render, Supabase, GitHub y despliegues. |
| `qa-produccion.md` | Pruebas, QA visual, smoke y verificación de bundles. |
| `infraestructura-operativa.md` | Runtime, staging, backups, restauración y rollback. |
| `implementacion-plataforma-estandar-2026-07-19.md` | Núcleo académico, economía, seguridad, analítica e interoperabilidad. |
| `release-2026-07-19-plataforma-estandar.md` | Evidencia del release funcional vigente. |
| `incidentes/2026-07-18-restauracion-supabase.md` | Incidente, restauración y controles preventivos. |

## Frontend y portales

| Documento | Uso |
| --- | --- |
| `frontend-architecture.md` | Límites entre routes, core, features y shared. |
| `frontend-ui-standard.md` | Uso profesional de Angular 21 y NG-ZORRO. |
| `portal-alumno.md` | Layout, dashboard, perfil, misiones, ranking, tienda y criatura. |
| `sistema-visual-portal-alumno.md` | Paleta, tipografía, responsive, accesibilidad y reglas visuales. |
| `plan-evolucion-visual-portal-alumno.md` | Evolución planificada de la experiencia visual. |
| `portal-familias.md` | Cuenta tutor, vínculo, reporte, bienestar digital y pagos externos. |

## Dominios de negocio

| Documento | Uso |
| --- | --- |
| `gamificacion-xp-daemons.md` | XP, DAEMONS, ledger, nivel, ranking y canjes. |
| `sistema-mascotas-cosmeticos.md` | Especies, capas, catálogo, inventario y vestidor. |
| `interoperabilidad-oneroster-lti.md` | OneRoster 1.2 y LTI Advantage; alcance y límites honestos. |
| `firebase-auth.md` | Google, email/password, verificación, recuperación y tutores. |
| `supabase-postgres.md` | PostgreSQL, Storage, migración y responsabilidades. |
| `privacidad-kids-teens.md` | Consentimiento, exportación, eliminación, seguridad y retención. |
| `api-crud.md` | Contratos y operaciones CRUD. |
| `crud-roadmap.md` | Ruta histórica de evolución CRUD/administración. |
| `datos-prueba.txt` | Identificadores autorizados para QA; claves redactadas en Git. |

## Historial

`release-2026-07-14-portal-alumno.md` conserva la evidencia del release anterior
del portal estudiante. Los documentos de release son históricos: no sustituyen
la comprobación del commit servido actualmente.

## Lectura mínima por tarea

### Pantalla o navegación del estudiante

1. `ai-project-context.md`, secciones 8–10 y 21.
2. `portal-alumno.md`.
3. `sistema-visual-portal-alumno.md`.
4. Feature y tests correspondientes.

### Recompensas, ranking, tienda o criatura

1. `gamificacion-xp-daemons.md`.
2. `sistema-mascotas-cosmeticos.md` si aplica.
3. Servicios Laravel y pruebas del dominio.

### Autenticación o desarrollo local

1. `firebase-auth.md`.
2. `ai-project-context.md`, secciones 12 y 20.
3. Estado del PR 23 o 24 si el cambio depende de ellos.

### Currículo, Gradebook, OneRoster o LTI

1. `implementacion-plataforma-estandar-2026-07-19.md`.
2. `interoperabilidad-oneroster-lti.md`.
3. Estado actual del PR 22 antes de atribuir Gradebook a `main`.

### Familias, privacidad o pagos

1. `portal-familias.md`.
2. `privacidad-kids-teens.md`.
3. `infraestructura-operativa.md` para retención y operación.

### Publicar o diagnosticar producción

1. `estado-nube-github-produccion.md`.
2. `infraestructura-operativa.md`.
3. `qa-produccion.md`.
4. Evidencia del release actual.

## Regla de mantenimiento

Cuando cambie una decisión de código, actualizar en el mismo PR:

- la guía temática;
- `ai-project-context.md` si afecta arquitectura, estado, operación o una regla
  transversal;
- `AGENTS.md` si cambia el camino de incorporación;
- este índice si aparece, desaparece o cambia de función un documento;
- una nota de release solo después de publicar y verificar producción.

El código y la configuración efectiva tienen prioridad. Si una guía se vuelve
obsoleta, corregirla antes de integrar el cambio.
