---
title: ADR-001: Autoridad de datos por dominio
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# ADR-001: Autoridad de datos por dominio

- Estado: Aceptado
- Fecha: 2026-08-02
- Alcance: DAEMON completo
- Decisores: propietario del producto y arquitectura principal
- Implementación: progresiva; este ADR no migra datos ni cambia producción

## Contexto

DAEMON usa Firebase Auth, Laravel/Sanctum, PostgreSQL en Supabase, Firestore y
Supabase Storage. El sistema necesita una sola fuente canónica por entidad para
evitar divergencias, escrituras dobles y autorizaciones basadas en copias
desactualizadas.

Una fuente canónica es el sistema en el que se acepta la escritura de negocio y
desde el que se reconstruyen las proyecciones. Un caché, claim, contador,
snapshot para UI o transporte en tiempo real nunca adquiere autoridad por
contener una copia.

## Decisión

Firebase Auth es la autoridad de identidad. Laravel y PostgreSQL son la
autoridad de autorización de aplicación y de los dominios académicos,
económicos, familiares, administrativos y de privacidad. Firestore es la
autoridad del agregado de cuentos y su colaboración. Supabase Storage conserva
los bytes de archivos de negocio; su metadata y política pertenecen al dominio
que referencia esos bytes.

| Entidad                           | Fuente canónica                                                             | Lectores                                                       | Escritores                                                             | Tiempo real                       | Justificación                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Identidad                         | Firebase Auth                                                               | Angular, Laravel                                               | Firebase Auth; administración privilegiada desde Laravel               | Estado de sesión de Firebase      | Proveedores, credenciales, verificación de correo y recuperación pertenecen al IdP.                                       |
| Usuario DAEMON                    | PostgreSQL mediante Laravel                                                 | Laravel; Angular por API                                       | Laravel                                                                | No requerido                      | `usuarios` enlaza `firebase_uid` con la cuenta de negocio y no se reemplaza por un documento Firebase.                    |
| Rol                               | PostgreSQL mediante Laravel                                                 | Laravel; Angular por API; Firestore mediante claim proyectado  | Laravel; el servidor sincroniza claims derivados                       | Al renovar el token               | El rol gobierna permisos DAEMON. Un custom claim es una proyección revocable, no la autoridad.                            |
| Perfil                            | PostgreSQL mediante Laravel                                                 | Laravel; Angular por API                                       | Laravel                                                                | No requerido                      | Biografía, avatar, preferencias y estado del perfil forman parte de la cuenta DAEMON.                                     |
| Curso/aula                        | PostgreSQL mediante Laravel                                                 | Laravel; Angular por API                                       | Laravel con rol autorizado                                             | Pusher solo si una UI lo necesita | Es información académica relacional y transaccional.                                                                      |
| Matrícula                         | PostgreSQL mediante Laravel                                                 | Laravel; Angular por API                                       | Laravel                                                                | Pusher opcional                   | La pertenencia a un aula no puede decidirse desde el cliente ni desde Firestore.                                          |
| Misión                            | PostgreSQL mediante Laravel                                                 | Laravel; Angular por API                                       | Laravel/docente/admin                                                  | Pusher opcional                   | Sus reglas y recompensas están ligadas a evaluación y gamificación.                                                       |
| Entrega                           | PostgreSQL mediante Laravel                                                 | Laravel; alumno/docente por API                                | Laravel dentro de transacciones                                        | Pusher para cambio de estado      | El estado académico y la evidencia requieren trazabilidad y autorización central.                                         |
| Evaluación                        | PostgreSQL mediante Laravel                                                 | Laravel; Angular por API                                       | Laravel                                                                | Pusher opcional                   | Puntaje, aprobación e impacto académico son transaccionales.                                                              |
| XP                                | PostgreSQL (`usuarios.experiencia` y ledger)                                | Laravel; Angular por API                                       | `GamificacionService`                                                  | Pusher para refresco visual       | Es progreso permanente y solo cambia por reglas académicas idempotentes.                                                  |
| DAEMONS                           | PostgreSQL (`usuarios.tokens` y ledger)                                     | Laravel; Angular por API                                       | Servicios económicos de Laravel                                        | Pusher para refresco visual       | Es saldo gastable; canjes y recompensas exigen transacción y auditoría.                                                   |
| Cuento                            | Firestore                                                                   | Angular; Laravel mediante adaptador confiable                  | Autor en borrador bajo reglas; Laravel para transiciones privilegiadas | Listener Firestore                | Es contenido colaborativo/documental. PostgreSQL queda como origen legado durante la migración, no como segundo escritor. |
| Página de cuento                  | Firestore, dentro de una versión del cuento                                 | Angular; Laravel mediante adaptador                            | Autor sobre borrador; publicación desde Laravel                        | Listener Firestore                | Debe versionarse junto al cuento sin columnas fijas `data_1..data_6`.                                                     |
| Comentario de cuento              | Firestore, subcolección del cuento                                          | Usuarios autorizados y moderadores                             | Laravel valida al autor y escribe Firestore; moderación desde Laravel  | Listener Firestore                | Requiere tiempo real, ownership por UID, sanitización, rate limiting y moderación.                                        |
| Reacción de cuento                | Firestore, documento determinista por UID                                   | Usuarios autorizados                                           | Usuario autenticado bajo reglas                                        | Listener o lectura agregada       | Una reacción por usuario se modela idempotentemente sin tocar la economía.                                                |
| Archivo de negocio                | Supabase Storage para bytes; PostgreSQL para reserva, ownership y auditoría | Laravel; Angular mediante URL pública o firmada                | Laravel o URL de subida acotada emitida por Laravel                    | No requerido                      | Firestore guarda referencias, nunca blobs/base64 ni credenciales de Storage.                                              |
| Notificación persistente          | PostgreSQL mediante Laravel                                                 | Laravel; Angular por API                                       | Laravel                                                                | Pusher/Echo como transporte       | La entrega en tiempo real no sustituye historial, lectura ni retención.                                                   |
| Configuración KIDS/TEENS          | PostgreSQL mediante Laravel                                                 | Laravel; Angular por API; Firestore mediante proyección mínima | Laravel/admin                                                          | Al renovar sesión/configuración   | `nivel` es audiencia, no rol. Privacidad y capacidades deben fallar de forma conservadora.                                |
| Consentimiento y vínculo familiar | PostgreSQL mediante Laravel                                                 | Laravel; usuarios autorizados por API                          | Laravel                                                                | No requerido                      | Incluye cifrado, HMAC, aceptación explícita, retención y auditoría.                                                       |
| Moderación y reportes             | PostgreSQL mediante Laravel; estado proyectado en Firestore                 | Moderadores; Angular según permiso                             | Laravel                                                                | Pusher o actualización Firestore  | La decisión y el actor se auditan relacionalmente; Firestore solo expone el estado necesario del cuento.                  |

## Invariantes

1. Cada comando de negocio escribe primero y únicamente en su fuente canónica.
2. No se introduce dual-write Firestore/PostgreSQL para cuentos.
3. `firebase_uid` identifica ownership en Firebase. El ID numérico de
   `usuarios` es una referencia de negocio y nunca autoriza una regla cliente.
4. Claims, contadores, nombres de autor, avatares y estados proyectados pueden
   regenerarse desde su autoridad.
5. El Admin SDK y las credenciales de servicio eluden reglas cliente; por ello
   cada operación Laravel debe repetir autenticación, autorización, validación
   y auditoría.
6. Los archivos se referencian por bucket y object key. Las URLs firmadas son
   efímeras y las URLs públicas son una presentación, no un identificador.

## Transición

- ADR-002 define el estrangulamiento del dominio de cuentos y los endpoints
  Laravel que deben conservarse.
- ADR-003 define la autorización Firestore y sus pruebas en emulador.
- ADR-004 define la abstracción y el ciclo de vida de archivos.
- ADR-005 define las restricciones KIDS/TEENS.
- ADR-006 impide que desarrollo y pruebas usen autoridades de producción.
- Ninguna fuente legada se elimina hasta inventariar consumidores, migrar datos,
  comparar resultados y disponer de rollback probado.

## Consecuencias

### Positivas

- Se elimina la ambigüedad de ownership y reconciliación.
- Las transacciones académicas y económicas permanecen en Laravel/PostgreSQL.
- Cuentos obtiene un modelo documental y tiempo real sin convertir Firebase en
  la base de negocio completa.

### Costes

- Laravel necesita un adaptador confiable de Firestore para moderación,
  privacidad y compatibilidad de endpoints.
- Claims y proyecciones requieren sincronización, expiración y pruebas.
- La migración de cuentos debe convivir temporalmente con datos PostgreSQL
  legados sin aceptar escrituras en ambos destinos.

## Alternativas descartadas

- Mover todas las entidades a Firebase: rompe transacciones, relaciones y la
  autoridad Laravel ya establecida.
- Mantener cuentos mutables en PostgreSQL y Firestore: no existe transacción
  atómica entre ambos y produce divergencia inevitable.
- Usar el ID numérico de Laravel como identidad Firestore: el cliente puede
  conocerlo, pero Firestore autentica y autoriza con `request.auth.uid`.

## Evidencia local

- `docs/ai-project-context.md`
- `docs/firebase-auth.md`
- `docs/supabase-postgres.md`
- `docs/gamificacion-xp-daemons.md`
- `docs/privacidad-kids-teens.md`
- `frontend-angular/src/app/features/cuentos/services/cuento.ts`
- `backend-laravel/app/Services/Cuento/CuentoService.php`

## Referencias oficiales

- [Firebase: custom claims y Security Rules](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore: estructurar datos](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Supabase Storage: control de acceso con RLS](https://supabase.com/docs/guides/storage/security/access-control)
