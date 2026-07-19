# Plan de evolución visual del portal alumno

Estado inicial: 15 de julio de 2026. Continuidad confirmada: 19 de julio de
2026.

## Base confirmada para continuar

El estado vigente es el trabajo de Codex conservado en
`codex/antigravity-integration`. El nombre de la rama es histórico: no significa
que se deban incorporar cambios de Antigravity. La rama
`feature/frontend-design-system` queda descartada como fuente de integración y
no se copiará ni fusionará en bloque.

El dashboard conserva `/img/robot-mision.png` en el estado “Ruta completada por
ahora”. El login local `jose123` sigue siendo parte de la verificación funcional
y no debe alterarse durante cambios puramente visuales.

## Diagnóstico

La arquitectura Angular, Laravel, Firebase y Supabase no impide construir una
experiencia visual potente. El problema actual está en la capa de producto:
varias páginas migradas usan encabezados blancos, tarjetas intercambiables y
acciones genéricas. Son funcionales, pero no comunican mundo, avance ni propósito.

La arquitectura anterior sí lograba una identidad memorable mediante escenarios,
estaciones, estados y botones físicos. También tenía límites: degradados intensos,
composición rígida, baja adaptación móvil, tipografías mezcladas y algunos estados
ficticios o enlaces incompletos.

La dirección correcta no es regresar al PHP anterior ni mantener el dashboard
genérico. Es conservar los contratos y la accesibilidad actuales, recuperando
narrativa, personalidad y respuesta física en la interfaz.

## Dirección de producto

1. Una sola plataforma, distintas experiencias reconocibles.
2. Color sólido y jerarquía antes que degradados o glassmorphism.
3. Cada CTA debe conducir a una ruta o acción real.
4. Nivel, progreso, saldo, bloqueos y estados siempre vienen de sesión o API.
5. Los módulos insignia pueden tener un escenario propio dentro del sistema DAEMON.
6. Escritorio y móvil se diseñan juntos, no como corrección posterior.

## Fase piloto ejecutada: Super Lab

Ruta: `/alumno/herramientas`.

Cambios:

- hero de laboratorio con identidad DAEMON;
- nivel real leído desde `Sesion` en lugar del valor fijo `1`;
- siete estaciones con iconografía, capacidad, estado y CTA propio;
- rutas actuales preservadas;
- profundidad corta, foco visible y reducción de movimiento;
- cuadrícula de cuatro, dos y una columna según el ancho;
- prueba automática para nivel dinámico y enlaces navegables.

Este piloto define el equilibrio buscado: más carácter que el portal corporativo,
pero con más claridad, accesibilidad y solidez técnica que la vista heredada.

## Hoja de ruta

### Próxima sesión de trabajo

1. Revisar la iconografía de Cursos: reemplazar iconos repetidos, ambiguos o
   semánticamente incorrectos sin cambiar todavía sus contratos de datos.
2. Reestructurar un módulo por vez, conservando todas sus funciones y rutas.
3. Para cada módulo definir antes de editar: propósito, acción principal, datos
   reales, carga, vacío, error, reintento, responsive y accesibilidad.
4. Validar primero en local; commit y PR por alcance; producción solamente con
   autorización y los gates completos.

Orden propuesto:

1. Cursos e iconografía.
2. Misiones: listado, detalle y entrega.
3. Evaluaciones, resultados y recursos académicos.
4. Herramientas IA: chatbot y configuración del bot.
5. Perfil, ranking y comunidad.
6. Tienda, canjes y mascota.
7. Proyectos y motores heredados.

No mezclar varios módulos en un lote visual. Cada entrega debe conservar el
sidebar morado, Inter, XP separado de DAEMONS, los datos reales del backend y
las funciones existentes.

### Fase 1. Núcleo de identidad

- convertir el dashboard en un centro de operaciones y no en un resumen de KPIs;
- alinear el chatbot y la configuración del bot con Super Lab;
- crear primitivas compartidas para hero, estación, estado y CTA físico;
- auditar todos los botones sin ruta, enlaces `#` y acciones sin confirmación.

### Fase 2. Ciclo de aprendizaje

- reconstruir listado, detalle y entrega de misiones como una ruta continua;
- mejorar evaluaciones, resultados y recursos con contexto y siguiente acción;
- hacer visibles prerequisitos, recompensas y estados reales del backend.

Los iconos pendientes de Cursos se resuelven al inicio de esta fase con una sola
familia visual, significado consistente, texto accesible y registro explícito.

### Fase 3. Progreso y recompensa

- convertir perfil, ranking y tienda en superficies de logro conectadas;
- conservar la separación XP/DAEMONS;
- reforzar estados vacíos, desbloqueos y celebraciones sin animación constante.

### Fase 4. Motores heredados

- revisar Neuro Maze, Entrenamiento, Cerebro IA y Defensa IA por separado;
- reemplazar contenedores temporales por experiencias Angular completas;
- conservar los motores útiles de `public/legacy/js` detrás de contratos claros;
- eliminar cualquier control visible que todavía no ejecute una acción real.

### Fase 5. Sistema y QA

- documentar componentes, tokens, variantes y patrones responsive;
- añadir pruebas de navegación y estados críticos;
- revisar visualmente 1440 x 900 y 390 x 844;
- ejecutar Jest, build Angular, pruebas Laravel y smoke antes de publicar.

## Criterios de aceptación por pantalla

- propósito y acción principal comprensibles en cinco segundos;
- ningún dato de progreso codificado de forma fija;
- ningún botón decorativo o ruta inexistente;
- navegación por teclado y foco visible;
- sin desbordamiento horizontal en móvil;
- estados de carga, error y vacío con siguiente paso;
- misma calidad visual con datos completos, escasos o ausentes;
- build y pruebas aprobados antes de integrar.
