# Release 2026-07-14: gamificación y portal alumno

Esta nota registra el trabajo completo realizado para separar XP de DAEMONS y
reconstruir la experiencia visual del estudiante. Su objetivo es conservar el
contexto técnico, las decisiones de producto, la evidencia de QA y el historial
de Git sin depender de conversaciones anteriores.

## Problema inicial

DAEMON usaba `tokens` para dos responsabilidades incompatibles:

- medir el progreso histórico y ordenar el ranking;
- actuar como moneda gastable en la tienda.

Cuando un alumno compraba una recompensa, su saldo bajaba y también perdía
posición. El comportamiento penalizaba el uso de la tienda y rompía la lógica
de gamificación.

La interfaz además se percibía como un dashboard genérico. Un primer rediseño
intentó resolverlo con Bento, glassmorphism, degradados, sombras grandes y
formas decorativas. Aunque añadió estructura, el resultado quedó visualmente
inconsistente entre módulos y demasiado cercano a una maqueta.

## Decisión de producto

Se adoptó un sistema dual:

```text
XP / experiencia
  - progreso histórico
  - nunca disminuye
  - calcula nivel
  - ordena ranking

DAEMONS / tokens
  - moneda virtual
  - se gana con recompensas
  - se gasta en tienda
  - no afecta nivel ni ranking
```

La dirección visual final usa Inter, azul sólido, superficies blancas, canvas
gris azulado, verde para éxito y ámbar para DAEMONS. El sidebar se conservó.

## Fase 1: backend de gamificación

Commit principal:

```text
0180a06 feat(gamification): separar XP de DAEMONS
```

Implementación:

- migración `2026_07_13_000000_add_experiencia_to_usuarios_table.php`;
- campo `usuarios.experiencia` entero con valor inicial 0;
- índice compuesto por rol y experiencia;
- backfill inicial desde tokens positivos para conservar el punto de partida;
- `GamificacionService` como única fórmula de recompensa y nivel;
- nivel visual progresivo de 1 a 100;
- `UsuarioResource` con XP, nivel y progreso;
- recompensas duales en misiones, evaluaciones y competencias;
- ranking público e interno ordenado por experiencia;
- canjes que descuentan tokens sin tocar experiencia;
- pruebas de misión, tienda y ranking.

Archivos backend principales:

```text
backend-laravel/database/migrations/2026_07_13_000000_add_experiencia_to_usuarios_table.php
backend-laravel/app/Models/Usuario.php
backend-laravel/app/Services/Gamificacion/GamificacionService.php
backend-laravel/app/Http/Resources/Api/V1/UsuarioResource.php
backend-laravel/app/Http/Controllers/Api/V1/MisionController.php
backend-laravel/app/Http/Controllers/Api/V1/RankingController.php
backend-laravel/app/Http/Controllers/Api/V1/TiendaController.php
backend-laravel/app/Services/Alumno/AlumnoService.php
backend-laravel/app/Services/Docente/DocenteService.php
backend-laravel/app/Services/Evaluacion/EvaluacionService.php
backend-laravel/app/Services/Competencia/CompetenciaService.php
backend-laravel/tests/Feature/GamificacionXpTest.php
```

## Fase 2: primera implementación visual

Commits conservados:

```text
28f6c41 feat(ui): crear sistema premium y layout alumno
9d6c0c1 feat(dashboard): transformar panel alumno en Bento
d5b94d6 feat(missions): rediseñar experiencia de misiones
384e371 feat(store): renovar tienda y canjes DAEMONS
ea8e94f feat(ranking): mostrar clasificación basada en XP
22db50d docs(gamification): documentar XP y DAEMONS
```

Esta fase conectó el frontend con el nuevo contrato, expuso nivel/XP/saldo y
separó visualmente ranking y tienda. También dejó el primer documento de
gamificación.

La revisión visual posterior determinó que había que retirar:

- degradados por módulo;
- mezcla de Inter y Outfit;
- header con apariencia de glassmorphism;
- radios demasiado grandes;
- sombras profundas y elevaciones exageradas;
- elementos decorativos que no aportaban información;
- variaciones de color que hacían parecer cada pantalla un producto distinto.

## Fase 3: rediseño correctivo

Pull request:

```text
https://github.com/WILLIAMMDN/daemon/pull/2
```

Commits:

```text
4efed1d refactor(ui): definir sistema visual solido del alumno
7951cac refactor(profile): reconstruir perfil del estudiante
329d635 refactor(dashboard): reconstruir panel del estudiante
39476fd refactor(modules): unificar misiones ranking y tienda
```

Merge:

```text
c611bc8addd6c8cbcf3482972193a69017ef4259
```

### Sistema visual

- Inter como fuente única.
- Canvas `#f4f7fb`.
- Superficies blancas.
- Borde `#e4eaf2`.
- Texto principal `#172033`.
- Azul `#1677ff` para acciones y progreso.
- Ámbar para saldo de DAEMONS.
- Verde para estados de éxito.
- Radios entre 12 y 16 px.
- Sombras cortas y discretas.
- Sin degradados en el alcance principal del portal alumno.

### Layout y header

- header blanco compacto;
- círculo de nivel y XP restante;
- saldo de DAEMONS independiente;
- notificaciones e identidad del alumno;
- versión móvil simplificada;
- sidebar sin cambios de componente ni rutas;
- navegación inferior preservada.

### Dashboard

- hero de bienvenida azul muy claro;
- avatar o iniciales;
- nivel y progreso;
- tarjetas de XP, DAEMONS, misiones y ranking;
- próxima misión;
- racha/actividad semanal;
- progreso hacia el siguiente nivel;
- colección de logros.

### Perfil

- identidad, rango y nivel académico;
- porcentaje de perfil completo;
- XP, DAEMONS, insignias y mochila;
- datos personales y biografía;
- mochila digital y estados vacíos;
- acceso claro a edición.

### Misiones

- centro de misiones con encabezado consistente;
- tarjetas blancas y recompensa dual;
- listado, detalle y entrega bajo el mismo lenguaje;
- CTA azul y estados legibles;
- mensaje explícito de XP permanente y DAEMONS gastables.

### Ranking

- encabezado que explica que la posición depende de XP;
- podio limpio;
- nivel y progreso por alumno;
- clasificación secundaria escaneable;
- ausencia de saldo de tokens.

### Tienda y canjes

- saldo ámbar separado del progreso;
- catálogo en tarjetas uniformes;
- precio y stock claramente diferenciados;
- inventario de canjes consistente;
- fallback con ícono cuando una imagen de premio falla;
- mensaje de que comprar no afecta XP ni ranking.

## Archivos frontend modificados

```text
frontend-angular/src/index.html
frontend-angular/tailwind.config.js
frontend-angular/src/styles.scss
frontend-angular/src/styles/_components.scss
frontend-angular/src/app/core/layouts/layout-alumno/
frontend-angular/src/app/features/alumno/pages/panel-alumno/
frontend-angular/src/app/features/alumno/pages/perfil-alumno/
frontend-angular/src/app/features/alumno/pages/editar-perfil/
frontend-angular/src/app/features/misiones/pages/lista-misiones/
frontend-angular/src/app/features/misiones/pages/detalle-mision/
frontend-angular/src/app/features/misiones/pages/entregar-mision/
frontend-angular/src/app/features/ranking/pages/ranking/
frontend-angular/src/app/features/tienda/pages/tienda-alumno/
frontend-angular/src/app/features/tienda/pages/mis-canjes/
```

## QA ejecutado

Pruebas automáticas:

```text
Jest: 2 suites, 5 pruebas aprobadas
Angular build: aprobado
PR Firebase preview: aprobado
```

QA visual local:

```text
Escritorio: 1440 x 900
Móvil:       390 x 844
```

Pantallas verificadas:

- dashboard;
- perfil;
- misiones;
- detalle de misión;
- ranking;
- tienda;
- mis canjes.

El backend local de QA usó una SQLite temporal y datos ficticios. No se
modificó Supabase ni se conservaron credenciales o archivos temporales.

Auditorías:

- sin `linear-gradient`, `radial-gradient`, `bg-gradient` ni Outfit dentro del
  alcance comprobado del portal alumno;
- componente sidebar sin cambios;
- entorno de desarrollo restaurado antes de los commits;
- `git diff --check` sin errores.

## Despliegue y evidencia

Workflow:

```text
https://github.com/WILLIAMMDN/daemon/actions/runs/29303236499
```

Resultado:

- deploy Firebase Hosting aprobado;
- smoke automático aprobado;
- smoke independiente aprobado;
- frontend `/login` HTTP 200;
- backend `/salud` HTTP 200 y base de datos OK;
- CORS y credenciales correctos;
- cabeceras de seguridad correctas;
- service worker y manifiesto disponibles;
- bundle local y público idénticos.

Bundle desplegado:

```text
main-COHOQPBW.js
```

URL:

```text
https://daemonestudiante.web.app
```

## Advertencias conocidas

- El bundle inicial Angular supera el presupuesto configurado.
- Sass muestra advertencias por el uso existente de `@import`.
- Estas advertencias no impidieron el build ni el despliegue.

No tratarlas como errores de esta release. Deben abordarse en un trabajo de
optimización separado para no mezclar cambios visuales con infraestructura de
estilos.

## Reglas para cambios futuros

1. No volver a ordenar ranking por tokens.
2. No descontar experiencia en canjes.
3. No duplicar la fórmula de nivel en Angular.
4. No reintroducir degradados por módulo.
5. No reemplazar el sidebar sin revisar rutas e IDs del tour.
6. No publicar sin pruebas, build y smoke.
7. Mantener commits separados por alcance funcional.

## Documentación relacionada

```text
docs/sistema-visual-portal-alumno.md
docs/frontend-ui-standard.md
docs/portal-alumno.md
docs/gamificacion-xp-daemons.md
docs/qa-produccion.md
docs/estado-nube-github-produccion.md
```
