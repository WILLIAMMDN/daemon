## Paquete completado

Paquete 3 — Firestore versionado y seguro.

- Estado: completado en rama; no desplegado
- Fecha: 2026-08-02
- Proyecto de pruebas: `demo-daemon-rules`
- Escrituras productivas: ninguna

### Objetivo

Convertir la autorización de Firestore en un contrato versionado, revisable y
reproducible: deny-by-default, ownership por Firebase UID, esquema v2 con
campos/tipos/límites explícitos, consultas acotadas, índices declarados y una
suite ejecutada exclusivamente contra Emulator Suite.

### Diagnóstico verificado

- `firestore.rules` existía sólo como archivo no versionado del worktree y
  permitía leer todos los cuentos a cualquier autenticado.
- Un propietario podía cambiar estado, visibilidad, contadores y cualquier
  otro campo porque no había allowlist ni `diff().affectedKeys()`.
- `cuento_comentarios` y `cuento_reacciones` aceptaban cualquier escritura de
  cualquier usuario autenticado, incluida la edición o eliminación ajena.
- El ownership de cuento usaba `firebase_uid`, pero comentarios y reacciones
  conservaban IDs numéricos de Laravel o no almacenaban UID verificable.
- Angular todavía consulta/escribe el modelo legacy y publica directamente;
  no usa aún el agregado v2 definido por ADR-002.
- Las consultas legacy reales son simples (`orderBy` o `where` de un solo
  campo) y usan índices automáticos. No había índices compuestos versionados
  para las consultas v2 de galería, borradores y comentarios.
- `firebase.json` ya apuntaba a las reglas y tenía emuladores locales por el
  Paquete 2, pero no declaraba índices ni existía una suite Rules Unit Testing.
- No se ha demostrado todavía la proyección de custom claims DAEMON ni el
  adaptador privilegiado Laravel/Firestore. Desplegar estas reglas ahora
  bloquearía el cliente legacy; por eso el deploy queda prohibido.
- El primer gate `npm run test:ci` descubrió por error la suite ESM del
  emulador como si fuera Jest Angular. Se separaron explícitamente ambos
  runners en `jest.config.js`; la repetición terminó con 22/22 suites verdes.

### Decisiones adoptadas

- El contrato aceptado es el esquema v2 de ADR-002 bajo
  `/cuentos/{cuentoId}` con subcolecciones `versiones`, `paginas`,
  `comentarios` y `reacciones`.
- Toda ruta no enumerada y las colecciones sociales legacy quedan denegadas.
- El cliente sólo puede:
  - crear atómicamente una raíz privada y su versión borrador propia;
  - editar metadata/contenido permitido de esa versión y sus páginas;
  - eliminar páginas propias mientras el cuento sigue en borrador;
  - leer borradores propios o la versión aprobada autorizada;
  - crear/reemplazar/eliminar una reacción propia con documento ID igual al
    Firebase UID.
- El cliente no puede publicar, enviar a revisión, moderar, cambiar owner,
  audiencia o visibilidad, escribir stats, XP/DAEMONS/roles, comentar
  directamente ni borrar físicamente un cuento.
- Los comentarios permanecen server-only para que Laravel aplique ownership,
  sanitización, rate limit, bloqueo y auditoría. Firestore sólo permite su
  lectura visible, autorizada y paginada.
- `request.auth.uid` es la única prueba de propiedad. `autor_usuario_id` puede
  existir como proyección, nunca como autorización.
- Las cuentas directas requieren claims compactos `daemon`, `daemonRole`,
  `daemonAudience` y `daemonClaimsVersion`. Docente/admin no reciben bypass de
  escritura cliente: las acciones privilegiadas usan servidor.
- `aula` falla cerrada si `daemonClassroomId` no coincide. Comunidad sigue
  autenticada; no se habilita lectura web anónima.
- `serverTimestamp()` se comprueba contra `request.time`. Campos extra,
  timestamps cliente, enums/tipos/longitudes inválidos y campos inmutables son
  rechazados.
- Las queries de lista deben incluir filtros compatibles con Rules y `limit`.
  Se exige `schema_version == 2` porque Security Rules no filtra resultados.
- Se declararon tres índices compuestos para las consultas v2 ejercitadas por
  la suite y exenciones para texto largo no consultable.
- Firebase CLI se fija a `15.25.1` en el comando de prueba sin incorporarlo al
  bundle ni al lockfile; `@firebase/rules-unit-testing` queda fijado a `5.0.1`.

Referencias aplicadas:

- [Reglas no son filtros y restricciones de queries](https://firebase.google.com/docs/firestore/security/rules-query)
- [Allowlist de campos y `diff().affectedKeys()`](https://firebase.google.com/docs/firestore/security/rules-fields)
- [Pruebas y cobertura en Emulator Suite](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Índices de Cloud Firestore](https://firebase.google.com/docs/firestore/query-data/indexing)

### Archivos creados

- `firestore.rules`
- `firestore.indexes.json`
- `frontend-angular/tests/firestore/firestore.rules.test.mjs`
- `docs/transformacion-estudiante/03-firestore-security.md`

La suite genera, sin versionarlos:

- `frontend-angular/reports/firestore-rules/rule-coverage.json`
- `frontend-angular/reports/firestore-rules/rule-coverage-summary.json`

### Archivos modificados

- `firebase.json`: declara reglas e índices.
- `frontend-angular/package.json`: comandos de Rules y dependencia de testing.
- `frontend-angular/package-lock.json`: fija Rules Unit Testing.
- `frontend-angular/jest.config.js`: separa la suite ESM del emulador de Jest
  Angular.
- `frontend-angular/.gitignore`: excluye reportes generados.
- `.gitignore`: excluye el log local del emulador.
- `backend-laravel/storage/framework/views/.gitignore`: evita versionar vistas
  compiladas que la suite Laravel regenera.
- `.github/workflows/frontend-ci.yml`: Java 21, ejecución Rules y artefacto de
  cobertura.
- `frontend-angular/README.md`, `docs/README.md`, `docs/qa-produccion.md` y
  `docs/transformacion-estudiante/CHANGELOG-TRANSFORMATION.md`.

### Archivos eliminados

- Ningún archivo de producto. Se limpiaron `firestore-debug.log` y una vista
  Laravel compilada, ambos artefactos generados y reproducibles.

### Comandos ejecutados

- Inspección con `git status`, `rg`, lectura de servicios/modelos/ADR y diff.
- Consulta de documentación oficial vigente de Firebase/Firestore.
- `npm view @firebase/rules-unit-testing ...`
- `npm install --save-dev --save-exact @firebase/rules-unit-testing@5.0.1`
- `npm run test:firestore-rules` con Java 23 local y Firebase CLI 15.25.1.
- Validaciones frontend/Laravel/build/diff enumeradas en la tabla de pruebas.

No se ejecutó `firebase deploy`, deploy Render, migración, seed, tinker,
consulta a PostgreSQL/Supabase ni escritura a un proyecto Firebase real.

### Pruebas

| Comando                          | Resultado       | Evidencia                                                                                                         |
| -------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `npm run test:firestore-rules`   | OK              | 31/31 escenarios sobre `demo-daemon-rules`; Emulator Suite detecta proyecto demo y bloquea servicios no emulados. |
| Cobertura Rules                  | OK              | 960/986 expresiones evaluadas (97.36%); JSON crudo y resumen generados.                                           |
| `npm run test:ci`                | OK              | 22 suites/77 tests; entorno, arquitectura, tokens y contrato visual incluidos.                                    |
| `npm run build`                  | OK con warnings | Producción compila; initial 1.29 MB y warnings previos, sin regresión atribuible al paquete.                      |
| `php artisan test --env=testing` | OK              | 139 tests/482 assertions con SQLite/mocks; no usa `.env` productivo.                                              |
| `npm run e2e:public`             | OK              | 1/1 smoke público contra `start:local`; no prueba aún Cuentos autenticado v2.                                     |
| `npm audit --omit=dev`           | OK informativo  | Exit 0 al nivel high; una vulnerabilidad baja previa de Quill sin downgrade forzado.                              |
| Prettier/diff/JSON/secret scan   | OK              | Formato, whitespace, JSON y archivos del paquete sin secretos nuevos.                                             |

Escenarios Rules cubiertos:

- no autenticado, owner, alumno distinto, docente, admin y claims obsoletos;
- create raíz/versión atómico, campos extra, `authorUid`/`autor_uid`, rol/XP,
  tipos, tamaños, enums y timestamps;
- borrador propio/ajeno, comunidad publicada y aula coincidente/no coincidente;
- estado, visibilidad, moderación, stats, schema y ownership inmutables;
- versiones y páginas propias/ajenas, edición y eliminación permitida/denegada;
- comentario válido/vacío/excesivo server-only, update/delete directos
  denegados, lectura visible/bloqueada/oculta y query paginada;
- reacción idempotente por UID, enum/campos/doc ID inválidos y delete propio/ajeno;
- queries seguras/inseguras, colecciones legacy y paths desconocidos.

### Comparación antes/después

| Antes                                                        | Después                                                                                               |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Cualquier autenticado leía todos los cuentos                 | Owner lee borrador; contenido aprobado requiere política explícita y cuenta DAEMON.                   |
| Owner podía cambiar cualquier campo del cuento               | Root de borrador sólo admite `updated_at`; contenido editable vive en versión/páginas con allowlists. |
| Comentarios/reacciones admitían escritura autenticada global | Comentarios son server-only; reacción sólo en doc cuyo ID y UID pertenecen al actor.                  |
| `firebase_uid`/ID Laravel se mezclaban como ownership        | Sólo `request.auth.uid` gobierna propiedad.                                                           |
| Cliente podía publicar y escribir contadores                 | Publicación, moderación, stats, roles, XP y eliminación del cuento son server-only.                   |
| No había límites de query ni campos                          | `hasOnly`, tipos, enums, longitudes, timestamps e invariantes fail-closed.                            |
| Reglas sin suite/cobertura                                   | 31 pruebas deterministas y cobertura de expresiones exportada en CI.                                  |
| Índices no versionados                                       | Tres contratos compuestos y dos exenciones de index fanout versionados.                               |

### Riesgos resueltos

- Escritura anónima o autenticada sin cuenta DAEMON.
- Edición/borrado de comentarios y reacciones ajenas.
- Ownership basado en IDs numéricos manipulables.
- Auto-publicación, auto-moderación y autoasignación de privilegios desde SPA.
- Manipulación de contadores, schema, owner, audiencia y timestamps.
- Lectura de borradores ajenos o de aula sin proyección coincidente.
- Queries ilimitadas que pretendían usar Rules como filtro.
- Cambios de reglas no testeados ni reproducibles en CI.

### Riesgos pendientes

- Angular sigue usando documentos/colecciones legacy y publicación/comentarios
  directos. Las reglas nuevas son un contrato de destino, no deben desplegarse
  hasta completar Paquete 4 y pruebas E2E v2.
- Laravel todavía no proyecta claims ni dispone del adaptador Admin
  Firestore/policies/idempotencia/auditoría para publicación, comentarios,
  moderación y borrado lógico.
- Los documentos reales Firestore no fueron inspeccionados ni migrados; no se
  asume su forma. Se necesita inventario read-only autorizado y migración con
  dry-run en paquete posterior.
- El límite de 100 páginas se aproxima por `orden <= 100`; Rules no garantiza
  unicidad de orden ni conteo agregado. El caso de uso debe controlarlo con
  batch/transacción.
- La cobertura de 97.36% es evaluación de expresiones del emulador, no una
  demostración de corrección de policies Laravel ni de datos productivos.
- Firebase CLI transitivo emite avisos de paquetes deprecados al ejecutarse vía
  `npx`; no afectan el bundle Angular, pero se seguirá la versión oficial.
- `npm audit` conserva una vulnerabilidad baja previa de Quill. La sugerencia
  automática implica `--force` y downgrade, prohibidos para este paquete; se
  evaluará junto con la sanitización/render de Cuentos.
- App Check no está activado. Sigue siendo defensa adicional y requiere
  staging/observación antes de enforcement.

### Bloqueos

El paquete de código no está bloqueado. El deploy de reglas sí queda bloqueado
intencionalmente hasta que existan simultáneamente:

1. repositorio Angular v2 y retirada de escrituras legacy;
2. custom claims provisionados/renovados;
3. adaptador Laravel confiable para operaciones privilegiadas;
4. migración dry-run/reconciliación de datos;
5. E2E autenticado completo en emulador/staging.

### Próximo paquete

Paquete 4 — reestructuración profesional de Cuentos. Implementará el modelo
v2, converters/repositorios/casos de uso, eliminará migración y fetch
productivos desde la SPA, y alineará guardar/publicar/comentar/reaccionar con
este contrato sin desplegar ni migrar producción.
