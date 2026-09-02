---
title: Gamificacion DAEMON: XP y DAEMONS
status: active
normative: false
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

> Referencia técnica de dominio. La definición canónica global se encuentra
> en `product-overview.md` y las reglas canónicas en `business-rules.md`.

# Gamificacion DAEMON: XP y DAEMONS

Desde el 19 de julio de 2026, cada cambio también se registra en el ledger
append-only `movimientos_economia`, con saldo anterior/resultante,
idempotencia, origen y actor. `usuarios.experiencia` y `usuarios.tokens` siguen
siendo proyecciones rápidas.

DAEMON usa dos valores separados en `usuarios`:

- `experiencia`: progreso historico. Solo aumenta por logros academicos y nunca
  se descuenta al comprar. Ordena el ranking y calcula el nivel de juego.
- `tokens`: saldo de DAEMONS. Se obtiene con recompensas y se descuenta en la
  tienda. No participa en el ranking ni en el calculo de nivel.

## DAEMON Pulse V1

Pulse es la capa de progresion del producto autenticado DAEMON ARC. Consume
unicamente eventos academicos server-side ya validados por Learning Core:

```text
Learning Core -> eventos_dominio -> politica Pulse -> movimientos_economia
              -> XP / Daems / racha / logro -> snapshot de progresion
```

`movimientos_economia` sigue siendo el ledger canonico compartido para XP y
Daems; `usuarios.experiencia` y `usuarios.tokens` siguen siendo proyecciones de
lectura compatibles con ranking, tienda y UI existente. Cada movimiento Pulse
referencia el evento de dominio y la politica que lo genero. Las restricciones
unicas por evento/politica y clave de repeticion son la barrera de base de datos
contra reintentos, workers duplicados y farming.

No se sembraron politicas ni logros comerciales. Learning Core funciona aunque
no exista una politica. El consumidor `pulse:process-outbox` es separado y
reintentable, por lo que una falla de Pulse no revierte una finalizacion
academica.

Interpretacion canonica V1 de reconocimientos:

- `insignias` contiene tanto insignias manuales legacy como definiciones de
  logro Pulse cuando `tipo_criterio` no es nulo;
- `insignias_otorgadas` contiene los otorgamientos; los automaticos Pulse son
  inmutables e idempotentes;
- no existe un segundo dominio Achievement/Badge en paralelo.

Invariantes de separacion:

- XP no es Mastery.
- Daems no es Mastery.
- el nivel Pulse es progresion de identidad, no dificultad academica ni
  audiencia KIDS/TEENS;
- Learning Core conserva la autoridad de prerequisitos y desbloqueos
  academicos; Pulse solo puede otorgar recompensas no academicas.

Contratos de lectura del estudiante:

```text
GET /api/v1/alumno/pulse
GET /api/v1/alumno/pulse/transacciones
GET /api/v1/alumno/pulse/logros
```

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
3. El ranking visible del alumno exige sesión y no expone el saldo de DAEMONS
   ni credenciales de acceso.
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

El endpoint autenticado `GET /api/v1/ranking`:

- permanece visible como incentivo para el alumno;
- limita la comparación al aula; si no existe, usa institución y nivel o el
  nivel académico como respaldo;
- selecciona `experiencia`, pero no `tokens`;
- ordena por `experiencia DESC`;
- usa nombre e `id` como desempate estable;
- expone un nombre reducido, no el usuario de login ni el nombre completo;
- agrega `nivel_gamificacion` y `progreso_nivel`;
- normaliza la URL del avatar.

El panel y la página de ranking reutilizan `RankingService`, por lo que muestran
la misma posición, alcance y desempate. No mantener una segunda clasificación
basada en tokens.

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
