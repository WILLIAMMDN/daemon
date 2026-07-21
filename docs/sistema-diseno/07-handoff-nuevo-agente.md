# Handoff para un agente nuevo

> Si acabas de llegar a este repo y el owner es Max William Medina
> Castro, lee este archivo antes de hacer cualquier cosa.

## TL;DR (30 segundos)

DAEMON es una plataforma académica real para menores (Angular 21 +
Laravel 12 + Supabase + Firebase Auth + Render). Está en producción con
alumnos reales. **No es un demo ni un proyecto de练习.**

Hay un plan de rediseño de UI en curso. Está documentado en
`docs/sistema-diseno/`. **No reescribas lo que está migrándose.** Lee el
estado actual en `00-resumen-ejecutivo.md` antes de proponer cambios.

## Quién es Max

- Trabaja con su hermano, pero el control del proyecto lo tiene Max.
- Tono directo, pregunta "qué hago aquí" cuando entra a una pantalla
  nueva — necesita guía corta y concreta.
- No quiere que asumas cosas. Si dudas, pregunta con una recomendación
  explícita, no con un menú de opciones.
- El perfil de usuario está en `C:\Users\MEDINA\.mavis\memory\user.md`
  (memoria persistente del agente raíz).

## Reglas de oro (no negociables)

1. **No introduzcas un color nuevo sin justificación escrita.**
2. **No uses `bg-[#hex]` en templates.** Usa el nombre del token
   (`bg-primary`, `bg-canvas`, `bg-surface`).
3. **No uses gradientes en `src/app/features/alumno/**` ni en
   `src/app/features/cuentos/**`.** Excepción justificada =
   excepción escrita en `01-auditoria-frontend.md`.
4. **No inventes un componente "compartido" si la feature es la única
   que lo usa.** El primitivo va en `shared/componentes/` solo cuando
   una segunda feature lo adopte.
5. **No subas el bundle inicial sin avisar.** El budget vigente es 1 MB
   warning. Cualquier nuevo componente de más de 20 kB va por lazy load.
6. **No cambies IDs del sidebar del alumno.** El tour de onboarding
   los usa. La lista está en `core/layouts/sidebar-portal`.
7. **No uses `!important` salvo en overrides de NG-ZORRO** (selector
   `.ant-*` en `_components.scss`).
8. **No subas la versión de Angular ni de NG-ZORRO como parte del
   rediseño.** El rediseño visual es independiente.

## Antes de tocar UI

```powershell
cd C:\laragon\www\daemon\frontend-angular
npm run check:style-tokens     # linter de tokens
npm run check:architecture     # dependencia entre capas
npm run check:student-visual   # reglas visuales del portal alumno
npm run build                  # tamaño del bundle
```

Si alguno falla, **arregla primero** o documenta por qué no aplica.

## Antes de tocar API o DB

```powershell
cd C:\laragon\www\daemon\backend-laravel
php artisan migrate:status     # ver qué migraciones están pendientes
php artisan test               # suite de tests
```

**El `.env` apunta a Supabase producción.** `php artisan migrate` desde
local = migración en producción. `php artisan tinker` queries = live
data. **No corras migraciones destructivas sin confirmación explícita
de Max.**

Antes de cualquier cambio en la DB, confirma con Max y haz backup:

```powershell
# Backup antes de migración destructiva
pg_dump -h aws-1-sa-east-1.pooler.supabase.com -U postgres -d postgres -n public -Fc -f backup_$(Get-Date -Format yyyyMMdd).dump
```

## Stack y versiones

| Capa | Versión |
|---|---|
| Angular | 21.2.18 (zoneless) |
| NG-ZORRO | 21.3.2 |
| Tailwind | 3.4.19 |
| TypeScript | 5.9.x |
| PHP / Laravel | 8.3 / 12 |
| Node | 22+ |
| PostgreSQL | 15 (Supabase) |

## Arquitectura de capas (frontend)

```text
src/app/
├── core/       ← servicios, guards, interceptors, layouts, dominio. Singleton.
├── features/   ← páginas por caso de uso. Lazy loaded.
└── shared/     ← componentes presentacionales, directivas, pipes. Stateless.
```

Reglas validadas por `check:architecture.mjs`:

- `shared` no importa de `core` ni de `features`.
- `core` no importa de `features`.
- Una `feature` no importa de otra `feature`.

## Arquitectura de capas (backend)

```text
backend-laravel/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/  ← 32 controllers
│   │   ├── Middleware/           ← 6 middlewares
│   │   └── Requests/Api/V1/      ← FormRequest validation
│   ├── Models/                   ← Eloquent
│   └── Services/                 ← lógica de negocio
├── routes/api.php                ← todas las rutas bajo /api/v1
├── config/daemon.php             ← cookies, CORS, Firebase, Supabase
└── database/migrations/          ← 13 batches aplicados a producción
```

## Documentos que debes leer según la tarea

| Si vas a tocar... | Lee primero |
|---|---|
| Cualquier UI | `docs/sistema-diseno/00-resumen-ejecutivo.md` + `docs/frontend-architecture.md` |
| Portal alumno | `docs/sistema-diseno/03-arquetipos.md` + `docs/portal-alumno.md` + `docs/sistema-visual-portal-alumno.md` |
| Gamificación | `docs/gamificacion-xp-daemons.md` |
| Autenticación | `docs/firebase-auth.md` + `docs/privacidad-kids-teens.md` |
| Familias (tutores) | `docs/portal-familias.md` |
| Privacidad / KIDS-TEENS | `docs/privacidad-kids-teens.md` + `docs/auditoria-plataforma-2026-07-20.md` (F-01 a F-25) |
| Base de datos | `docs/supabase-postgres.md` + verificar `php artisan migrate:status` |
| Deploy / CI | `docs/estado-nube-github-produccion.md` + `docs/infraestructura-operativa.md` |
| Tests | `docs/qa-produccion.md` |

## Estado actual del rediseño (a 2026-07-20)

- **Fase 0 (diagnóstico):** cerrada.
- **Fase 1 (cimientos):** pendiente de inicio.
- **Fase 2-5:** pendientes.
- **Decisiones cerradas D-01 a D-10:** ver `00-resumen-ejecutivo.md` §2.

## Tareas comunes (recetas)

### Crear una feature nueva

1. Crear carpeta en `src/app/features/<nombre>/{pages,components,services,models}/`.
2. Registrar rutas en `app.routes.ts` con `loadComponent` (lazy).
3. Si la feature es muy visitada, agregar `data: { preload: true }`.
4. Usar primitivos de `shared/componentes/` (cuando existan en Fase 2+).
5. Si la feature tiene navegación, agregarla a
   `core/layouts/portal-sidebar.config.ts`.
6. Crear spec con al menos 3 casos: render básico, estado de carga,
   estado de error.
7. Verificar `npm run check:style-tokens` antes del PR.

### Crear un componente compartido nuevo

1. **Antes:** confirmar que una segunda feature lo va a usar. Si no,
   va en `features/<nombre>/componentes/`, no en `shared/`.
2. Crear carpeta en `src/app/shared/componentes/<nombre>/` con `.ts`,
   `.html`, `.scss`, `.spec.ts`.
3. Usar CVA para variantes.
4. Usar `tailwind-merge` con `cn()` para combinar clases.
5. OnPush.
6. Standalone (Angular 21).
7. No importar de `core/` ni de `features/`.
8. Spec con render básico + cada variante + un caso con slot.

### Migrar una feature existente a primitivos

1. Identificar el arquetipo (`docs/sistema-diseno/03-arquetipos.md`).
2. Identificar qué primitivos aplica.
3. Reemplazar SCSS local por primitivo.
4. Reemplazar hex arbitrarios por tokens (`bg-primary`, `text-ink`,
   etc.).
5. Si había un header local (`<header class="...hero...">`),
   reemplazarlo por `app-page-header` o `app-hero-band`.
6. Correr `npm run check:style-tokens`.
7. Correr `npm run check:student-visual` (si es del alumno).
8. Spec actualizado.
9. PR con: lista de archivos tocados, líneas agregadas/eliminadas,
   screenshot antes/después.

## Cuando algo no está claro

- **Pregúntale a Max** con una recomendación explícita, no con un menú
  de opciones. La respuesta esperada es sí/no + corrección.
- Si el tema toca decisiones cerradas (D-01 a D-10), explícale por
  qué la nueva situación podría ameritar revisarla. No asumas que se
  reabre.
- Si el tema toca seguridad de menores (KIDS, TEENS, datos
  personales, chatbot, cuentos públicos), consulta
  `docs/auditoria-plataforma-2026-07-20.md` antes de proponer.

## Salidas de emergencia

| Síntoma | Acción |
|---|---|
| `npm run build` falla con error de tokens | restaurar `tailwind.config.js` desde main |
| `npm run check:style-tokens` tiene falsos positivos | agregar el archivo al allowlist con comentario + actualizar `01-auditoria-frontend.md` |
| Bundle > 1 MB | buscar el nuevo chunk en el output de `ng build --stats-json` y mover a lazy load |
| NG-ZORRO se comporta raro en Angular 21 | revisar `node_modules/ng-zorro-antd/` y el changelog. No downgradear. |
| Producción caída | `docs/infraestructura-operativa.md` §"Runbooks" tiene los pasos. No improvisar. |
| Duda sobre COPPA / FERPA / menores | `docs/auditoria-plataforma-2026-07-20.md` + preguntar a Max. **No es un tema de UI.** |

## Memoria del proyecto

La memoria persistente del agente raíz está en
`C:\Users\MEDINA\.mavis\agents\mavis\memory\MEMORY.md`. Si descubres algo
reutilizable (no específico de este proyecto), agrégalo ahí. Si es
específico de DAEMON, ponlo en este directorio o en `AGENTS.md`.

## Glosario DAEMON

- **DAEMONS** = tokens gastables (no son XP).
- **XP / experiencia** = permanente, sube nivel, alimenta el ranking.
- **KIDS** = nivel para menores de ~13 años. Tutor obligatorio.
- **TEENS** = nivel para 13-17 años. Tutor opcional pero recomendado.
- **Misión** = reto con evidencia y recompensa.
- **Canje** = transacción de DAEMONS por premio.
- **Núcleo DAEMON** = mascota virtual (vestidor + colección).
- **Super Lab** = herramientas IA (chatbot, lab, neuro-maze).
- **Galería de historias** = `/alumno/proyectos/cuentos` — el C de
  referencia.
- **"Premium"** = término histórico que significa "sólido, blanco,
  bordes suaves". No implica gradientes.
- **"Bento"** = término histórico que significa "tarjetas grandes con
  sombra corta". Hoy se prefiere "card" simple.
- **"Glass" / "Glassmorphism"** = `backdrop-filter: blur` + fondo
  semitransparente. **Prohibido** en el portal alumno.
- **"Hero-band"** = la franja superior con identidad (título + arte +
  acciones). Es el primitivo `hero-band` (Fase 2).
- **"Stat-card"** = tarjeta de KPI (label + valor + icono). Es el
  primitivo `stat-card` (Fase 2).
- **"Tag"** = chip de estado. Usa `nz-tag` con override de
  `_components.scss`.
- **"Banner"** = `app-header-banner`, primitivo reusable del C
  arquetipo.

## Contacto y entornos

- **Producción frontend:** https://daemonestudiante.web.app
- **Producción backend:** https://daemon-5vo1.onrender.com/api/v1
- **Health:** https://daemon-5vo1.onrender.com/api/v1/salud
- **GitHub:** https://github.com/WILLIAMMDN/daemon
- **Supabase project:** lbxdcvsrmkkynttgwblc
- **Firebase project:** daemon-a41f8
- **Hosting site:** daemonestudiante
- **Bucket Supabase:** daemon-assets

## Última línea

Si después de leer todo esto tienes dudas sobre el alcance del rediseño,
**arranca por la Fase 1** (crear `src/styles/_tokens.scss` + el linter).
Es trabajo de 5-7 días, revertible, y deja al sistema listo para los
primitivos.
