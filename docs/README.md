# Índice de documentación DAEMON

Empieza por `AGENTS.md` en la raíz. Después abre solo la guía que corresponda
a la tarea.

## Contexto general

| Documento | Uso |
| --- | --- |
| `ai-project-context.md` | Arquitectura completa, decisiones y archivos clave. |
| `estado-nube-github-produccion.md` | Firebase, Render, Supabase, GitHub y despliegues. |
| `qa-produccion.md` | Pruebas, QA visual, smoke y verificación de bundles. |

## Portal alumno

| Documento | Uso |
| --- | --- |
| `portal-alumno.md` | Layout, dashboard, perfil, misiones, ranking y tienda. |
| `sistema-visual-portal-alumno.md` | Paleta, tipografía, header, tarjetas y reglas visuales. |
| `gamificacion-xp-daemons.md` | Separación de XP y DAEMONS, nivel, ranking y canjes. |
| `release-2026-07-14-portal-alumno.md` | Historial completo, commits, archivos y evidencia del release. |
| `frontend-ui-standard.md` | Uso de NG-ZORRO y estándar compartido de componentes. |

## Autenticación, datos y almacenamiento

| Documento | Uso |
| --- | --- |
| `firebase-auth.md` | Google, email/password, verificación y recuperación. |
| `supabase-postgres.md` | PostgreSQL, storage, migraciones y responsabilidades. |
| `datos-prueba.txt` | Cuentas y datos de prueba autorizados para QA. |

## API y trabajo pendiente

| Documento | Uso |
| --- | --- |
| `api-crud.md` | Contratos y operaciones CRUD. |
| `crud-roadmap.md` | Ruta de evolución de CRUD y módulos administrativos. |

## Lectura mínima por tarea

### Cambiar una pantalla del alumno

1. `portal-alumno.md`
2. `sistema-visual-portal-alumno.md`
3. archivo de la feature correspondiente

### Cambiar recompensas, nivel, ranking o tienda

1. `gamificacion-xp-daemons.md`
2. `portal-alumno.md`
3. pruebas `GamificacionXpTest`

### Cambiar autenticación

1. `firebase-auth.md`
2. `ai-project-context.md`

### Publicar o diagnosticar producción

1. `estado-nube-github-produccion.md`
2. `qa-produccion.md`

## Regla de mantenimiento

Cuando una decisión de código cambie, actualizar en el mismo PR:

- la guía temática;
- `ai-project-context.md` si afecta arquitectura general;
- `AGENTS.md` si cambia el camino de incorporación;
- una nota de release si el cambio llega a producción.

El código vigente tiene prioridad sobre una guía antigua. Si existe una
diferencia, verificar el código y corregir la documentación antes del merge.
