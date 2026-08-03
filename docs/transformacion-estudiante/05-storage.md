# Paquete 5 — Storage y ciclo de vida de archivos

- Estado: abstracción implementada; proveedor en decisión
- Fecha: 2026-08-03
- Rama: `refactor/student-production-hardening`
- Escrituras productivas: ninguna

## Objetivo

Aislar el almacenamiento de binarios detrás de una abstracción de dominio,
validar todo activo en el servidor (propiedad, MIME, dimensiones, path) y
dejar el proveedor intercambiable por configuración de entorno, sin que ningún
componente conozca detalles de fetch, paths o políticas del bucket.

## Estado verificado

- `activos-cuento.repositorio.ts` define el contrato:
  `subirPortada`, `subirIlustracion`, `eliminarActivo`, `obtenerUrlLectura`,
  `validarArchivo`, `limpiarActivosHuerfanos`.
- `storage/supabase-activos-cuento.adapter.ts` implementa el contrato con
  Supabase Storage (proveedor actual).
- El control plane Laravel (`ActivosCuentoService`) valida en servidor:
  propiedad (UID + cuento), MIME real, dimensiones y path construido por el
  servidor (`stories/{authorUid}/{storyId}/cover|pages/...`); nunca paths
  arbitrarios enviados por el cliente.
- Rutas `POST /cuentos-v2/{cuentoId}/activos`, `GET .../activos/url`,
  `POST .../activos/eliminacion` y `POST .../activos/limpieza`, todas con
  `throttle`.
- El `service_role` no se expone al frontend; la anon key pública de Supabase
  no se trata como secreto (ADR-004).

## Decisión adoptada (dueño, 2026-08-03)

**Storage no está activado aún.** El dueño decidió **no implementar el Bloque 1**
de esta ronda (storage.rules, moderación y ciclo de vida completo de archivos)
mientras explora otra vía de base de datos segura sin depender de Storage.
Por tanto:

- No se creó `storage.rules`.
- No se desplegó ni probó contra buckets productivos.
- El ciclo de vida de activos (reversión de subida si falla la escritura del
  documento, limpieza de huérfanos en producción) queda **diseñado en el
  contrato** y pendiente de activación con el proveedor elegido.

## Cómo queda el módulo

```text
componente → ActivosCuentoRepositorio (contrato)
              → SupabaseActivosCuentoAdapter (proveedor actual)
              → Laravel /activos/* (validación server-side)
```

Cuando el dueño elija el proveedor final, solo hace falta un adaptador nuevo y
la variable de entorno `storage.provider`; ningún componente cambia.

## Riesgos pendientes

- `storage.rules` (Firebase) o RLS/policies (Supabase) no versionados.
- Limpieza de activos huérfanos sin ejecutar en producción.
- Reversión de subida ante fallo de escritura del documento (diseñada en
  `ActivosCuentoService`, pendiente de verificación E2E con proveedor real).

## Próximo paquete

- Paquete 6: experiencia KIDS/TEENS configurable (ver `06-kids-teens.md`).
