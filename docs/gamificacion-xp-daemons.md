# Gamificacion DAEMON: XP y DAEMONS

DAEMON usa dos valores separados en `usuarios`:

- `experiencia`: progreso historico. Solo aumenta por logros academicos y nunca
  se descuenta al comprar. Ordena el ranking y calcula el nivel de juego.
- `tokens`: saldo de DAEMONS. Se obtiene con recompensas y se descuenta en la
  tienda. No participa en el ranking ni en el calculo de nivel.

## Recompensas duales

`App\Services\Gamificacion\GamificacionService::otorgarRecompensa()` es el
punto comun para premios academicos. Misiones aprobadas, evaluaciones aprobadas
y competencias suman la misma cantidad a experiencia y tokens.

Los ajustes manuales hechos desde `docente/tokens` son ajustes de moneda y no
otorgan XP. Los canjes solo descuentan tokens.

## Niveles

La curva usa 100 XP adicionales por cada salto de nivel:

```text
Nivel 1:    0 XP acumulada
Nivel 2:  100 XP acumulada
Nivel 3:  300 XP acumulada
Nivel 4:  600 XP acumulada
...
Nivel 100: tope visual
```

El nivel visual se limita a 100, pero `experiencia` puede seguir creciendo.
El API expone `nivel_gamificacion` y `progreso_nivel` desde
`UsuarioResource` para que Angular no replique la formula.

## Migracion

`2026_07_13_000000_add_experiencia_to_usuarios_table.php` agrega el campo con
valor por defecto 0 e indice para ranking. Durante el despliegue inicial copia
el saldo positivo actual de tokens como punto de partida de experiencia; desde
ese momento ambos valores evolucionan de forma independiente.

## Invariantes del sistema

Estas reglas son obligatorias:

1. `experiencia` nunca se descuenta.
2. Un canje solo puede modificar `tokens`.
3. El ranking público no expone el saldo de DAEMONS.
4. El nivel se calcula en Laravel, no en cada pantalla Angular.
5. Una misma aprobación no puede otorgar la recompensa dos veces.
6. Los valores negativos o iguales a cero no generan recompensa dual.
7. El tope de nivel es visual; la XP puede seguir creciendo después del nivel
   100.

## Fuentes actuales de XP

Llaman a `GamificacionService::otorgarRecompensa()`:

- aprobación docente de una misión;
- aprobación de una evaluación;
- recompensa obtenida en competencia.

Cada una suma el mismo valor a `experiencia` y `tokens`. Si una nueva actividad
académica debe otorgar progreso, debe reutilizar el servicio compartido.

No otorgan XP:

- ajustes manuales de moneda hechos por docentes;
- compras o canjes;
- edición del perfil;
- inicio de sesión;
- cambios de avatar, fondo o héroe.

## Ranking

El endpoint público `GET /api/v1/ranking`:

- filtra usuarios con rol `alumno`;
- selecciona `experiencia`, pero no `tokens`;
- ordena por `experiencia DESC`;
- usa `nombre_completo ASC` como orden estable;
- agrega `nivel_gamificacion` y `progreso_nivel`;
- normaliza la URL del avatar.

Las clasificaciones internas del docente y del panel alumno también usan
experiencia. No mantener una segunda clasificación basada en tokens.

## Contrato de progreso

`UsuarioResource` expone:

```text
experiencia
nivel_gamificacion
progreso_nivel.nivel
progreso_nivel.nivel_maximo
progreso_nivel.experiencia_total
progreso_nivel.experiencia_nivel
progreso_nivel.experiencia_meta
progreso_nivel.experiencia_restante
progreso_nivel.progreso_porcentaje
```

Angular debe usar estos campos para header, dashboard, perfil y ranking. Una
vista puede usar valores de respaldo para evitar romperse durante la carga,
pero no debe implementar una fórmula distinta.

## Flujo de misión aprobada

```text
Docente revisa entrega
  -> MisionController valida estado y puntos
  -> cambia la entrega a aprobada
  -> GamificacionService suma XP y tokens
  -> UsuarioResource/panel reflejan el nuevo progreso
```

La protección contra doble recompensa se basa en el estado de la entrega. Si
ya fue aprobada, una segunda revisión no vuelve a incrementar los saldos.

## Flujo de canje

```text
Alumno solicita canje
  -> TiendaController valida stock y saldo
  -> transacción descuenta tokens
  -> registra canje y stock digital/físico
  -> experiencia queda sin cambios
  -> Angular actualiza el saldo de sesión
```

La transacción y la validación pertenecen al backend. No confiar en el botón
deshabilitado del frontend como control de seguridad.

## Archivos de referencia

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
frontend-angular/src/app/core/servicios/sesion.ts
```

## Pruebas

`backend-laravel/tests/Feature/GamificacionXpTest.php` cubre:

- misión aprobada suma experiencia y tokens una sola vez;
- canje reduce tokens y conserva experiencia;
- ranking se ordena por experiencia y no expone saldo.

Ejecución:

```powershell
cd C:\laragon\www\daemon\backend-laravel
php artisan test --filter=GamificacionXpTest
php artisan test
```
