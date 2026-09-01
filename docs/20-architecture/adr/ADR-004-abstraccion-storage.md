---
title: ADR-004: Abstracción y ciclo de vida de Storage para cuentos
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# ADR-004: Abstracción y ciclo de vida de Storage para cuentos

- Estado: Aceptado
- Fecha: 2026-08-02
- Depende de: ADR-001, ADR-002 y ADR-006
- Implementación: Paquetes 2, 4 y 5; Supabase no se reemplaza en este ADR

## Contexto

Los uploads de negocio de DAEMON usan Supabase Storage. El frontend contiene
`AlmacenamientoArchivos`, un servicio concreto que construye endpoints y paths,
sube con la anon key y hace upsert/delete directamente. El esquema versionado
del repositorio, en cambio, declara lectura pública de `daemon-assets` y
escritura solo para `service_role`; `daemon-private` también es server-only.

La anon key es pública por diseño y no es un secreto. El riesgo no es que esté
en Angular, sino permitir escrituras anónimas o paths arbitrarios sin una policy
que pueda vincular el Firebase UID con ownership. Un token Firebase no convierte
al cliente en rol `authenticated` de Supabase. Abrir INSERT/UPDATE/DELETE a
`anon` para compensarlo no satisface los controles de DAEMON.

Firebase Storage puede permanecer bloqueado por facturación. No se hará que un
flujo principal dependa de ese proveedor ni de Cloud Functions.

## Decisión

El dominio consume un puerto `RepositorioActivosCuento`; ningún componente,
facade o caso de uso conoce fetch, SDK, bucket, credenciales o estructura de
paths.

```ts
interface RepositorioActivosCuento {
  subirPortada(...): Promise<ActivoCuento>;
  subirIlustracion(...): Promise<ActivoCuento>;
  eliminarActivo(...): Promise<void>;
  obtenerUrlLectura(...): Promise<string>;
  validarArchivo(...): Promise<ResultadoValidacionActivo>;
  limpiarActivosHuerfanos(...): Promise<ResultadoLimpieza>;
}
```

El contrato y sus tipos viven en el acceso a datos/dominio de cuentos según la
frontera final del módulo. Angular selecciona el adaptador con un
`InjectionToken` configurado por entorno; no usa `if (provider)` dispersos.

Adaptadores previstos:

- `SupabaseActivosAdapter`: proveedor activo y obligatorio durante la
  transición;
- `FirebaseActivosAdapter`: preparado detrás del mismo contrato y probado solo
  con Emulator Suite cuando sea posible; no se activa sin facturación, reglas,
  entorno y decisión operativa;
- `ActivosCuentoFakeAdapter`: pruebas unitarias/E2E sin red ni buckets reales.

El servicio existente se adapta gradualmente o queda como implementación
interna del adaptador Supabase. No se rompe el proveedor actual antes de tener
pruebas de caracterización y paridad.

## Flujo de subida confiable

Supabase continúa guardando bytes, pero Laravel autoriza el ciclo de vida:

1. Angular valida para UX y solicita una reserva a Laravel con tipo de activo,
   story ID, page ID, tamaño, MIME declarado y checksum cuando esté disponible.
2. Laravel resuelve el usuario autenticado, ownership y límites; nunca acepta un
   object key completo construido por el cliente.
3. Laravel genera el object key y entrega una subida acotada/temporal o recibe
   el archivo mediante el servicio de archivos existente.
4. El adaptador sube y confirma tamaño/checksum/MIME.
5. El caso de uso escribe en Firestore una `storage_ref`, no una URL ni base64.
6. Si falla Firestore, se revierte el activo reservado o queda marcado para el
   reconciliador de huérfanos.
7. Publicación y eliminación coordinan Firestore, auditoría y Storage con
   idempotency key; no se promete una transacción distribuida inexistente.

La service key/service role se conserva únicamente en Laravel/CI autorizado.
Una URL firmada no se registra completa en logs ni se persiste en Firestore.

## Paths y separación de visibilidad

Laravel genera paths normalizados e inmutables:

```text
daemon-private/cuentos/borradores/{authorUid}/{storyId}/{versionId}/
  cover/{assetId}.webp
  pages/{pageId}/{assetId}.webp

daemon-assets/uploads/cuentos/publicados/{storyId}/{versionId}/
  cover/{assetId}.webp
  pages/{pageId}/{assetId}.webp
```

- `authorUid`, `storyId`, `versionId`, `pageId` y `assetId` se validan o generan;
  no se aceptan `..`, slashes arbitrarios ni nombres originales como path.
- Borradores son privados y se leen con URLs firmadas breves.
- Solo la versión aprobada se copia/promueve al bucket público.
- Activos publicados son inmutables y versionados; no se sobrescribe un objeto
  que otro usuario o versión todavía referencia.
- Los assets estáticos de Angular continúan en Firebase Hosting.

Firestore persiste una referencia estable:

```text
provider, bucket, objectKey, version, mimeType, bytes,
width, height, checksum, createdAt
```

`Activos`/el adaptador resuelve la URL en tiempo de lectura. Esto permite cambiar
CDN/proveedor sin reescribir documentos y evita tratar una URL firmada como dato.

## Validación y límites

Los límites se centralizan en configuración versionada y se aplican tanto en el
cliente como, de forma autoritativa, en Laravel:

- lista cerrada de MIME/extensiones y comprobación de firma mágica cuando sea
  posible;
- tamaño máximo original y resultante;
- ancho, alto y total de píxeles;
- máximo de páginas/activos por cuento;
- compresión y conversión a WebP/AVIF según compatibilidad;
- decodificación segura para detectar archivos corruptos o polyglot;
- nombres generados y cabecera `Content-Type` normalizada;
- rate limiting y cuota por usuario;
- alt text requerido antes de publicación, sin derivarlo del nombre del archivo.

Los números concretos se definen en una configuración única y documentada al
implementar el Paquete 5. Hasta validarlos con producto y assets reales no se
dispersan límites provisionales en componentes.

## Eliminación, compensación y huérfanos

- Quitar una imagen del borrador marca la referencia como retirada y programa
  eliminación server-side idempotente.
- Eliminar lógicamente un cuento oculta datos y bloquea nuevas URLs; la purga
  recorre todas las versiones/subcolecciones y sus manifests.
- Una solicitud de privacidad coordina Firebase Auth, PostgreSQL, Firestore y
  ambos buckets según la política existente.
- Un reconciliador compara reservas/metadata con `storage_ref`, reporta antes de
  borrar y admite dry-run, checkpoint y ventana de gracia.
- La limpieza no depende de cascada Firestore ni Cloud Functions.
- Un fallo parcial deja un estado reintentable y auditado; nunca borra un objeto
  solo porque una referencia temporal no apareció en una lectura eventual.

## Seguridad de proveedores

### Supabase

- RLS/policies permiten lectura pública solo del bucket publicado.
- Borradores quedan server-only/privados y usan URL firmada.
- Las escrituras usan Laravel o una autorización temporal de alcance mínimo.
- Upsert y delete requieren policies distintas; no se abre acceso global a
  `anon`.
- Se auditan las policies reales antes de cualquier cambio; las migraciones del
  repo son evidencia, no garantía del estado desplegado.

### Firebase Storage

- El adaptador futuro usa reglas versionadas, UID en path, allowlists de MIME y
  límites de tamaño.
- Se prueba en emulador con propietario, tercero, no autenticado y path
  manipulado.
- No se activa si requiere Blaze/recursos no disponibles ni se suben archivos a
  un bucket productivo para probarlo.

## Consecuencias

### Positivas

- Componentes y casos de uso dejan de acoplarse a Supabase/fetch/paths.
- Los borradores de menores no necesitan ser públicos para poder editarse.
- Una falla entre upload y Firestore se vuelve reconciliable.
- Firebase Storage puede evaluarse sin reescribir el dominio.

### Costes

- Laravel debe implementar reserva/confirmación, URLs firmadas y reconciliación.
- Publicar implica promover/copy de activos y comprobar su integridad.
- La migración debe localizar URLs y base64 legados antes de retirarlos.

## Alternativas descartadas

- Declarar la anon key como secreto y ocultarla: no corrige RLS ni ownership.
- Abrir escritura pública al bucket: permitiría overwrite/delete fuera de la
  autoridad DAEMON.
- Persistir URLs completas o base64 en Firestore: acopla proveedor, aumenta
  documentos y dificulta privacidad/migración.
- Cambiar ya a Firebase Storage: puede estar bloqueado por facturación y no hay
  reglas/emuladores listos.

## Evidencia y referencias

- `frontend-angular/src/app/core/servicios/almacenamiento-archivos.ts`
- `backend-laravel/database/migrations/2026_06_28_030000_prepare_supabase_storage_bucket.php`
- `backend-laravel/database/migrations/2026_07_15_000000_create_private_storage_and_encrypt_rewards.php`
- [Supabase Storage: access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Storage: ownership](https://supabase.com/docs/guides/storage/security/ownership)
- [Firebase Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Firebase Storage: validación de condiciones](https://firebase.google.com/docs/storage/security/rules-conditions)
