# DAEMON — API CRUD por módulo

Última actualización: 2026-07-06

Referencia rápida de endpoints CRUD en Laravel (`/api/v1`). Todos requieren
middleware `auth:sanctum` salvo los públicos. Los que aplican a un docente
también pasan por `role:docente,admin` y `AcademicScopeService` para limitar
el alcance por aula.

Convención de rate limiting aplicada: `throttle:5,1` para escrituras
sensibles (crear/eliminar) y `throttle:10,1` para lecturas o mutaciones
ligeras.

## 1. Misiones

| Método | Ruta                              | Roles               | Descripción                                         |
| ------ | --------------------------------- | ------------------- | --------------------------------------------------- |
| GET    | `/misiones`                       | auth                | Lista misiones activas filtradas por nivel alumno. |
| GET    | `/misiones/{mision}`              | auth                | Detalle + última entrega del alumno.                |
| POST   | `/misiones`                       | docente, admin      | Crear misión.                                       |
| PUT    | `/misiones/{mision}`              | docente, admin      | Actualizar misión (título, recompensa, etc.).      |
| DELETE | `/misiones/{mision}`              | docente, admin      | Borrar misión + cascade en `entregas`.              |
| POST   | `/misiones/{mision}/entregar`     | alumno              | Alumno entrega evidencia.                           |
| GET    | `/misiones/entregas`              | docente, admin      | Bandeja de entregas con alcance académico.          |
| POST   | `/misiones/entregas/{id}/revisar` | docente, admin      | Aprobar/rechazar entrega.                          |

## 2. Tienda (premios y canjes)

| Método | Ruta                            | Roles          | Descripción                                       |
| ------ | ------------------------------- | -------------- | ------------------------------------------------- |
| GET    | `/tienda`                       | alumno         | Premios visibles para el nivel del alumno + saldo. |
| GET    | `/tienda/canjes`                | alumno         | Historial de canjes del alumno logueado.          |
| POST   | `/tienda/canjear/{premio}`      | alumno         | Canjear premio (descuenta tokens).                |
| GET    | `/tienda/administrar`           | docente, admin | Vista admin: premios + canjes por alcance.        |
| POST   | `/tienda/premios`               | docente, admin | Crear premio (imagen vía `ArchivoService`).       |
| PUT    | `/tienda/premios/{premio}`      | docente, admin | Actualizar premio (incluye cambio de stock).      |
| DELETE | `/tienda/premios/{premio}`      | docente, admin | Eliminar premio.                                  |
| POST   | `/tienda/canjes/{canje}/entregar` | docente, admin | Marcar canje como entregado.                    |

## 3. Evaluaciones

| Método | Ruta                                | Roles          | Descripción                          |
| ------ | ----------------------------------- | -------------- | ------------------------------------ |
| GET    | `/evaluaciones/activas`             | alumno         | Evaluaciones activas para responder. |
| POST   | `/evaluaciones/{id}/responder`      | alumno         | Alumno responde.                     |
| GET    | `/evaluaciones/resultados`          | auth           | Resultados propios.                  |
| GET    | `/evaluaciones`                     | docente, admin | Listar evaluaciones propias.         |
| POST   | `/evaluaciones`                     | docente, admin | Crear evaluación (estado `borrador`).|
| PUT    | `/evaluaciones/{evaluacion}`        | docente, admin | Editar evaluación.                   |
| DELETE | `/evaluaciones/{evaluacion}`        | docente, admin | Eliminar evaluación.                 |
| POST   | `/evaluaciones/{id}/preguntas`      | docente, admin | Guardar preguntas (replace).        |
| POST   | `/evaluaciones/{id}/publicar`       | docente, admin | Cambiar `borrador → activa`.         |

## 4. Insignias

| Método | Ruta                                  | Roles          | Descripción                                  |
| ------ | ------------------------------------- | -------------- | -------------------------------------------- |
| GET    | `/docente/insignias`                  | docente, admin | Listar insignias.                            |
| POST   | `/docente/insignias`                  | docente, admin | Crear insignia (imagen por upload o ruta).  |
| PUT    | `/docente/insignias/{insignia}`       | docente, admin | Actualizar insignia.                         |
| DELETE | `/docente/insignias/{insignia}`       | docente, admin | Eliminar insignia.                           |
| POST   | `/docente/insignias/asignar`          | docente, admin | Asignar o revocar insignia a alumno.         |

## 5. Aulas

| Método | Ruta                                | Roles          | Descripción                          |
| ------ | ----------------------------------- | -------------- | ------------------------------------ |
| GET    | `/docente/aulas`                    | docente, admin | Aulas en alcance del docente.        |
| POST   | `/docente/aulas`                    | docente, admin | Crear aula (nombre + nivel).         |
| PUT    | `/docente/aulas/{aula}`             | docente, admin | Editar aula.                         |
| DELETE | `/docente/aulas/{aula}`             | docente, admin | Eliminar aula (sin alumnos asignados).|
| PATCH  | `/docente/usuarios/{usuario}/aula`  | docente, admin | Mover usuario a un aula.             |

## 6. Cuentos

| Método | Ruta                            | Roles          | Descripción                                  |
| ------ | ------------------------------- | -------------- | -------------------------------------------- |
| GET    | `/cuentos`                      | auth           | Galería pública de cuentos publicados.       |
| GET    | `/cuentos/{cuento}`             | auth           | Detalle del cuento.                          |
| GET    | `/cuentos/mio/actual`           | alumno         | Cuento actual del alumno (borrador).         |
| POST   | `/cuentos`                      | alumno         | Guardar cuento (estado publicado o borrador). |
| GET    | `/cuentos/admin`                | docente, admin | Bandeja admin con todos los cuentos.         |
| PUT    | `/cuentos/{cuento}`             | docente, admin | Admin edita cualquier cuento.                |
| DELETE | `/cuentos/{cuento}`             | docente, admin | Admin elimina cuento.                        |
| POST   | `/cuentos/{cuento}/publicar`    | docente, admin | Cambiar estado `borrador → publicado`.       |

## 7. Comunidad

| Método | Ruta                          | Roles  | Descripción                          |
| ------ | ----------------------------- | ------ | ------------------------------------ |
| GET    | `/comunidad`                  | auth   | Feed de la comunidad (público).      |
| POST   | `/comunidad`                  | alumno | Publicar mensaje.                    |
| DELETE | `/comunidad/{mensaje}`        | alumno, docente, admin | Borrar mensaje propio / alcance. |

## 8. Reglas comunes

- Toda respuesta de error sigue el formato JSON `{ "message": "..." }`.
- Los IDs son `int` auto-incrementales. `legacy_*` se preserva cuando
  corresponde y se documenta en `docs/supabase-postgres.md`.
- `ArchivoService.guardarRuta()` aplica allowlist MIME (`image/png`,
  `image/jpeg`, `image/webp`, `image/svg+xml`, `application/pdf`),
  tamaño máximo 8MB y ruta `uploads/{tipo}/{entidadId}/{uuid}.{ext}`.
- Cualquier endpoint nuevo debe incluir FormRequest con `authorize()` y al
  menos un test feature que valide happy path + 403 por alcance.

## 9. Pendientes próximos (referencia)

Estos endpoints están pendientes de implementar o documentar en commits
posteriores de este roadmap (ver `docs/crud-roadmap.md`):

- `POST /misiones/bulk-destroy` (commit 9)
- `POST /evaluaciones/{id}/publicar` (commit 8)
- `PUT /docente/aulas/{aula}` y `DELETE /docente/aulas/{aula}` (commit 5)
- `GET /cuentos/admin` y CRUD admin de cuentos (commit 6)
- Filtros en `/tienda/administrar` (commit 7)