# Piloto visual y funcional: Cursos del estudiante

Fecha: 2026-07-19

Ruta: `/alumno/recursos`

Arquetipo: A — catálogo, exploración y continuidad

Estado: implementado y validado en la rama de integración; pendiente de revisión y merge del PR.

## 1. Objetivo

Actualizar el módulo **Mis cursos** con la estructura visual aprobada para el
portal del estudiante, sin copiar el dashboard ni convertir cada pantalla en
la misma plantilla. El módulo debe:

- mostrar únicamente cursos, unidades, lecciones y progreso reales;
- conservar las reglas de negocio y el endpoint existente;
- ser usable en escritorio y en un teléfono de 390 x 844 px;
- diferenciar carga, actualización, error, sin asignaciones y sin resultados;
- reservar espacios semánticos para ilustraciones futuras sin romper la
  interfaz cuando el archivo todavía no existe;
- mantener intactos el dashboard aprobado, el sidebar morado y los IDs del tour.

## 2. Auditoría previa

### Datos y comportamiento existentes

- Endpoint de lectura: `GET /api/v1/alumno/aprendizaje`.
- Endpoint de avance: `PUT /api/v1/alumno/aprendizaje/lecciones/{id}/progreso`.
- Telemetría permitida al completar: `lesson_completed`, con `lesson_id` y
  `module: cursos`.
- La API entrega cursos, unidades, lecciones, nivel y progreso. No entrega
  favoritos, períodos seleccionables, catálogo público ni XP obtenido por
  curso.
- La capa `Api` ya implementa caché de GET, deduplicación de solicitudes y
  stale-while-revalidate. El módulo no crea otra caché paralela.

### Stack y límites

- Angular 21 con componentes standalone y signals.
- NG-ZORRO se conserva para acciones fiables mediante `NzButtonModule`.
- Font Awesome ya es la iconografía registrada en el portal; no se incorporó
  otra dependencia de iconos.
- El nuevo slot de ilustración vive en `shared` y no importa `core` ni
  `features`.
- Se usan los tokens globales de DAEMON: canvas claro, superficies blancas,
  bordes suaves, azul para acción/progreso y ámbar sólo para DAEMONS.

### Decisiones para evitar funciones ficticias

- Filtros implementados: Todos, Por iniciar, En progreso y Completados.
- Búsqueda implementada sobre títulos y descripciones de curso, unidad y
  lección; ignora mayúsculas y tildes.
- No se agregaron filtros de favoritos o período porque el contrato real no los
  soporta.
- No se muestra XP por curso porque el endpoint no lo devuelve.
- Los enlaces complementarios llevan a rutas existentes: Misiones y
  Herramientas IA.

## 3. Referencias de producto y sistemas de diseño

La implementación toma principios, no copias literales:

| Fuente oficial | Principio aplicado |
| --- | --- |
| Moodle Course overview y Courses block | progreso, búsqueda y acceso rápido a cursos inscritos |
| Canvas LMS guides | jerarquía clara entre curso, contenido y estado |
| Khan Academy mastery | progreso comprensible por unidad/curso |
| Duolingo course path | continuidad visible y siguiente acción clara |
| Atlassian Empty State | explicar qué ocurre y ofrecer una acción útil |
| Carbon Empty States | distinguir sin datos, sin resultados y error |
| Fluent 2 Layout | una sola interfaz que redistribuye contenido al reducirse |
| NG-ZORRO Empty/Input/Button | controles accesibles y personalizables bajo identidad DAEMON |

Referencias:

- https://docs.moodle.org/501/en/Courses_block
- https://docs.moodle.org/39/en/Course_overview_block
- https://community.canvaslms.com/t5/Canvas-Basics-Guide/tkb-p/basics
- https://support.khanacademy.org/hc/en-us/articles/360035457352
- https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/
- https://atlassian.design/components/empty-state
- https://carbondesignsystem.com/patterns/empty-states-pattern/
- https://fluent2.microsoft.design/layout
- https://ng.ant.design/components/empty/en
- https://ng.ant.design/components/input/en

## 4. Arquitectura de la pantalla

```text
Mis cursos
├── Encabezado ilustrado
│   ├── contexto, título y descripción
│   ├── cantidad real de cursos asignados
│   └── slot de ilustración de guía
├── Alerta no bloqueante cuando falla una actualización
├── Barra de herramientas
│   ├── filtros reales con conteos
│   ├── búsqueda local normalizada
│   └── estado de actualización
├── Contenido principal
│   ├── tarjetas de curso
│   │   ├── slot de portada
│   │   ├── nivel, estado, descripción y metadatos
│   │   ├── progreso accesible
│   │   └── unidades, lecciones y acciones existentes
│   ├── estado sin resultados
│   ├── estado sin asignaciones ilustrado
│   └── acceso a herramientas disponibles
└── Resumen complementario
    ├── progreso global real
    ├── explicación del flujo
    └── recomendación de Misiones
```

No existe un `<main>` interno: el layout del portal ya aporta el landmark
principal. Esto evita landmarks anidados y conserva una estructura accesible.

## 5. Componente compartido de ilustración

Componente: `daemon-illustration-slot`

Ubicación: `frontend-angular/src/app/shared/componentes/illustration-slot/`

Entradas:

| Entrada | Uso |
| --- | --- |
| `src` | URL opcional del asset actual |
| `alt` | texto alternativo; vacío cuando la imagen es decorativa |
| `kind` | `decorative`, `contextual`, `instructional`, `reward`, `empty-state` o `hero` |
| `aspectRatio` | reserva proporción y evita saltos de layout |
| `assetName` | contrato de nombre para reemplazo futuro |
| `eager` | prioriza sólo ilustraciones por encima del pliegue |

Comportamiento:

- si el asset existe, se renderiza dentro de la proporción declarada;
- si falta o falla, aparece un fallback neutro y deliberado;
- el fallback informativo hereda nombre accesible desde `alt`;
- el fallback decorativo no añade ruido al lector de pantalla;
- el hero usa `loading=eager` y `fetchpriority=high`;
- tarjetas y estados secundarios usan carga diferida;
- el espacio no colapsa, por lo que un ilustrador puede sustituir el asset sin
  rediseñar la página.

## 6. Contrato de assets pendientes

Los assets actuales son provisionales y ya están en Firebase Hosting. Los
nombres de destino quedan registrados en el DOM mediante `data-asset-name`.

### Guía del catálogo

- Nombre objetivo: `course-catalog-guide.webp`.
- Uso: hero contextual/decorativo.
- Asset provisional: `/img/hero-monster.png`.
- Formato recomendado: WebP con transparencia.
- Lienzo recomendado: 840 x 470 px; zona segura de 10–12%.
- Composición: personaje concentrado a la derecha, sin texto incrustado.
- Alt: vacío porque el encabezado ya comunica el contenido.
- Mobile: debe seguir siendo legible al mostrarse cerca de 220 x 124 px.

### Estado sin cursos

- Nombre objetivo: `course-empty-learning.webp`.
- Uso: estado vacío decorativo.
- Asset provisional: `/img/robot-mision.png`.
- Formato recomendado: WebP con transparencia.
- Lienzo recomendado: 720 x 540 px; zona segura de 12%.
- Composición: personaje centrado, sin texto ni botones incrustados.
- Alt: vacío; título y explicación viven en HTML.
- Mobile: legible cerca de 240 x 180 px.

### Portada por curso

- Nombre objetivo: `course-{id}-cover.webp`.
- Campo futuro ya admitido por la vista: `ilustracion_url`.
- Proporción: 16:7.
- Tamaño recomendado: 960 x 420 px.
- Zona segura: 10%; foco visual centrado o ligeramente a la derecha.
- No incluir título, nivel, porcentaje ni botones dentro de la imagen.
- Si el backend todavía no entrega una URL, se mantiene el fallback y el
  espacio reservado.

## 7. Estados completos

### Carga inicial

- Skeleton con barra de herramientas, tarjetas y resumen lateral.
- Replica la geometría final para reducir cambios de layout.
- Respeta `prefers-reduced-motion`.

### Contenido disponible

- Muestra tarjetas derivadas del contrato real.
- Calcula estado y porcentaje fuera del template mediante signals computadas.
- Cada progreso incluye `role=progressbar`, valor y nombre accesible.

### Actualización

- Conserva los últimos datos mientras solicita una versión fresca.
- Muestra “Actualizando” sin reemplazar todo el módulo por un spinner.
- Si falla, el contenido permanece visible y aparece una alerta con Reintentar.

### Sin asignaciones

- Ilustración, explicación y dos acciones reales: actualizar y abrir Misiones.
- No confunde “todavía no hay cursos” con un fallo de red.

### Sin resultados por filtros

- Mensaje independiente: “No encontramos coincidencias”.
- Acción para limpiar filtro y búsqueda.
- El resumen general permanece visible porque la matrícula real no desapareció.

### Error de carga inicial

- Mensaje bloqueante claro y botón para intentar nuevamente.
- No se muestra simultáneamente como si fuera un estado vacío académico.

## 8. Responsividad

### Escritorio

- Encabezado en dos regiones con ilustración a la derecha.
- Contenido principal en tarjetas y resumen complementario sticky.
- Funciona con sidebar expandido y colapsado.
- El contenido no produce scroll horizontal global.

### Tableta

- El resumen deja de ser sticky y se convierte en una grilla de apoyo.
- Buscador y filtros se redistribuyen sin reducir sus áreas táctiles.

### Móvil 390 x 844

- Hero en una sola columna; la ilustración se conserva debajo del texto.
- Buscador ocupa todo el ancho.
- Filtros mantienen un carrusel táctil horizontal sin barra visual nativa.
- Tarjetas, unidades, lecciones y acciones se apilan.
- Controles de acción mantienen 40–44 px como mínimo.
- Tipografía de inputs permanece en 16 px para evitar zoom automático en iOS.
- El ancho real de la página permanece dentro del viewport; sólo la lista de
  filtros tiene desplazamiento horizontal intencional.
- La navegación inferior del portal sigue siendo dueña de la zona fija.

## 9. Accesibilidad

- Un único `h1` y jerarquía `h2` para cursos y paneles.
- Landmarks con nombres: catálogo, filtros, resultados y resumen.
- Filtros exponen `aria-pressed` y conteos visibles.
- Búsqueda tiene etiqueta accesible aunque visualmente use placeholder.
- Estados de error usan `role=alert`; actualizaciones usan `role=status`.
- Iconos decorativos se ocultan a tecnologías asistivas.
- Botones de lección describen la acción y el nombre de la lección.
- Focus visible de alto contraste.
- Movimiento reducido soportado.

## 10. Rendimiento y datos

- `ChangeDetectionStrategy.OnPush`.
- Signals y `computed` para filtros, estados y porcentajes.
- No se ejecutan getters de progreso repetitivos desde el template.
- La caché, deduplicación y SWR permanecen centralizados en `Api`.
- Al cambiar de módulo y volver, la primera representación puede usar la
  respuesta cacheada mientras se revalida según la política existente.
- Hero prioritario; resto de imágenes diferidas.
- No se incorporaron nuevas dependencias ni bundles globales.

## 11. Pruebas automatizadas

Archivos:

- `recursos.spec.ts`: catálogo, filtros, búsqueda, estado sin asignaciones,
  progreso local y telemetría.
- `illustration-slot.spec.ts`: fallback, contrato de asset y prioridad del hero.

Validaciones requeridas:

```powershell
cd frontend-angular
npm test -- --runInBand
npm run check:architecture
npm run build
```

Resultado del piloto antes de publicar:

- pruebas específicas: 2 suites y 6 casos aprobados;
- suite frontend completa: 13 suites y 45 casos aprobados;
- suite backend completa: 134 casos y 475 aserciones aprobados;
- arquitectura `shared/core/features`: aprobada;
- build de producción: aprobado;
- bundle inicial: 908.25 kB, bajo el presupuesto de advertencia de 1 MB;
- chunk lazy de Cursos: 45.81 kB sin comprimir, 9.82 kB estimado transferido;
- no se agregaron advertencias nuevas; permanecen cuatro advertencias Sass
  preexistentes por `@import` en `src/styles.scss`.
- Jest conserva una advertencia preexistente de `ts-jest` sobre
  `esModuleInterop`; no produjo fallos ni fue causada por este módulo.

La suite completa debe volver a ejecutarse después de cualquier ajuste final y
antes del push.

## 12. QA visual ejecutado

Se levantó una API efímera y aislada únicamente para representar cursos con
estados Por iniciar, En progreso y Completado. El fixture y su configuración se
eliminaron al terminar; no se escribió en Supabase ni se incorporó al commit.

Comprobaciones:

- 1440 x 900 con sidebar colapsado: aprobado;
- 1440 x 900 con sidebar expandido: aprobado;
- 390 x 844 con header y bottom navigation reales: aprobado;
- sin overflow horizontal global: aprobado;
- carrusel táctil de filtros: aprobado y sin scrollbar visible;
- estado sin resultados: aprobado;
- DOM semántico y nombres accesibles: aprobado;
- consola de Cursos después de cargar el fixture: sin errores del módulo.

El fixture incompleto produjo errores del dashboard antes de navegar a Cursos;
no corresponden al módulo ni al código publicado. Se documenta para no
confundirlos con la validación de Cursos.

## 13. Hallazgo del entorno local

La cuenta documentada `jose123` no autenticó con la contraseña de prueba durante
este QA y el backend respondió “Credenciales incorrectas”. No se modificó la
cuenta ni la base de datos. Este hallazgo es independiente del rediseño y debe
diagnosticarse verificando la fila canónica en `usuarios`, el `password_hash` y
qué base PostgreSQL está usando el proceso local, sin sobrescribir producción.

## 14. Archivos de implementación

```text
frontend-angular/src/app/features/alumno/pages/recursos/recursos.ts
frontend-angular/src/app/features/alumno/pages/recursos/recursos.html
frontend-angular/src/app/features/alumno/pages/recursos/recursos.scss
frontend-angular/src/app/features/alumno/pages/recursos/recursos.spec.ts
frontend-angular/src/app/shared/componentes/illustration-slot/illustration-slot.ts
frontend-angular/src/app/shared/componentes/illustration-slot/illustration-slot.html
frontend-angular/src/app/shared/componentes/illustration-slot/illustration-slot.scss
frontend-angular/src/app/shared/componentes/illustration-slot/illustration-slot.spec.ts
```

## 15. Fuera de alcance deliberado

- No se modificó el dashboard del estudiante.
- No se modificó el sidebar ni sus IDs del tour.
- No se crearon ilustraciones definitivas.
- No se alteró el contrato de la API ni la base de datos.
- No se inventaron favoritos, períodos, XP por curso ni rutas externas.
- No se desplegó ni se mezcló la rama automáticamente.

## 16. Rollback

El cambio se revierte eliminando el componente compartido de ilustración y
restaurando los cuatro archivos del módulo Cursos. No requiere migraciones,
cambios de variables de entorno ni reversión de datos.
