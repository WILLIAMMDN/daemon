# Portal alumno: estructura funcional

Este documento describe el estado actual del portal del estudiante después de
la separación XP/DAEMONS y del rediseño visual de julio de 2026.

## Audiencias académicas

El dominio académico admite únicamente dos niveles de estudiante:

```text
KIDS
TEENS
```

`rol` y `nivel` son conceptos distintos. `alumno`, `docente` y `admin` viven en
`usuarios.rol`; KIDS y TEENS viven en `usuarios.nivel`. Los valores históricos
`PRO` y `DOCENTE` se normalizan a TEENS mediante la migración
`2026_07_14_000000_normalize_student_levels.php` sin cambiar el rol del usuario.

Las opciones frontend se definen una sola vez en
`frontend-angular/src/app/core/dominio/nivel-alumno.ts`. Las validaciones Laravel
usan `App\Enums\NivelAlumno`. Aulas, evaluaciones, misiones y categorías de
premios reutilizan esas fuentes de verdad y no deben declarar listas propias.

El layout expone `data-nivel-alumno="kids|teens"` y variables CSS semánticas a
través de `tema-portal-alumno.ts`. Esto permite que un trabajo de diseño futuro
evolucione cada audiencia sin duplicar lógica, rutas ni componentes funcionales.
La reestructuración no altera la composición visual de las pantallas actuales.

## Layout compartido

El portal usa `LayoutAlumno` como contenedor de todas las rutas `/alumno`.

Responsabilidades:

- renderizar el sidebar existente;
- mostrar el header de progreso;
- exponer nivel, XP restante y saldo de DAEMONS;
- alojar notificaciones y menú de cuenta;
- adaptar la navegación a móvil;
- mantener la navegación inferior en pantallas pequeñas.

Archivos:

```text
frontend-angular/src/app/core/layouts/layout-alumno/layout-alumno.ts
frontend-angular/src/app/core/layouts/layout-alumno/layout-alumno.html
frontend-angular/src/app/core/layouts/layout-alumno/layout-alumno.scss
frontend-angular/src/app/core/dominio/nivel-alumno.ts
frontend-angular/src/app/core/dominio/tema-portal-alumno.ts
frontend-angular/src/app/core/layouts/portal-sidebar.config.ts
frontend-angular/src/app/core/layouts/sidebar-portal/
```

El header consume `Sesion.usuario()` y usa:

```text
nivel_gamificacion
progreso_nivel.progreso_porcentaje
progreso_nivel.experiencia_restante
tokens
```

El header no calcula niveles. La fórmula pertenece al backend.

## Dashboard

Ruta: `/alumno`.

El panel presenta:

- saludo e identidad del alumno;
- nivel actual y progreso hacia el siguiente nivel;
- XP histórica;
- saldo gastable de DAEMONS;
- misiones superadas;
- posición en el ranking visible de su aula o grupo académico;
- próxima misión;
- actividad semanal real de misiones aprobadas;
- colección de insignias y recompensas.

Archivos:

```text
frontend-angular/src/app/features/alumno/pages/panel-alumno/
backend-laravel/app/Services/Alumno/AlumnoService.php
backend-laravel/app/Http/Controllers/Api/V1/AlumnoController.php
```

La próxima misión, la posición y los siete días de actividad vienen del API.
`actividad_semana` usa `fecha_revision` y conserva `fecha_entrega` como respaldo
para datos históricos. Los estados vacíos son parte del producto y no deben
sustituirse con datos inventados.

En móvil la prioridad es: bienvenida compacta, próxima misión, actividad,
indicadores en cuadrícula 2x2 y tarjetas secundarias. Una recarga fallida no
reemplaza datos ya visibles: el panel los marca como anteriores y ofrece
reconectar. Los aumentos de XP confirmados por el servidor activan una
celebración breve del `Núcleo DAEMON`, sin sonido y respetando movimiento
reducido.

## Perfil

Ruta: `/alumno/perfil`.

El perfil se organiza en:

- identidad, nivel académico y rango;
- porcentaje de perfil completo;
- XP total y nivel de gamificación;
- saldo de DAEMONS;
- insignias ganadas;
- premios entregados en la mochila;
- correo y biografía;
- acceso a edición de perfil.

Archivos:

```text
frontend-angular/src/app/features/alumno/pages/perfil-alumno/
frontend-angular/src/app/features/alumno/pages/editar-perfil/
backend-laravel/app/Services/Alumno/AlumnoService.php
```

XP y DAEMONS siempre deben aparecer con etiquetas distintas. El campo `nivel`
del usuario representa la ruta académica (`KIDS`, `TEENS`, etc.); el campo
`nivel_gamificacion` representa el nivel calculado por experiencia.

## Misiones

Rutas principales:

```text
/alumno/misiones
/alumno/misiones/:id
/alumno/misiones/:id/entregar
```

Cada misión muestra una recompensa dual:

```text
+N XP permanente
+N DAEMONS gastables
```

La interfaz incluye listado, detalle, estado de entrega y formulario de
evidencia. La aprobación docente llama al servicio compartido de gamificación;
no se deben incrementar los dos campos desde Angular.

Archivos:

```text
frontend-angular/src/app/features/misiones/pages/lista-misiones/
frontend-angular/src/app/features/misiones/pages/detalle-mision/
frontend-angular/src/app/features/misiones/pages/entregar-mision/
backend-laravel/app/Http/Controllers/Api/V1/MisionController.php
backend-laravel/app/Services/Gamificacion/GamificacionService.php
```

## Ranking

Ruta: `/alumno/ranking`.

La clasificación se ordena por `experiencia DESC`. El saldo de tokens no se
selecciona ni se usa como desempate. Si dos alumnos tienen la misma XP, el API
ordena por nombre para obtener un resultado estable.

La pantalla muestra:

- podio de tres alumnos;
- XP total;
- nivel calculado;
- progreso del nivel;
- lista del resto de estudiantes.

Archivos:

```text
frontend-angular/src/app/features/ranking/pages/ranking/
backend-laravel/app/Http/Controllers/Api/V1/RankingController.php
```

## Tienda y canjes

Rutas: `/alumno/tienda` y `/alumno/canjes`.

La tienda usa exclusivamente `tokens` como saldo de DAEMONS. Un canje:

1. valida stock y saldo en Laravel;
2. descuenta tokens;
3. registra el canje;
4. conserva intacta la experiencia;
5. actualiza el saldo visible en la sesión Angular.

Las tarjetas de premios manejan imágenes ausentes o inválidas. Cuando el
recurso falla, `TiendaAlumno` registra el ID en `imagenesInvalidas` y muestra
un ícono de bolsa en lugar de dejar visible el texto de una imagen rota.

Archivos:

```text
frontend-angular/src/app/features/tienda/pages/tienda-alumno/
frontend-angular/src/app/features/tienda/pages/mis-canjes/
frontend-angular/src/app/features/tienda/services/tienda.ts
backend-laravel/app/Http/Controllers/Api/V1/TiendaController.php
```

## Contrato de usuario

El frontend puede recibir estos campos mediante `UsuarioResource`:

```json
{
  "tokens": 340,
  "experiencia": 890,
  "nivel_gamificacion": 4,
  "progreso_nivel": {
    "nivel": 4,
    "nivel_maximo": 100,
    "experiencia_total": 890,
    "experiencia_nivel": 290,
    "experiencia_meta": 400,
    "experiencia_restante": 110,
    "progreso_porcentaje": 73
  }
}
```

Los números son un ejemplo coherente con la curva actual; no son valores fijos
de una cuenta real.

## Diseño y accesibilidad

- Inter como fuente única.
- Superficies blancas sobre `#f4f7fb`.
- Azul para acción y XP.
- Ámbar para DAEMONS.
- Verde para éxito.
- Controles de al menos 40 px de alto.
- Estados vacíos con explicación y siguiente paso.
- Imágenes con texto alternativo y fallback visual.
- Encabezados semánticos y regiones con nombres accesibles.

Leer `docs/sistema-visual-portal-alumno.md` antes de modificar la apariencia.

## Bienestar digital familiar

Cuando existe un límite activo configurado por un tutor verificado, el layout
del alumno consulta `/alumno/bienestar-digital` y registra un latido visible por
minuto. Laravel guarda únicamente segundos agregados por día. Si se supera el
límite o comienza el horario de descanso, el contenido se reemplaza por una
pausa amable del Núcleo DAEMON; no se elimina ni se oculta el ranking.

El control falla de forma abierta ante una caída de red para no expulsar a un
alumno de una clase en vivo. No registra páginas visitadas, teclas, capturas,
chat ni contenido de la actividad.

## Límites de responsabilidad

- Angular presenta información y solicita acciones.
- Laravel valida roles, datos, recompensas y canjes.
- Supabase PostgreSQL guarda el estado de negocio.
- Supabase Storage aloja uploads de negocio.
- Firebase Hosting entrega la SPA y sus assets estáticos.
- Firebase Auth autentica la identidad; no calcula progreso académico.
