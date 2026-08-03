# ADR-003: Autorización y límites de confianza en Firestore

- Estado: Aceptado
- Fecha: 2026-08-02
- Depende de: ADR-001 y ADR-002
- Implementación: Paquete 3; no desplegar reglas desde esta rama

## Contexto

Angular accede hoy a Firestore con Firebase Auth, pero las reglas presentes en
el worktree permiten a cualquier usuario autenticado leer todos los cuentos y
escribir cualquier comentario o reacción. El ownership de cuentos nuevos usa
`firebase_uid`, mientras consultas y documentos sociales todavía usan IDs
numéricos de Laravel o no guardan UID. No hay pruebas versionadas de reglas ni
índices declarados para las consultas reales.

Los guards y datos de sesión Angular no autorizan Firestore. Las reglas solo
pueden confiar en el token verificado de Firebase, en datos ya protegidos y en
la escritura solicitada. El Admin SDK o una integración de servidor equivalente
elude Security Rules, por lo que Laravel debe aplicar sus propias policies.

## Decisión

Se adopta autorización en profundidad:

1. Firebase Auth acredita identidad y `request.auth.uid` gobierna ownership.
2. Firestore Security Rules v2 protegen toda operación directa del cliente con
   deny-by-default, allowlists de campos, tipos, límites e invariantes.
3. Laravel/PostgreSQL conserva roles, audiencia, aula, moderación y auditoría.
4. Claims mínimos proyectan permisos necesarios para lecturas directas, pero no
   se convierten en la fuente canónica.
5. Laravel ejecuta las transiciones privilegiadas con credencial de servidor,
   policy, idempotencia y registro de actor.
6. App Check se usa como defensa contra clientes no legítimos, nunca como
   sustituto de Auth, Rules, rate limiting o autorización.

## Identidad y claims

El documento de cuento usa un `authorUid` conceptual, persistido como
`autor_uid` por coherencia con el contrato actual en español. Debe ser igual a
`request.auth.uid` al crear y permanecer inmutable.

Laravel puede proyectar claims compactos como:

- `daemon`: cuenta DAEMON enlazada y activa;
- `daemonRole`: rol actual;
- `daemonAudience`: `KIDS` o `TEENS` para estudiantes;
- `daemonClassroomId`: aula primaria cuando aplique;
- `daemonClaimsVersion`: versión de autorización.

Solo un entorno privilegiado crea claims. No contienen PII, saldo, XP, listas
grandes ni decisiones permanentes. Un cambio de rol/aula revoca sesiones cuando
sea necesario y fuerza renovación del ID token. Para una acción de alto riesgo,
Laravel vuelve a consultar PostgreSQL aunque el claim exista.

## Matriz de operaciones

| Operación                              | Cliente directo          | Servidor Laravel           | Regla principal                                                                                               |
| -------------------------------------- | ------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Crear raíz y versión borrador          | Sí, mediante batch       | Opcional para recuperación | Usuario DAEMON, `autor_uid=request.auth.uid`, estado privado inicial y campos permitidos.                     |
| Leer borrador propio                   | Sí                       | Sí                         | Solo owner.                                                                                                   |
| Editar versión borrador propia         | Sí                       | Sí                         | Owner, versión editable, ownership/estado inmutables y timestamp confiable.                                   |
| Enviar a revisión                      | No                       | Sí                         | Policy de alumno, audiencia vigente, validación/sanitización e idempotency key.                               |
| Aprobar, rechazar, publicar o archivar | No                       | Sí                         | Policy docente/admin/moderador, auditoría y transición válida.                                                |
| Leer versión publicada de aula         | Sí                       | Sí                         | Cuenta DAEMON, estado publicado y aula del token coincidente; si falta proyección, denegar.                   |
| Leer versión publicada de comunidad    | Sí, autenticado          | Sí                         | Cuenta DAEMON y política de visibilidad explícita; no equivale a acceso web anónimo.                          |
| Crear/editar comentario                | No en la primera versión | Sí                         | Laravel aplica propiedad, longitud, sanitización, rate limit y bloqueo de comentarios; persiste en Firestore. |
| Leer comentarios                       | Sí, paginado             | Sí                         | Debe poder leer el cuento y `comentarios_bloqueados=false`.                                                   |
| Crear o reemplazar reacción propia     | Sí                       | Sí                         | Doc ID igual al UID, enum cerrado y campos exactos.                                                           |
| Eliminar reacción propia               | Sí                       | Sí                         | Doc ID/owner igual al UID.                                                                                    |
| Modificar contadores o moderación      | No                       | Sí                         | Campo reservado al servidor.                                                                                  |
| Borrado lógico de cuento               | No                       | Sí                         | Ownership/policy, idempotencia, auditoría y coordinación con Storage.                                         |
| Purga física y cambio de owner         | No                       | Sí                         | Flujo administrativo/privacidad aprobado.                                                                     |

Los comentarios se enrutan por Laravel porque el flujo real exige
anti-spam/rate limiting, sanitización y bloqueo moderado que las reglas no pueden
resolver consultando historial arbitrario. La lectura permanece directa para no
convertir Laravel en proxy de consultas simples.

## Contrato de reglas

Las reglas del Paquete 3 deben:

- declarar `rules_version = '2'` y denegar cualquier path no enumerado;
- exigir `request.auth` y el claim `daemon` donde corresponda;
- usar `keys().hasOnly(...)` en create/update para raíces, versiones, páginas,
  comentarios y reacciones;
- validar tipos, longitudes, enums, cantidad máxima de páginas/configuración y
  tamaño razonable de cada documento;
- exigir timestamps de servidor comparables con `request.time`;
- impedir mutar `autor_uid`, `schema_version`, referencias de publicación,
  moderación, stats, audiencia y mapeos legados desde el cliente;
- permitir editar únicamente la versión señalada como borrador y perteneciente
  al usuario;
- validar las diferencias de update con `diff().affectedKeys()`;
- impedir que la creación asigne estado publicado, visibilidad comunitaria,
  rol, XP, DAEMONS o contadores;
- acoplar cada query permitida a filtros compatibles con la regla. Las reglas
  no filtran resultados después de ejecutar una consulta;
- rechazar lecturas completas de borradores o comentarios sin límite/orden
  cuando la consulta requiera paginación;
- mantener comentarios server-only en la primera implementación;
- validar reacciones por ID determinista y enum cerrado;
- no depender de Cloud Functions para ningún flujo principal.

`serverTimestamp()` se usa en el cliente; las reglas verifican el valor
resuelto contra `request.time`. Los converters rechazan timestamps/fields
desconocidos, pero esa validación cliente es complementaria.

## Policies Laravel para escrituras privilegiadas

Toda operación Firestore de servidor debe:

1. validar Firebase ID token/Sanctum y resolver el usuario por `firebase_uid`;
2. consultar rol, audiencia, aula y estado en PostgreSQL;
3. validar el comando con Form Request/DTO;
4. comprobar transición, ownership y versión esperada;
5. usar una idempotency key para publicación/eliminación;
6. escribir con credenciales de alcance mínimo;
7. registrar actor, acción, motivo, story ID anonimizable y correlation ID sin
   copiar el cuerpo del cuento a logs;
8. devolver un error consistente sin filtrar credenciales ni URLs firmadas.

## App Check

App Check para web con reCAPTCHA Enterprise se habilita por entorno después de
observar métricas y registrar los orígenes correctos. Primero se prueba en
emulador/staging; la enforcement de producción es un cambio operativo separado.
Los debug tokens nunca se versionan. App Check reduce abuso de clientes falsos,
pero un usuario legítimo malicioso sigue requiriendo Rules y rate limiting.

## Pruebas obligatorias en Emulator Suite

Las pruebas usan `@firebase/rules-unit-testing`, datos sintéticos y proyectos
aislados. Deben cubrir al menos:

- no autenticado;
- alumno propietario y alumno diferente;
- docente y administrador, incluidos claims obsoletos;
- documento con campo extra;
- `autor_uid`/`authorUid` manipulado;
- estado, visibilidad, moderación o stats manipulados;
- timestamp y tipo inválidos;
- lectura de borrador ajeno y propio;
- lectura de cuento publicado autorizado/no autorizado;
- actualización de campos inmutables;
- comentario directo denegado, vacío y excesivo;
- comentario server-side bloqueado por policy en pruebas Laravel;
- reacción válida, tipo inválido, duplicado idempotente y doc ID ajeno;
- eliminación de reacción propia permitida y ajena denegada;
- borrado directo de cuento denegado;
- queries de galería, borradores y comentarios con filtros/índices esperados;
- denegación de paths no declarados.

El Paquete 3 genera reporte de cobertura de reglas y `firestore.indexes.json`
desde las consultas implementadas, no desde supuestos.

## Evidencia de implementación del Paquete 3

- `firestore.rules` implementa el agregado v2, deny-by-default, UID, claims,
  allowlists, timestamps y operaciones server-only descritas aquí.
- `firestore.indexes.json` versiona los contratos de queries v2.
- `frontend-angular/tests/firestore/firestore.rules.test.mjs` cubre 31
  escenarios y exporta cobertura del Emulator Suite.
- Resultado local: 31/31 pruebas y 960/986 expresiones evaluadas (97.36%).
- Las reglas no fueron desplegadas. El despliegue queda bloqueado hasta migrar
  el cliente legacy, provisionar claims y completar el control plane Laravel.

## Consecuencias

### Positivas

- El ID numérico manipulable deja de autorizar ownership.
- Publicación, moderación, XP, roles y borrado definitivo quedan fuera del
  cliente.
- Las reglas y consultas se vuelven versionables y reproducibles.

### Costes

- Se necesita sincronización de claims y un adaptador Firestore de servidor.
- Comentarios requieren una ida a Laravel antes de aparecer en el listener.
- La política de aula debe fallar cerrada mientras el claim/proyección no exista.

## Alternativas descartadas

- Confiar en guards Angular o `Sesion.usuario().id`: son controles de UX.
- Permitir comentarios directos y resolver spam solo en UI: no es verificable.
- Confiar solo en App Check: no demuestra ownership ni rol.
- Usar Cloud Functions como requisito: Blaze no está habilitado.

## Referencias oficiales

- [Firestore Security Rules: primeros pasos](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore: las consultas deben satisfacer las reglas](https://firebase.google.com/docs/firestore/security/rules-query)
- [Probar reglas con Emulator Suite](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Firebase Auth: custom claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firebase App Check para web](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
