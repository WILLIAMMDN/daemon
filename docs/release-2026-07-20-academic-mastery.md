# Base de dominio académico y libro de calificaciones — 20 de julio de 2026

## Estado

Implementado en la rama `codex/academic-mastery-foundation`. Este cambio no se
considera desplegado hasta que el pull request sea revisado, fusionado, migrado
en staging y validado con el smoke definido en este documento.

La entrega convierte misiones y evaluaciones en evidencias académicas sin
mezclar XP con calificaciones. XP y DAEMONS conservan su comportamiento; el
nuevo resultado académico se guarda en un libro separado.

## Invariantes protegidas

- Una lección solo puede usar objetivos de la institución de su curso.
- Un curso publicado no puede trasladarse cambiando `id_institucion`.
- Lección, aula, objetivos, misión/evaluación y estudiante deben compartir
  institución; si hay aula explícita, el estudiante también debe pertenecer a
  esa aula.
- Publicar una evaluación solo finaliza otra evaluación activa del mismo nivel,
  institución y aula. Nunca afecta a otro colegio.
- El profesor puede operar su aula principal y las matrículas activas con rol
  `teacher`; no obtiene acceso institucional completo.
- Una matrícula compartida no convierte al alumno en puente entre aulas: el
  listado, la revisión de entregas y los resultados se filtran también por el
  alcance de la actividad, incluso si el docente puede ver al mismo estudiante
  en otra clase.
- El resumen docente reconoce tanto el aula principal como una matrícula
  secundaria activa con rol `teacher`.
- Si la instalación tiene una sola institución, la migración asigna a ella los
  registros legacy. Si hay varias y el origen es ambiguo, el registro continúa
  global y únicamente un administrador puede modificarlo.

## Modelo de datos

La migración `2026_07_20_000000_create_academic_mastery_gradebook.php` añade:

- alcance opcional `id_institucion`, `id_aula`, `id_leccion` y
  `puntaje_maximo` a misiones y evaluaciones;
- `mision_objetivo` y `evaluacion_objetivo` para alineación curricular;
- `categorias_calificacion`, `items_calificacion` y
  `resultados_calificacion`, equivalentes internos de Category, LineItem y
  Result de OneRoster;
- `item_calificacion_objetivo` para alinear cada evidencia;
- `dominios_objetivo`, una proyección recalculable por alumno y objetivo;
- `entregas.puntaje_academico`, independiente de la recompensa de
  gamificación.

La migración conserva la respuesta de evaluación más reciente si encuentra
duplicados legacy y crea una unicidad `alumno + evaluación`. Las respuestas se
guardan después mediante upsert atómico para que reintentos o dobles toques no
creen intentos duplicados ni recompensas dobles.

Los resultados usan UUID sin PII (`sourced_id`). Al modificar o eliminar la
alineación de una actividad, la proyección de dominio afectada se recalcula; no
queda una puntuación histórica huérfana.

## Cálculo inicial de dominio

El porcentaje es el promedio ponderado de resultados con estado
`fully graded`. La ponderación inicial de cada ítem es `1.000`.

| Porcentaje | Estado DAEMON |
|---:|---|
| 90–100 | `dominado` |
| 75–89.99 | `competente` |
| 50–74.99 | `en_desarrollo` |
| 0–49.99 | `inicial` |
| sin resultado | no se crea proyección |

Estos umbrales son una política inicial documentada, no una verdad pedagógica
universal. Deben hacerse configurables por institución antes de usarlos para
decisiones formales de promoción.

## Contrato API interno

### Crear o actualizar misión/evaluación

Campos nuevos y compatibles hacia atrás:

```json
{
  "id_institucion": 1,
  "id_aula": 8,
  "id_leccion": 14,
  "puntaje_maximo": 100,
  "objetivos": [3, 4]
}
```

Para un docente, institución y aula se obtienen del servidor aunque el cliente
los omita. Si se informa una lección y se omiten objetivos al crear, se heredan
los objetivos ya vinculados a esa lección.

### Revisar una misión

```text
POST /api/v1/misiones/entregas/{entrega}/revisar
```

```json
{
  "estado": "aprobado",
  "calificacion": 20,
  "puntaje_academico": 86,
  "comentario_docente": "Secuencia clara."
}
```

`calificacion` conserva la recompensa XP/DAEMONS. `puntaje_academico` es un
porcentaje de 0 a 100; si se omite vale 100 al aprobar y 0 al rechazar.

### Consultas de producto

```text
GET /api/v1/academico/libro-calificaciones?id_aula={id}
GET /api/v1/alumno/dominio
```

El libro devuelve ítems con categoría, objetivos, resultados y alumno. El
endpoint del alumno devuelve únicamente su proyección de dominio y resumen.
El portal familiar recibe un resumen agregado y los cinco objetivos recientes;
no recibe respuestas crudas ni información de otros alumnos.

## OneRoster Gradebook 1.2

Proveedor de lectura inicial:

```text
GET /ims/oneroster/gradebook/v1p2/categories
GET /ims/oneroster/gradebook/v1p2/categories/{sourcedId}
GET /ims/oneroster/gradebook/v1p2/lineItems
GET /ims/oneroster/gradebook/v1p2/lineItems/{sourcedId}
GET /ims/oneroster/gradebook/v1p2/results
GET /ims/oneroster/gradebook/v1p2/results/{sourcedId}
```

Requiere el par de scopes oficiales `gradebook.readonly` y
`gradebook-core.readonly`; al seleccionar cualquiera al crear el cliente,
DAEMON guarda ambos para evitar una credencial incompleta. Cada cliente
solo recibe datos de su institución. Solo se exportan line items con clase y
UUID interoperables. Se admiten paginación, orden, filtro seguro y selección de
campos como en el proveedor de rostering.

Esto es una base alineada al contrato, no certificación de conformidad. Faltan
los endpoints por clase, score scales, operaciones de escritura y la suite
oficial de 1EdTech antes de solicitar certificación.

## Privacidad y trazabilidad

- El export de privacidad sube a formato versión 2 e incluye resultados y
  dominio pertenecientes al propio usuario.
- El comentario docente se considera parte del expediente del alumno.
- Cada calificación registra un evento outbox
  `academico.resultado_calificado` sin respuesta cruda ni nombre del menor.
- OneRoster usa UUID técnicos; nunca nombres, correos o usernames como
  `sourcedId`.

## Rollout seguro

1. Crear backup verificable de PostgreSQL y registrar su identificador.
2. Ejecutar la migración primero en staging con una copia anonimizada.
3. Correr toda la suite Laravel y los flujos misión/evaluación de este release.
4. Probar un cliente OAuth con roster-only (debe recibir 403 en Gradebook) y
   otro con ambos scopes Gradebook de lectura (debe quedar aislado por
   institución).
5. Desplegar backend sin activar todavía una UI nueva.
6. Hacer smoke de creación, entrega, revisión, evaluación y export de
   privacidad.
7. Desplegar el frontend de Antigravity solo después de validar el contrato.

Rollback de aplicación: volver al artefacto backend anterior. El rollback de
base no debe ejecutarse automáticamente si ya existen calificaciones: primero
se exportan `resultados_calificacion` y `dominios_objetivo`, luego se decide una
reversión controlada.

## Validación

Pruebas dirigidas añadidas en `AcademicMasteryGradebookTest`:

- rechazo de objetivos y traslado de cursos entre instituciones;
- misión → resultado → dominio → consulta alumno/docente;
- publicación y respuesta de evaluaciones aisladas por aula;
- OAuth scope e aislamiento institucional de OneRoster Gradebook.

Validación local de la rama:

```text
Laravel: 141 pruebas / 551 aserciones, OK
Angular Jest: 11 suites / 39 pruebas, OK
Arquitectura Angular: OK
Build Angular: OK; inicial 919.89 kB, bajo el presupuesto de 1 MB
git diff --check: OK
```

El build mantiene las advertencias Sass `@import` ya presentes en la rama base;
esta entrega no modifica frontend ni añade una advertencia nueva.

## Referencias normativas

- [OneRoster 1.2](https://standards.1edtech.org/oneroster/specifications/standards/v1p2)
- [OneRoster Gradebook Service](https://standards.1edtech.org/oneroster/specifications/standards/v1p2/services/gradebook/im)
- [OpenAPI oficial Gradebook 1.2](https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2gradebookservice_openapi3_v1p0.json)
