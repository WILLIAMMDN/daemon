# Inventario de páginas DAEMON

> 58 rutas inferidas desde `app.routes.ts`. Las marcadas con 📖 fueron
> leídas a fondo el 2026-07-20. Las demás se infieren por su ruta, guard y
> nombre. Un agente nuevo debe validar las no-leídas antes de tocarlas.

## Conteo rápido

| Portal | Rutas | Arquetipo dominante |
|---|---|---|
| Público | 1 | (landing propia) |
| Autenticación | 7 | A — Auth & Onboarding |
| Alumno | 31 | B (1) + C (8) + D (5) + B/E (varios) |
| Docente | 16 | E — Tabla administrativa (10) + B (1) + D (3) |
| Familias (tutor) | 2 | variante de B con tono violeta |
| Wildcard | 1 | redirect a `/` |

## Mapeo completo

### Público (1)

| # | Ruta | Feature | Arquetipo | Notas |
|---|---|---|---|---|
| 1 | `/` | publico | (landing propia) | No inspeccionado en esta auditoría |

### Autenticación (7) → Arquetipo **A**

| # | Ruta | Feature | Notas |
|---|---|---|---|
| 2 | `/login` | autenticacion | 📖 SCSS propio `#15326b`, Rive teddy, switch portal alumno/docente |
| 3 | `/login-docente` | autenticacion | Espejo del login alumno, debería compartir patrón |
| 4 | `/registro` | autenticacion | Onboarding con Firebase + Laravel |
| 5 | `/recuperar-clave` | autenticacion | Usa Firebase `sendPasswordResetEmail` |
| 6 | `/restablecer-clave` | autenticacion | Reset con código de Firebase |
| 7 | `/verificar-correo` | autenticacion | Estado de verificación de correo |
| 8 | `/bienvenida` | autenticacion | Onboarding post-registro (requiere `authGuard`) |

### Alumno (31) → Arquetipos **B**, **C**, **D**

| # | Ruta | Feature | Arquetipo | Notas |
|---|---|---|---|---|
| 9 | `/alumno` | alumno | B (Dashboard) | 📖 Hero-band con monstruo + stats grid + rutas prioritarias |
| 10 | `/alumno/perfil` | alumno | D (Detalle) | Insignias + mochila digital. Preload. |
| 11 | `/alumno/perfil/editar` | alumno | D (Formulario) | Edición de nombre, bio, avatar |
| 12 | `/alumno/notificaciones` | compartido | D | Lista cronológica de notificaciones |
| 13 | `/alumno/misiones` | misiones | C (Catálogo) | Grid de misiones filtrable. Preload. |
| 14 | `/alumno/misiones/:id` | misiones | D (Detalle) | Detalle de una misión específica |
| 15 | `/alumno/misiones/:id/entregar` | misiones | D (Formulario) | Entrega de evidencia |
| 16 | `/alumno/herramientas` | herramientas | C (Hub) | Hub de IA, lab, etc. Preload. |
| 17 | `/alumno/herramientas/chatbot` | chatbot | D (Especial) | Chat conversacional con Rive opcional |
| 18 | `/alumno/herramientas/bot` | chatbot | D (Especial) | Crear/bot (ngx-quill + form) |
| 19 | `/alumno/herramientas/laboratorio` | laboratorio | D (Especial) | Editor matriz Q del cerebro del bot |
| 20 | `/alumno/herramientas/neuro-maze` | laboratorio | (inmersivo) | Juego de laberinto |
| 21 | `/alumno/herramientas/defensa-ia` | laboratorio | (inmersivo) | Juego de defensa |
| 22 | `/alumno/herramientas/entrenamiento` | laboratorio | (inmersivo) | Entrenamiento de mascota |
| 23 | `/alumno/recursos` | alumno | C (Catálogo) | Cursos / lecciones. Preload. |
| 24 | `/alumno/tienda` | tienda | C (Catálogo) | 📖 Catálogo canjeable con balance-vault |
| 25 | `/alumno/canjes` | tienda | D (Historial) | Canjes del alumno con códigos |
| 26 | `/alumno/mascota` | mascota | C (Especial) | Vestidor + colección. Preload. |
| 27 | `/alumno/evaluaciones` | evaluaciones | D (Especial) | Examen live. Preload. |
| 28 | `/alumno/resultados` | evaluaciones | D (Detalle) | Puntajes del alumno |
| 29 | `/alumno/competencia` | competencia | D (Especial) | Voto en vivo |
| 30 | `/alumno/competencia/tv` | competencia | (público en sala) | Vista TV de competencia |
| 31 | `/alumno/proyectos` | proyectos | C (Hub) | Hub de proyectos. Preload. |
| 32 | `/alumno/proyectos/cuentos` | cuentos | **C (Galería — referencia)** | 📖 1100+ líneas SCSS, header-banner + grid + aside |
| 33 | `/alumno/proyectos/cuentos/crear` | cuentos | D (Editor) | Editor con ngx-quill |
| 34 | `/alumno/proyectos/cuentos/:id` | cuentos | D (Inmersivo) | Lectura individual |
| 35 | `/alumno/ranking` | ranking | C+D (Ranking) | 📖 Podio + leaderboard. Preload. |
| 36 | `/alumno/comunidad` | comunidad | C (Directorio) | Lista de personas. Preload. |
| 37 | `/alumno/comunidad/perfil/:id` | alumno | D (Detalle) | Perfil público de compañero |
| 38 | `/alumno/certificado` | certificados | D (Detalle) | Datos de certificado. Preload. |
| 39 | `/alumno/certificado/imprimir` | certificados | (imprimible) | Vista de impresión |

### Docente (16) → Arquetipo **E** dominante

| # | Ruta | Feature | Arquetipo | Notas |
|---|---|---|---|---|
| 40 | `/docente` | docente | B' (Dashboard) | Panel con KPIs del aula |
| 41 | `/docente/perfil` | docente | D (Detalle) | Perfil docente |
| 42 | `/docente/alumnos` | docente | E (Tabla) | Tabla densa de alumnos con acciones de tokens |
| 43 | `/docente/aulas` | docente | E (Tabla) | Gestión de grupos y niveles |
| 44 | `/docente/curriculo` | docente | E (CMS) | Cursos, períodos, unidades, lecciones |
| 45 | `/docente/misiones` | docente | E (Tabla) | 📖 Tabla NG-ZORRO + modales de crear/editar |
| 46 | `/docente/entregas` | docente | E (Cola) | Cola de revisión de entregas |
| 47 | `/docente/insignias` | docente | E (Catálogo) | Catálogo de insignias |
| 48 | `/docente/tienda` | docente | E (Tabla) | Administración de premios y stock |
| 49 | `/docente/evaluaciones` | docente | E (Tabla) | Banco de preguntas y estados |
| 50 | `/docente/evaluaciones/resultados` | docente | E (Tabla) | Resultados agregados |
| 51 | `/docente/competencia` | docente | E (Control) | Control de ronda (iniciar, cerrar, premiar) |
| 52 | `/docente/competencia/tv` | docente | (público) | Vista TV |
| 53 | `/docente/rondas` | docente | E (Tabla) | Historial de rondas |
| 54 | `/docente/tokens` | docente | E (Auditoría) | Historial de movimientos de tokens |
| 55 | `/docente/notificaciones` | compartido | D | Notificaciones del docente |
| 56 | `/docente/carnets/:id` | certificados | (imprimible) | Imprimir carnet de un alumno |

### Familias / Tutor (2) → Variante de **B** con tono violeta

| # | Ruta | Feature | Arquetipo | Notas |
|---|---|---|---|---|
| 57 | `/familias/acceso` | familias | A (Auth) | Landing del tutor con verificación de email + invitación |
| 58 | `/familias` | familias | B' (Dashboard tutor) | Panel con reporte del menor |

### Wildcard (1)

| # | Ruta | Acción |
|---|---|---|
| 59 | `**` | redirect a `/` |

## Preload y permisos

Datos del `app.routes.ts`:

- **Preload** (selective strategy): `/alumno/perfil`, `/alumno/misiones`,
  `/alumno/herramientas`, `/alumno/recursos`, `/alumno/tienda`,
  `/alumno/mascota`, `/alumno/evaluaciones`, `/alumno/proyectos`,
  `/alumno/proyectos/cuentos`, `/alumno/ranking`, `/alumno/comunidad`,
  `/alumno/certificado`. En docente: ninguno explícito (los críticos del
  docente van con lazy load por defecto).
- **Guards**: `authGuard` (global), `alumnoGuard` (rutas `/alumno/**`),
  `docenteGuard` (rutas `/docente/**`), `tutorGuard` (rutas `/familias`).

## Endpoints consumidos (referencia)

Cada ruta declara en `data` su endpoint canónico. Por ejemplo:

- `/alumno` → `/alumno/panel`
- `/alumno/misiones` → `/misiones`
- `/docente/tokens` → `/docente/historial-tokens`
- `/alumno/proyectos/cuentos` → `/cuentos`

Estos `data.endpoint` son consumidos por `app.config.ts` y por
`portal-sidebar.config.ts` para los tooltips de navegación. **No romperlos.**

## Acción para la Fase 1

No tocar este inventario. La Fase 1 solo consolida tokens. La Fase 2
introduce primitivos. La Fase 3 migra las 3 páginas piloto (galería,
gestionar-misiones, detalle-misión). Las demás se migran en Fases 4-5
siguiendo el orden de menor a mayor riesgo definido en `06-plan-fases.md`.
