# Cierre del ciclo de aprendizaje del portal estudiante

Fecha: 2026-07-19

Estado: implementado y validado localmente en la rama activa del PR. No se
desplegó en producción desde este lote.

## Alcance

Este bloque completa la reestructuración de:

- Cursos: `/alumno/recursos`;
- Misiones: listado, detalle y entrega;
- Evaluaciones activas: `/alumno/evaluaciones`;
- Historial de resultados: `/alumno/resultados`.

Se conservaron el login, el dashboard aprobado, el sidebar morado, las rutas,
los endpoints y las reglas XP/DAEMONS. No se incorporó código de la rama
descartada de Antigravity.

## Cursos

- Los filtros Todos, Por iniciar, En progreso y Completados usan pictogramas
  diferentes y texto visible.
- La ayuda usa iconos propios para asignación docente, ruta publicada y
  siguiente acción.
- Se registraron tres contratos de imagen reemplazables:
  `course-catalog-guide.webp`, `course-{id}-cover.webp` y
  `course-progress-companion.webp`. El vacío conserva el robot canónico
  `/img/empty/empty-robot.webp` mediante `app-estado-vacio`.
- Los assets actuales son provisionales; el componente compartido mantiene la
  proporción y evita imágenes rotas cuando llegue el arte definitivo.
- No se añadieron favoritos, periodos, XP por curso ni catálogos ficticios.

## Misiones

### Listado

- Hero propio con el slot `missions-route-guide.webp`.
- Filtros: Todas, Disponibles, En revisión, Completadas y Por corregir.
- Cada tarjeta conserva recompensa, nivel, evidencia y acción real.
- Carga inicial, vacío, fallo remoto y reintento son estados independientes.

### Detalle y entrega

- Contratos TypeScript para misión, entrega y estado de entrega.
- La línea de estado distingue disponible, pendiente, aprobado y rechazado.
- Una entrega pendiente o aprobada no puede reenviarse desde la interfaz; esta
  protección coincide con la validación 422 existente en Laravel.
- Una entrega rechazada conserva la corrección como acción válida.
- Un fallo al enviar no borra la evidencia escrita por el estudiante.

## Evaluaciones y resultados

### Evaluación activa

- Preguntas agrupadas en `fieldset` con opciones de radio accesibles.
- Progreso visible y accesible de respuestas completadas.
- El envío se habilita únicamente cuando todas las preguntas tienen respuesta.
- Error de carga y error de envío se muestran por separado.
- No se anida un segundo landmark `main` dentro del layout del portal.

### Historial

- Promedio, mejor puntaje y cantidad aprobada se calculan desde los resultados
  reales del endpoint.
- El umbral de aprobación visual es 70, alineado con la regla vigente.
- Tabla responsive con fecha, nivel, puntaje y estado.
- Carga, historial vacío y error remoto nunca se presentan simultáneamente.

## Contratos de datos

No hubo cambios de API ni migraciones. Se tiparon los contratos frontend:

- `MisionAlumno`, `EntregaMision`, `DetalleMisionRespuesta`;
- `EvaluacionActiva`, `PreguntaEvaluacion`;
- `ResultadoEvaluacion`, `ResultadoRespuestaEvaluacion`.

## QA ejecutado

- pruebas focalizadas: 5 suites y 19 casos aprobados;
- arquitectura `shared/core/features`: aprobada;
- build Angular de producción: aprobado;
- bundle inicial: aproximadamente 908.1 kB, bajo el presupuesto de 1 MB;
- QA local autenticado con la cuenta de prueba documentada;
- Cursos validado con sus iconos, slots y assets sin roturas;
- Cursos, Misiones, Evaluaciones y Resultados sin overflow horizontal global a
  390 x 844 px;
- estados vacíos reales confirmados en Misiones, Evaluaciones y Resultados;
- permanecen sólo las advertencias Sass y `ts-jest` preexistentes.

Comandos focalizados:

```powershell
cd frontend-angular
npm test -- --runInBand src/app/features/alumno/pages/recursos/recursos.spec.ts src/app/features/misiones/pages/lista-misiones/lista-misiones.spec.ts src/app/features/misiones/pages/entregar-mision/entregar-mision.spec.ts src/app/features/evaluaciones/pages/examen-live/examen-live.spec.ts src/app/features/evaluaciones/pages/resultados-examen/resultados-examen.spec.ts
npm run check:architecture
npm run build
```

## Próximo bloque

La siguiente reestructuración documentada es Herramientas IA: chatbot,
configuración del bot y estados de conversación. Después continúan Perfil,
Ranking y Comunidad; luego Tienda, Canjes y Mascota; finalmente Proyectos y
motores heredados.

Cada bloque debe conservar sus contratos reales, resolver todos sus estados y
publicarse primero en rama/PR. Producción requiere autorización expresa.
