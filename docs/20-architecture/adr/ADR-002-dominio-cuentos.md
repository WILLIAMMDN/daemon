---
title: ADR-002: Dominio canónico y transición de cuentos
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# ADR-002: Dominio canónico y transición de cuentos

- Estado: Aceptado
- Fecha: 2026-08-02
- Depende de: ADR-001
- Implementación: Paquetes 3 y 4; este ADR no escribe datos de producción

## Contexto

El dominio de cuentos tiene hoy dos implementaciones mutables:

- Angular opera directamente sobre `cuentos`, `cuento_comentarios` y
  `cuento_reacciones` en Firestore.
- Laravel expone rutas públicas, de alumno y de administración respaldadas por
  las tablas PostgreSQL `cuentos` y `cuento_reacciones`.

Los modelos no coinciden: Firestore mezcla `firebase_uid` con `id_alumno`, usa
colecciones raíz para comentarios/reacciones y permite estados que PostgreSQL
no representa; PostgreSQL limita el formato histórico a seis escenas. Además,
la galería Angular contiene un comando cliente que lee el API productivo y
copia documentos directamente a Firestore. Mantener ambos caminos como
escritores no es aceptable.

## Decisión principal

Firestore será la única fuente canónica de cuentos, sus versiones, páginas,
comentarios y reacciones. Laravel/PostgreSQL conservará:

- usuarios, roles, audiencia, aula y vínculos familiares;
- decisiones de moderación, reportes y auditoría;
- el mapeo de IDs y estado de la migración;
- endpoints de compatibilidad mientras existan consumidores;
- comandos privilegiados de publicación, moderación, archivo y purga.

No habrá dual-write. La tabla PostgreSQL `cuentos` queda clasificada como
legada: sus escrituras actuales continúan solo hasta instalar el adaptador y
cerrar el corte formal. Después del corte será de solo lectura para
reconciliación y rollback durante una ventana definida por operaciones.

## Cobertura explícita de la decisión

- **Firestore versus Laravel:** Firestore conserva el contenido canónico;
  Laravel autoriza, modera, audita y mantiene compatibilidad.
- **Estado de endpoints Laravel:** se conservan y adaptan; no se eliminan sin
  confirmar consumidores y telemetría.
- **Modelo de identificadores:** IDs aleatorios de Firestore, ownership por UID
  y mapeo no autoritativo al ID PostgreSQL legado.
- **Borradores:** privados, editables solo por el owner y separados de la
  versión publicada.
- **Publicación y visibilidad:** comandos Laravel; aula/comunidad autenticada
  después de aprobación, sin publicación web anónima por defecto.
- **Comentarios y reacciones:** subcolecciones Firestore; comentarios escritos
  vía Laravel y reacciones propias idempotentes por UID.
- **Moderación y auditoría:** decisiones y actor canónicos en PostgreSQL con
  estado mínimo proyectado en Firestore.
- **Eliminación:** borrado lógico inmediato y purga confiable, reanudable y
  coordinada con Storage.
- **Migración de datos existentes:** strangler, dry-run, manifiesto, checksum,
  cuarentena y rollback; nunca migración cliente o big bang irreversible.

## Modelo documental objetivo

Se adopta un esquema versionado bajo el namespace existente:

```text
/cuentos/{cuentoId}
  /versiones/{versionId}
    /paginas/{paginaId}
  /comentarios/{comentarioId}
  /reacciones/{firebaseUid}
```

### Subcolecciones frente a colecciones globales

Se elige la opción de subcolecciones. Las consultas reales principales son
“páginas/comentarios/reacciones de un cuento” y las reglas necesitan heredar el
contexto de ownership, estado, visibilidad y bloqueo del padre. El ID
determinista de reacción también queda naturalmente acotado por cuento.

Las colecciones globales simplificarían una bandeja de moderación, pero
duplicarían `storyId`, facilitarían documentos huérfanos y obligarían a repetir
lecturas/reglas de contexto. La moderación global se resuelve con
`collectionGroup` e índices explícitos o con la proyección PostgreSQL de
reportes; no justifica convertir el modelo primario en global.

El coste aceptado es que borrar el padre no elimina subcolecciones. Por eso no
se usa `deleteDoc` cliente como limpieza: Laravel recorre manifiesto/versiones,
aplica borrado lógico primero y ejecuta una purga reanudable con auditoría.

### Raíz `/cuentos/{cuentoId}`

Contiene metadata consultable, no el cuerpo completo:

- `schema_version`: entero soportado por el cliente;
- `autor_uid` (el `authorUid` conceptual): Firebase UID inmutable y usado para
  ownership;
- `autor_usuario_id`: ID PostgreSQL proyectado para trazabilidad, nunca para
  autorizar reglas;
- `audiencia`: `KIDS` o `TEENS`, proyectada desde PostgreSQL;
- `estado`: `borrador`, `en_revision`, `publicado`, `rechazado`, `archivado` o
  `eliminado`;
- `visibilidad`: `privado`, `aula` o `comunidad`;
- `version_borrador_id` y `version_publicada_id`;
- `moderacion_estado`: proyección de la decisión canónica de Laravel;
- `titulo_publicado`, `sinopsis_publicada`, `portada_ref` y contadores
  reconstruibles para la galería;
- `created_at`, `updated_at`, `submitted_at`, `published_at` y `deleted_at` como
  timestamps, no strings locales;
- `legacy.postgres_id` cuando exista origen legado.

El ID del cuento y de cada versión/página es un ID aleatorio de Firestore. No
se deriva del usuario, título ni ID PostgreSQL. Esto permite múltiples cuentos
por alumno y evita enumeración predecible. Un índice de migración controlado por
Laravel garantiza unicidad de `legacy.postgres_id`.

### Versiones y páginas

Una versión contiene título, sinopsis, categoría, idioma, métricas derivadas y
estado de validación. Sus páginas contienen `orden`, texto estructurado o texto
plano sanitizable, referencia de imagen, texto alternativo y timestamps.

- El contenido nuevo no se considera HTML confiable.
- Un borrador solo lo ve y modifica su autor.
- Al enviarse a revisión, la versión queda inmutable.
- Una edición de un cuento publicado crea otra versión borrador; la comunidad
  continúa viendo la última versión aprobada.
- La publicación cambia el puntero `version_publicada_id` mediante una operación
  privilegiada, no sobrescribe contenido aprobado desde el cliente.
- La cantidad de páginas deja de estar limitada a columnas `data_1..data_6`.

### Comentarios y reacciones

- Los comentarios son subdocumentos del cuento, contienen `autor_uid`, texto
  plano limitado, estado de moderación y timestamps.
- Crear, editar o eliminar un comentario pasa inicialmente por Laravel para
  aplicar ownership, sanitización y rate limiting; moderadores usan la misma
  capa y toda intervención queda auditada. La lectura puede ser directa y
  paginada desde Firestore.
- Una reacción usa como ID el Firebase UID. `set` y `delete` son idempotentes y
  solo admiten un tipo de una lista cerrada.
- Los clientes no escriben contadores. Los contadores son proyecciones
  reconstruibles y solo un proceso confiable puede actualizarlos.

## Ciclo de vida

```text
borrador -> en_revision -> publicado
                       -> rechazado -> borrador
publicado -> archivado
cualquier estado visible -> eliminado (borrado lógico)
```

- El autor crea y edita borradores bajo Security Rules.
- Enviar, aprobar, rechazar, publicar, archivar y purgar son comandos Laravel.
- `visibilidad=comunidad` solo produce lectura comunitaria cuando el estado es
  `publicado` y existe una versión publicada.
- `visibilidad=aula` requiere una proyección de aula válida y una consulta que
  satisfaga las reglas; mientras esa proyección no esté implementada se trata
  como privado, no como público.
- El borrado ordinario es lógico e inmediato para las lecturas. La purga física
  de Firestore y Storage ocurre desde un proceso confiable tras la retención
  configurada o como parte de una solicitud de privacidad aprobada.

ADR-005 añade restricciones conservadoras para KIDS y TEENS. La interfaz no
puede cambiar un estado privilegiado aunque presente el botón.

## Estado de endpoints Laravel

No se elimina ni cambia silenciosamente ningún endpoint en este paquete.

| Endpoint actual                  | Estado de transición                              | Destino                                                                                               |
| -------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `GET /api/v1/cuentos`            | Compatibilidad pública; instrumentar consumidores | Leer Firestore mediante adaptador y devolver el contrato legado mientras sea necesario.               |
| `GET /api/v1/cuentos/{cuento}`   | Compatibilidad por ID PostgreSQL                  | Resolver el mapeo legado y leer la versión publicada de Firestore.                                    |
| `GET /api/v1/cuentos/mio/actual` | Compatibilidad autenticada                        | Adaptar al primer/último cuento del autor sin imponer el límite futuro de uno por alumno.             |
| `POST /api/v1/cuentos`           | Escritor legado a retirar                         | Congelar después de migrar consumidores; no escribir PostgreSQL y Firestore en la misma petición.     |
| `DELETE /api/v1/cuentos/mio`     | Escritor legado a retirar                         | Convertir en comando de borrado lógico Firestore con ownership verificado.                            |
| Rutas `/cuentos/admin*`          | Se conservan como control plane                   | Autorizar en Laravel, escribir Firestore con credencial de servicio y registrar auditoría PostgreSQL. |

Antes de retirar un contrato se debe revisar Angular, pruebas, scripts,
administración, exportación de privacidad, eliminación de alumnos, métricas y
organización de Storage. Una respuesta `Deprecation`/`Sunset` solo se añade
cuando exista fecha y telemetría de consumidores.

## Consumidores conocidos y tratamiento

| Consumidor                        | Dependencia actual                | Tratamiento requerido                                                                 |
| --------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| Galería, creador y lector Angular | Firestore directo                 | Migrar al esquema versionado y a repositorios de dominio; eliminar migración cliente. |
| `ProyectoService`                 | Cuenta cuentos PostgreSQL         | Leer una proyección Firestore o contador confiable después del corte.                 |
| `PrivacidadService`               | Exporta filas PostgreSQL          | Incorporar exportación Firestore y referencias Storage en la operación coordinada.    |
| `AlumnoAdminService`              | Métricas y borrado PostgreSQL     | Usar adaptador Firestore y borrado lógico/purga auditada.                             |
| `OrganizarStorageSupabase`        | Recorre seis columnas de imágenes | Sustituir por reconciliación de `storage_ref` del modelo versionado.                  |
| API pública y administración      | Eloquent/PostgreSQL               | Mantener contrato mediante adaptador hasta migrar consumidores.                       |

## Migración

1. Inventariar consumidores y desactivar el botón de migración de la SPA antes
   de cualquier copia real.
2. Crear reglas e índices versionados y probarlos en Emulator Suite.
3. Implementar repositorio Firestore cliente y adaptador confiable Laravel.
4. Ejecutar un export read-only de PostgreSQL y Firestore; clasificar duplicados
   por `legacy.postgres_id`, autor, título, timestamps y hash de contenido.
5. Transformar a schema v2 en un entorno aislado. Sanitizar HTML legado,
   convertir URLs/base64 a referencias Storage y generar un manifiesto con
   checksum.
6. Hacer backfill idempotente con checkpoint y dry-run. Nunca desde el navegador.
7. Comparar conteos, autores, versiones, páginas, archivos y visibilidad.
8. Cambiar lectores al nuevo repositorio; observar errores y contratos legados.
9. Cerrar escritores PostgreSQL y activar comandos privilegiados Firestore.
10. Conservar tabla y mapeo para rollback durante la ventana aprobada. La
    eliminación posterior exige autorización separada y backup verificado.

La reconciliación define conflicto explícitamente: una versión Firestore ya
publicada y moderada no se sobrescribe con una fila PostgreSQL más antigua. Los
casos ambiguos quedan en cuarentena para revisión; no se elige por “última
fecha” sin verificar reloj y procedencia.

## Consecuencias

### Positivas

- Desaparece el doble origen mutable.
- Se soportan múltiples cuentos y páginas sin un esquema fijo de seis escenas.
- Las revisiones no exponen cambios sin moderar sobre una versión publicada.
- Comentarios y reacciones quedan naturalmente acotados al cuento.

### Costes y riesgos

- Laravel aún no tiene el adaptador Firestore de confianza; el corte queda
  bloqueado hasta implementarlo y probarlo.
- Las consultas de galería requieren índices explícitos y deben diseñarse junto
  con Security Rules.
- Los datos legados pueden contener HTML, base64, IDs mixtos o timestamps
  inconsistentes y requieren cuarentena.

## Alternativas descartadas

- Conservar PostgreSQL como autoridad de cuentos y Firestore como réplica
  mutable: no hay una transacción distribuida segura ni necesidad demostrada.
- Borrar ahora las rutas Laravel: rompería consumidores conocidos y flujos de
  privacidad/administración.
- Migrar con un botón Angular en producción: el cliente no puede acreditar
  integridad, idempotencia, autorización administrativa ni rollback.

## Referencias

- [Firestore: elegir entre documentos anidados y subcolecciones](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Firestore: transacciones y escrituras por lotes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- `frontend-angular/src/app/features/cuentos/services/cuento.ts`
- `frontend-angular/src/app/features/cuentos/pages/galeria-proyectos/galeria-proyectos.ts`
- `backend-laravel/routes/api.php`
- `backend-laravel/app/Services/Cuento/CuentoService.php`
