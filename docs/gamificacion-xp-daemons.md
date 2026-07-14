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
