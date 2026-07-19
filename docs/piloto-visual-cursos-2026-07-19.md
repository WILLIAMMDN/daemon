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

| Elemento auditado | Estado comprobado | Decisión del piloto |
| --- | --- | --- |
| Angular | `21.2.18`, standalone, signals y lazy routes | conservar `OnPush`, signals y la ruta lazy existente |
| Angular CDK | `21.0.0` | no requerido: no hay overlay, virtualización ni cambio de DOM por breakpoint |
| NG-ZORRO | `21.3.2` | usar `NzButtonModule`; no recrear el comportamiento de botones |
| Iconografía | Font Awesome ya registrado en el portal | reutilizar sólo los iconos usados y no añadir otra familia |
| Tailwind | `3.4.19` disponible | el piloto usa SCSS encapsulado para estados y composición específicos |
| Tokens | variables `--daemon-*` en `styles.scss` | mapear color, superficie, borde y texto; no cambiar estilos globales |
| Caché | `Api` con GET cacheado, deduplicación y SWR | no crear una segunda caché en la feature |
| Empty state compartido | `app-estado-vacio`, útil para mensajes simples | no duplicarlo; `IllustrationSlot` resuelve únicamente el contrato visual opcional |
| Assets | PNG/Rive existentes en `public`; no hay portadas de curso | reutilizar dos PNG aprobados y reservar portadas futuras con fallback |
| Duplicación detectada | varias pantallas poseen vacíos simples, pero ninguna reserva un asset reemplazable | extraer sólo `daemon-illustration-slot`, no un page shell anticipado |

El nuevo slot vive en `shared` y no importa `core` ni `features`. No se añadió
ninguna dependencia. Se usan los tokens globales de DAEMON: canvas claro,
superficies blancas, bordes suaves, azul para acción/progreso y ámbar sólo para
DAEMONS.

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

| Referencia | Patrón estudiado | Problema que resuelve | Adaptación para DAEMON | Riesgo de aplicarlo mal |
| --- | --- | --- | --- | --- |
| Moodle Course overview / Courses block | cursos inscritos, búsqueda y progreso | localizar y retomar aprendizaje | filtros por estado real y avance visible | copiar controles que la API de DAEMON no soporta |
| Canvas LMS guides | jerarquía curso-contenido-estado | navegar estructuras académicas profundas | curso, unidades y lecciones con disclosure progresivo | convertir la pantalla infantil en una administración densa |
| Khan Academy mastery | progreso por unidad/curso | explicar dominio y continuidad | resumen global y porcentaje por curso | presentar el porcentaje como nota académica |
| Duolingo course path | siguiente acción y continuidad | evitar que el estudiante se pierda | CTAs reales hacia lecciones, Misiones y Herramientas | gamificar sin relación con aprendizaje real |
| Atlassian Empty State | explicación y próximo paso | orientar cuando todavía no hay datos | empty de asignación con actualizar y abrir Misiones | usar la misma explicación para error y vacío |
| Carbon Empty States | taxonomía de vacíos y errores | distinguir causa y recuperación | separar sin asignaciones, sin coincidencias, offline y error | convertir cada ausencia en una ilustración innecesaria |
| Fluent 2 Layout | reflow de una sola interfaz | conservar contenido al reducir ancho | aside debajo, filtros táctiles y tarjetas apiladas | duplicar DOM móvil y desktop |
| NG-ZORRO | controles y estados accesibles | consistencia de interacción Angular | botones fiables con identidad visual DAEMON | dejar apariencia administrativa predeterminada |

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
| `kind` | `decorative`, `contextual`, `instructional`, `reward`, `empty-state`, `hero` o `interactive` |
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

El valor semántico `none` se expresa omitiendo el componente; así no se crea un
wrapper vacío cuando una región no necesita ilustración.

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

- Asset canónico: `/img/empty/empty-robot.webp`.
- Uso: estado vacío compartido mediante `app-estado-vacio`.
- No es un contrato pendiente específico de Cursos: se conserva el mismo robot
  lossless estandarizado para vacíos confirmados en toda la plataforma.
- El título, la explicación y las acciones contextuales viven en HTML; la
  ilustración no contiene texto ni botones.
- Mobile: permanece legible cerca de 240 x 180 px.

### Portada por curso

- Nombre objetivo: `course-{id}-cover.webp`.
- Campo futuro ya admitido por la vista: `ilustracion_url`.
- Proporción: 16:7.
- Tamaño recomendado: 960 x 420 px.
- Zona segura: 10%; foco visual centrado o ligeramente a la derecha.
- No incluir título, nivel, porcentaje ni botones dentro de la imagen.
- Si el backend todavía no entrega una URL, se mantiene el fallback y el
  espacio reservado.

### Acompañante del progreso

- Nombre objetivo: `course-progress-companion.webp`.
- Uso: recompensa visual dentro del resumen de progreso general.
- Asset provisional: `/img/robot-mision.png`.
- Proporción reservada: 16:5.
- Formato recomendado: WebP con transparencia, sin texto incrustado.
- Composición: personaje o criatura a la derecha, con la zona izquierda libre
  para que el resumen siga siendo legible.
- Alt: vacío; las métricas y la explicación ya existen como texto HTML.

## 6.1. Auditoría final de iconografía

La revisión pendiente quedó resuelta en el lote del ciclo de aprendizaje:

- Todos: cuadrícula, porque representa el conjunto completo;
- Por iniciar: bandera, porque comunica un punto de partida;
- En progreso: reproducción, porque comunica continuidad;
- Completados: círculo validado, porque comunica cierre confirmado;
- ayuda: información;
- asignación docente: grupo de personas;
- ruta publicada: libro abierto;
- siguiente acción: cohete;
- fallo remoto: triángulo de advertencia.

No se reutiliza el mismo pictograma para estados académicos distintos. Los
iconos siguen acompañados por texto y no son el único portador de significado.

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

### Sin conexión, timeout y acceso denegado

- `ApiError('offline')` presenta “Sin conexión con DAEMON” y una recuperación
  real; nunca se confunde con ausencia de asignaciones.
- `ApiError('timeout')` explica que la conexión está tardando.
- HTTP `401/403` presenta “Acceso no disponible” y una salida segura al inicio,
  en vez de un reintento infinito.

### Datos conservados o parciales

- Si falla una actualización y ya existían cursos, se conservan las tarjetas,
  aparece la explicación correspondiente y se etiqueta “Datos guardados”.
- Un curso sin unidades o una unidad sin lecciones conserva su estructura y
  muestra el mensaje contextual en esa región, sin ocultar el resto del
  catálogo.

### Envío y confirmación

- Mientras se guarda una lección, el control muestra “Guardando…” y bloquea
  envíos duplicados.
- Al completarse, un `role=status` confirma la actualización del progreso.
- Si falla el guardado, se muestra un error de acción independiente; no ofrece
  un botón “Reintentar” que sólo recargaría el catálogo.

## 8. Responsividad

### Escritorio

- Encabezado en dos regiones con ilustración a la derecha.
- Contenido principal en tarjetas y resumen complementario sticky.
- Funciona con sidebar expandido y colapsado.
- El contenido no produce scroll horizontal global.

### Tableta

- El resumen deja de ser sticky y se convierte en una grilla de apoyo.
- Buscador y filtros se redistribuyen sin reducir sus áreas táctiles.

### Móvil 360–390 px

- Hero en una sola columna; la ilustración se conserva debajo del texto.
- Buscador ocupa todo el ancho.
- Filtros mantienen un carrusel táctil horizontal sin barra visual nativa.
- Tarjetas, unidades, lecciones y acciones se apilan.
- Controles de acción mantienen 40–44 px como mínimo.
- Tipografía de inputs permanece en 16 px para evitar zoom automático en iOS.
- El ancho real de la página permanece dentro del viewport; sólo la lista de
  filtros tiene desplazamiento horizontal intencional.
- La navegación inferior del portal sigue siendo dueña de la zona fija.

La adaptación también responde al ancho real del contenedor. Esto evita que
el catálogo se comprima cuando el sidebar permanece expandido en una tableta,
aunque el viewport por sí solo todavía sea ancho.

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
- Al cambiar de módulo y volver, la primera representación usa inmediatamente
  la respuesta cacheada mientras se revalida según la política existente; el
  skeleton queda reservado para una carga inicial sin datos disponibles.
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

- pruebas específicas: 2 suites y 10 casos aprobados;
- suite frontend completa: 13 suites y 49 casos aprobados;
- suite backend completa: 134 casos y 475 aserciones aprobados;
- arquitectura `shared/core/features`: aprobada;
- build de producción: aprobado;
- bundle inicial: 908.07 kB, bajo el presupuesto de advertencia de 1 MB;
- chunk lazy de Cursos: 46.90 kB sin comprimir, 9.95 kB estimado transferido;
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
- 1024 x 768 con sidebar expandido: aprobado; el catálogo responde al ancho
  disponible y el topbar oculta sólo texto secundario dentro de su propio
  componente;
- 390 x 844 con header y bottom navigation reales: aprobado;
- 360 x 800 con header y bottom navigation reales: aprobado;
- sin overflow horizontal global: aprobado;
- carrusel táctil de filtros: aprobado y sin scrollbar visible;
- estado sin resultados: aprobado;
- estado sin asignaciones e ilustración reservada: aprobado;
- error de conexión con datos previos conservados: aprobado;
- acceso denegado con salida segura: aprobado;
- confirmación de lección guardada mediante región live: aprobado;
- DOM semántico y nombres accesibles: aprobado;
- consola de Cursos después de cargar el fixture: sin errores del módulo.

El fixture incompleto produjo errores del dashboard antes de navegar a Cursos;
no corresponden al módulo ni al código publicado. Además, el dashboard
aprobado conserva un overflow horizontal propio a 1024 px provocado por su
hero y sus tarjetas. No se corrigió dentro de este piloto porque el objetivo
protege expresamente esa pantalla; el catálogo de Cursos sí permanece dentro
del viewport en el mismo tamaño.

## 13. Hallazgo del entorno local

El frontend del PR se sirve en `http://localhost:4300`; el puerto `4200`
pertenece al worktree paralelo de Antigravity y no contiene necesariamente este
piloto. El backend local responde en `http://localhost:8000/api/v1`.
Frontend y API deben conservar ese mismo hostname para que la cookie HttpOnly
no se vuelva cross-site.

La cuenta documentada `jose123` fue comprobada de extremo a extremo: login
HTTP 200, cookie aceptada y navegación real a `/alumno`, sin modificar cuenta,
contraseña ni datos de producción. La regresión “Ingresando…” se reprodujo con
la API en `127.0.0.1` y quedó resuelta al restaurar `localhost`, que es el mismo
hostname del frontend de desarrollo.

## 14. Archivos de implementación

```text
frontend-angular/src/app/features/alumno/pages/recursos/recursos.ts
frontend-angular/src/app/features/alumno/pages/recursos/recursos.html
frontend-angular/src/app/features/alumno/pages/recursos/recursos.scss
frontend-angular/src/app/features/alumno/pages/recursos/recursos.spec.ts
frontend-angular/src/app/core/layouts/topbar-alumno/topbar-alumno.scss
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

## 17. Matriz de cierre del objetivo

| Requisito aplicable al piloto Cursos | Evidencia autoritativa | Estado |
| --- | --- | --- |
| Dashboard principal intacto | el commit no contiene archivos de `panel-alumno`, layout, sidebar ni estilos globales | Cumplido |
| Captura usada como referencia, no como plantilla universal | sólo se migró el arquetipo A `/alumno/recursos`; no se alteraron otros módulos | Cumplido |
| Estructura de catálogo con contenido y aside | `recursos.html` separa hero, toolbar, main content, discovery y aside | Cumplido |
| Datos y acciones reales | endpoints `/alumno/aprendizaje` y progreso existentes; sin favoritos, períodos ni XP ficticio | Cumplido |
| Espacios permanentes y sustituibles para ilustraciones | `daemon-illustration-slot`, `aspectRatio`, `assetName`, fallback y carga priorizada/diferida | Cumplido |
| Ausencia de asset sin imagen rota | prueba de error de imagen y fallback SVG | Cumplido |
| Estados remotos completos aplicables | loading, success, empty, filtered-empty, error, offline, permission, refreshing, stale, partial, submitting y success-feedback | Cumplido |
| Mobile-first y sin pérdida funcional | QA 390 x 844; filtros táctiles, aside reubicado, lecciones y acciones disponibles | Cumplido |
| Accesibilidad más allá del color | landmarks, jerarquía, labels, estados live, focus, progressbars y reduced motion | Cumplido |
| Sin dependencias ni reglas de negocio nuevas | `package.json` y backend sin cambios; cálculos limitados a presentación de progreso ya entregado | Cumplido |
| Arquitectura y calidad | check de límites, contrato visual, Jest, build, Laravel y CI del PR | Cumplido tras repetir los gates finales |

## 18. Refinamiento de jerarquía visual

Después de revisar el piloto en contexto real se simplificó la cabecera y la
navegación del catálogo para acercarlas a la composición aprobada:

- el hero dejó de ser una tarjeta independiente con borde y ahora se integra
  directamente en el lienzo del módulo;
- el icono principal y los iconos informativos usan color sólido y contraste
  directo, sin fondos pálidos ni contenedores decorativos;
- los filtros inactivos se presentan como icono y texto abiertos; únicamente el
  filtro activo conserva una cápsula violeta porque representa selección;
- se retiraron los contadores encapsulados de los filtros, ya que el resumen
  lateral mantiene las cantidades reales;
- la barra de búsqueda y filtros ya no se encierra en otra tarjeta y cambia a
  dos filas antes de que una etiqueta pueda recortarse;
- se conservaron tarjetas, bordes y fondos cuando expresan estructura real:
  curso, unidad, resumen, ayuda, estado o acción.

Este refinamiento es exclusivamente visual. No modifica endpoints, filtros,
búsqueda, datos, progreso, caché ni contratos de ilustración.
