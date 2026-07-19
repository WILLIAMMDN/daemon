# Incidente: restauración de Supabase — 18 de julio de 2026

## Resumen

Durante una comprobación local se ejecutó `migrate:fresh --env=testing`. No
existía `.env.testing`, por lo que Laravel heredó la conexión Supabase local.
El proceso eliminó el esquema de negocio y empezó a ejecutar migraciones.

Se detuvo al observar la demora. Una consulta confirmó `usuarios=0`,
`instituciones=0` y solo 16 migraciones aplicadas.

## Recuperación

1. Se terminó el proceso PHP de migración.
2. Se localizó el workflow diario exitoso run `29638344886`.
3. Se descargó `daemon-postgres-29638344886`.
4. El SHA-256 coincidió con el dump.
5. Se descargó el cliente portable oficial PostgreSQL 17.10.
6. Se restauró con `pg_restore --clean --if-exists --no-owner
   --no-privileges --exit-on-error`.
7. Verificación posterior:

```text
usuarios=50
migraciones=28
instituciones=1
aulas=1
premios=2
```

8. `scripts/smoke-produccion.ps1` finalizó correctamente: frontend, backend,
   base, CORS, storage, cabeceras y service worker en estado OK.

## Ventana de recuperación

El backup fue creado el 18 de julio a las 08:57 UTC. Toda escritura posterior
al backup y anterior al incidente debe considerarse potencialmente no
recuperada. Supabase Storage y Firebase Auth no fueron eliminados. Deben
revisarse cuentas Firebase recientes y actividad operativa si hubo altas o
cambios durante esa ventana.

## Causa raíz

- `--env=testing` no crea por sí solo un entorno aislado.
- El repositorio ignoraba `.env.testing` y no había uno local.
- La protección destructiva dependía de `APP_ENV`, no del destino real.

## Prevención aplicada

- `.env.testing` fija SQLite `:memory:` y servicios locales.
- El repositorio permite versionarlo porque no contiene secretos.
- `AppServiceProvider` detecta `*.supabase.com` y prohíbe `migrate:fresh`,
  `refresh`, `reset`, `rollback` y `db:wipe`, aunque `APP_ENV` sea incorrecto.
- Las migraciones incrementales siguen habilitadas para Render.
- La verificación posterior confirmó `sqlite|:memory:` antes de migrar.

## Mejoras pendientes

- Reducir RPO o contratar PITR cuando los datos tengan uso continuo.
- Crear staging Supabase independiente para validar migraciones PostgreSQL.
- Añadir CI que falle si un entorno de prueba resuelve un host Supabase.
