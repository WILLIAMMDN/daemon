---
title: DAEMON Business Rules
status: canonical
normative: true
version: 1.0
owner: product
phase: FND-3B
created: 2026-08-06
last_reviewed: 2026-08-06
approved_on: 2026-08-06
applies_to: product
approvals:
  project-owner: approved
  product-reviewer: approved
supersedes: null
---

# DAEMON Business Rules

## 1. Autoridad, propósito y alcance

1. Este documento es el **catálogo canónico de reglas de negocio del
   dominio Producto** de DAEMON. Fue aprobado y activado en FND-3B.
2. Registra las reglas verificadas o documentadas que no deben romperse,
   con evidencia y estado.
3. Está subordinado a la Constitución General del Proyecto y complementa
   `product-overview.md` (autoridad canónica raíz del dominio Producto):
   allí se definen actores, experiencias y capacidades; aquí se definen las
   reglas de negocio.
4. Las reglas conservan sus estados individuales: `verified`, `accepted`,
   `partial`, `pending`, `unknown`, `deprecated`. Activar el documento no
   convierte automáticamente `partial` en `verified`, `pending` en
   `accepted` ni `unknown` en resuelto.
5. Las incertidumbres registradas (UNK-001..UNK-010), la desviación de
   identidad UNK-009 y los GAP abiertos (GAP-005, GAP-009) permanecen
   abiertos; esta activación no resuelve ninguna incertidumbre.

## 2. Convención de reglas

Cada regla usa:

- identificador estable `BR-XXX`;
- campos: Regla, Dominio, Actores, Precondiciones, Disparador, Resultado
  esperado, Datos afectados, Autoridad, Excepciones, Fuente, Tipo de
  evidencia, Estado, Riesgo si se incumple;
- estados permitidos: `verified`, `accepted`, `partial`, `pending`,
  `unknown`, `deprecated`;
- tipos de evidencia permitidos: `Constitutional rule`, `Accepted ADR`,
  `Verified code`, `Verified data model`, `Active documentation`,
  `Future dependency`, `Unknown`.

Cuando no aplique un campo, se usa "No aplica". Cuando no exista evidencia,
se usa `Estado: unknown` y `Fuente: evidencia insuficiente`, registrando la
dependencia necesaria.

Una regla marcada `Tipo de evidencia: Verified code` debe citar al menos un
artefacto técnico concreto (archivo, clase, servicio, controlador, modelo,
migración, middleware, ruta, validador, comando o configuración vigente).

## 3. Identidad, usuarios y perfiles

### BR-001 — Firebase Auth es la autoridad normativa de identidad; existe un login local no resuelto

- Regla: Firebase Auth es la autoridad normativa de identidad aprobada por
  ADR-001 (credenciales Firebase, verificación de correo, Google). Laravel
  valida los tokens Firebase y emite sesiones Sanctum. Existe además un
  flujo local observado en `/auth/login` que valida `usuarios.password_hash`;
  ese flujo NO constituye una segunda autoridad normativa aprobada: es una
  desviación técnica o contradicción pendiente de decisión (UNK-009).
- Dominio: Identidad
- Actores: Todos
- Precondiciones: Cuenta existente
- Disparador: Inicio de sesión
- Resultado esperado: Sesión válida tras validación
- Datos afectados: `usuarios.firebase_uid`, `usuarios.password_hash`
- Autoridad: Firebase Auth, según ADR-001
- Desviación observada: `/auth/login` valida credenciales locales
  almacenadas en PostgreSQL mediante `AutenticacionService::intentarLogin`
- Excepciones: No aplica
- Fuente: ADR-001, firebase-auth.md,
  `app/Services/Auth/AutenticacionService.php` (línea 21, `Hash::check`
  sobre `usuarios.password_hash`)
- Tipo de evidencia: Accepted ADR
- Estado: partial
- Riesgo si se incumple: Dos rutas de identidad sin autoridad normativa
  única; desviación pendiente (UNK-009, FND-4/FND-5 + decisión del
  propietario)

### BR-002 — Autorización efectiva en Laravel

- Regla: La autorización efectiva (roles y permisos) la aplica el backend
  mediante middleware `role:*`; el frontend no es frontera de seguridad.
- Dominio: Autorización
- Actores: Todos
- Precondiciones: Sesión Sanctum válida
- Disparador: Acceso a rutas protegidas
- Resultado esperado: Operación permitida solo al rol autorizado
- Datos afectados: Acceso a rutas API
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `app/Http/Middleware/EnsureRole.php`, rutas API (`role:*`),
  Constitución §11
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Escalada de privilegios

### BR-003 — `rol` y `nivel` son conceptos separados

- Regla: `usuarios.rol` (`alumno`, `docente`, `admin`, `tutor`) y
  `usuarios.nivel` (`KIDS`, `TEENS`) son independientes y no deben
  confundirse.
- Dominio: Identidad
- Actores: Todos
- Precondiciones: No aplica
- Disparador: Creación o actualización de usuario
- Resultado esperado: Rol y nivel se tratan por separado
- Datos afectados: `usuarios.rol`, `usuarios.nivel`
- Autoridad: Laravel
- Excepciones: Valores históricos `PRO`/`DOCENTE` normalizados a TEENS sin
  cambiar el rol (migración
  `2026_07_14_000000_normalize_student_levels.php`)
- Fuente: `app/Models/Usuario.php`, migración `normalize_student_levels`,
  `app/Enums/NivelAlumno.php`, ADR-005
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Confusión de permisos y experiencia

### BR-004 — El perfil no es una fuente de autoridad

- Regla: Los atributos del perfil (biografía, avatar, preferencias) son
  personales y no otorgan permisos.
- Dominio: Identidad
- Actores: Estudiante, docente
- Precondiciones: Sesión válida
- Disparador: Edición de perfil
- Resultado esperado: Actualización de perfil sin cambios de autorización
- Datos afectados: `usuarios` (perfil)
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `AlumnoController::actualizarPerfil`,
  `app/Services/Alumno/AlumnoService.php`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Autorización derivada de datos personales

## 4. Roles, permisos y autorización

### BR-005 — Permisos por rol verificados

- Regla: Los permisos se otorgan por rol (`alumno`, `docente`, `admin`,
  `tutor`) y se verifican con middleware `role:*`.
- Dominio: Autorización
- Actores: Todos
- Precondiciones: Sesión válida
- Disparador: Solicitud a rutas con restricción de rol
- Resultado esperado: 403 si el rol no aplica
- Datos afectados: Acceso a API
- Autoridad: Laravel
- Excepciones: `docente,admin` comparten grupos administrativos
- Fuente: `routes/api.php`, `app/Http/Middleware/EnsureRole.php`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Acceso no autorizado

### BR-006 — KIDS y TEENS no son roles

- Regla: KIDS y TEENS son variantes de experiencia del estudiante; no
  otorgan permisos administrativos.
- Dominio: Autorización
- Actores: Estudiante
- Precondiciones: No aplica
- Disparador: No aplica
- Resultado esperado: El nivel no determina el rol
- Datos afectados: No aplica
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: Constitución §12, ADR-005, `app/Enums/NivelAlumno.php`
- Tipo de evidencia: Constitutional rule
- Estado: verified
- Riesgo si se incumple: Escalada de permisos por nivel

## 5. KIDS y TEENS

### BR-007 — Una única base compartida

- Regla: KIDS y TEENS comparten código, arquitectura, datos, rutas y
  componentes base; las diferencias se expresan con configuración y tokens.
- Dominio: Experiencia
- Actores: Estudiante
- Precondiciones: No aplica
- Disparador: No aplica
- Resultado esperado: Sin duplicación de producto por audiencia
- Datos afectados: No aplica
- Autoridad: Constitución + diseño
- Excepciones: Variación de tono, densidad y presentación
- Fuente: Constitución §12, ADR-005, `tema-portal-alumno.ts`
- Tipo de evidencia: Constitutional rule
- Estado: verified
- Riesgo si se incumple: Duplicación de producto

### BR-008 — Ninguna variante rompe seguridad ni reglas de negocio

- Regla: Las variantes KIDS/TEENS no pueden alterar seguridad, datos ni
  reglas de negocio.
- Dominio: Experiencia
- Actores: Estudiante
- Precondiciones: No aplica
- Disparador: No aplica
- Resultado esperado: Reglas de negocio invariantes en ambas variantes
- Datos afectados: No aplica
- Autoridad: Constitución
- Excepciones: No aplica
- Fuente: Constitución §12
- Tipo de evidencia: Constitutional rule
- Estado: verified
- Riesgo si se incumple: Reglas divergentes por variante

## 6. Registro, acceso y recuperación

### BR-009 — Registro con verificación de correo (enforcement parcial)

- Regla: El registro con correo crea la cuenta y dispara el envío de
  verificación; el correo queda pendiente de verificación. No se verificó un
  middleware de backend que bloquee funciones específicas hasta verificar el
  correo: el estado se sincroniza en `email_verified_at` y la UI muestra un
  banner de verificación.
- Dominio: Acceso
- Actores: Visitante
- Precondiciones: No aplica
- Disparador: Registro
- Resultado esperado: Cuenta creada; envío de verificación en background
- Datos afectados: `usuarios`, `email_verified_at`
- Autoridad: Firebase Auth + Laravel
- Excepciones: Login Google con perfil pendiente (marca verificado)
- Fuente: `AutenticacionService::registrarAlumno`,
  `app/Services/Auth/EmailVerificationService.php`,
  `app/Http/Middleware/` (sin middleware de enforcement verificado)
- Tipo de evidencia: Verified code
- Estado: partial
- Riesgo si se incumple: Funciones críticas accesibles sin verificación;
  depende de qué restricciones aplique la UI (UNK-010)

### BR-010 — Recuperación de cuenta vía Firebase

- Regla: La recuperación de contraseña usa Firebase
  `sendPasswordResetEmail` (frontend); el endpoint Laravel de recuperación
  delega en Firebase y sincroniza la clave local.
- Dominio: Acceso
- Actores: Usuario
- Precondiciones: Correo registrado
- Disparador: Solicitud de recuperación
- Resultado esperado: Correo de restablecimiento enviado por Firebase
- Datos afectados: `usuarios.password_hash`
- Autoridad: Firebase Auth
- Excepciones: No aplica
- Fuente: `RecuperacionClaveService.php`, `recuperar-clave`, AGENTS.md
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Flujo de recuperación roto

## 7. Cursos, matrículas y aulas

### BR-011 — Currículo por períodos, cursos, unidades y lecciones

- Regla: El currículo se estructura en períodos, cursos, unidades y
  lecciones publicables; el docente y el administrador los gestionan.
- Dominio: Académico
- Actores: Docente, administrador
- Precondiciones: Rol autorizado
- Disparador: Creación/edición de contenidos
- Resultado esperado: Contenido publicado en el catálogo
- Datos afectados: Tablas académicas
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `AcademicoController`, rutas `/academico`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Currículo inconsistente

### BR-012 — Matrícula y asignación a aula

- Regla: La matrícula de un usuario a un aula la ejecuta el docente o el
  administrador mediante el backend.
- Dominio: Académico
- Actores: Docente, administrador
- Precondiciones: Aula y usuario existentes
- Disparador: Matriculación
- Resultado esperado: Usuario vinculado al aula
- Datos afectados: Tablas de matrícula/aula
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `AcademicoController::matricular`, ruta
  `/academico/aulas/{aula}/usuarios/{usuario}`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Asignaciones incorrectas

## 8. Misiones, asignaciones y entregas

### BR-013 — Recompensa dual por misión aprobada

- Regla: Una misión aprobada suma la misma cantidad a `experiencia` y
  `tokens` mediante `GamificacionService::otorgarRecompensa`; no se
  incrementan desde Angular.
- Dominio: Académico/Economía
- Actores: Docente, estudiante
- Precondiciones: Entrega aprobada
- Disparador: Revisión docente
- Resultado esperado: XP y DAEMONS otorgados una sola vez
- Datos afectados: `usuarios.experiencia`, `usuarios.tokens`,
  `movimientos_economia`
- Autoridad: Laravel (`GamificacionService` → `EconomiaService::otorgarDual`)
- Excepciones: Ajustes manuales de moneda no otorgan XP
- Fuente: `app/Services/Gamificacion/GamificacionService.php`,
  `MisionController`, tests `GamificacionXpTest`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Doble recompensa o XP inconsistente

### BR-014 — La revisión de entrega es autoridad del docente

- Regla: Solo el docente (o administrador) puede revisar y aprobar/rechazar
  entregas.
- Dominio: Académico
- Actores: Docente
- Precondiciones: Entrega enviada
- Disparador: Revisión
- Resultado esperado: Entrega aprobada o rechazada con comentario
- Datos afectados: Entregas
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `MisionController::revisar`, ruta
  `/misiones/entregas/{id}/revisar`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Recompensas sin revisión

## 9. Evaluaciones, revisión y resultados

### BR-015 — Evaluaciones con estados y respuestas validadas

- Regla: Las evaluaciones tienen estados (borrador, activo, finalizado) y
  las respuestas se validan y registran en el backend.
- Dominio: Académico
- Actores: Estudiante, docente
- Precondiciones: Evaluación activa
- Disparador: Envío de respuestas
- Resultado esperado: Respuestas registradas y resultados calculados
- Datos afectados: Evaluaciones y respuestas
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `EvaluacionController`, rutas `/evaluaciones*`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Resultados no confiables

## 10. XP, progreso, niveles y rachas

### BR-016 — XP nunca se descuenta

- Regla: `experiencia` es permanente; ningún canje, compra o ajuste la
  reduce.
- Dominio: Economía
- Actores: Estudiante, sistema
- Precondiciones: No aplica
- Disparador: Canje o ajuste
- Resultado esperado: XP sin cambios
- Datos afectados: `usuarios.experiencia`
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `EconomiaService::otorgarDual`, `TiendaController::canjear`,
  tests `GamificacionXpTest`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Ranking y niveles corruptos

### BR-017 — El nivel se calcula en Laravel

- Regla: El nivel de gamificación y el progreso del nivel se calculan en el
  backend y se exponen al frontend.
- Dominio: Economía
- Actores: Sistema
- Precondiciones: No aplica
- Disparador: Lectura de usuario
- Resultado esperado: `nivel_gamificacion` y `progreso_nivel` disponibles
- Datos afectados: Proyección de progreso
- Autoridad: Laravel
- Excepciones: Valores de respaldo de UI durante la carga
- Fuente: `app/Http/Resources/Api/V1/UsuarioResource.php`,
  `GamificacionService::progreso`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Fórmulas divergentes en pantallas

### BR-018 — Rachas

- Regla: No se encontró implementación ni definición verificada de "racha"
  en las fuentes.
- Dominio: Gamificación
- Actores: Estudiante
- Precondiciones: Desconocidas
- Disparador: Desconocido
- Resultado esperado: Desconocido
- Datos afectados: Desconocidos
- Autoridad: Desconocida
- Excepciones: Desconocidas
- Fuente: evidencia insuficiente
- Tipo de evidencia: Unknown
- Estado: unknown
- Riesgo si se incumple: No aplica (no verificable)
- Dependencia: Definición de racha en FND-3/FND-5

## 11. DAEMONS y economía

### BR-019 — Ledger de movimientos económicos con idempotencia

- Regla: Cada cambio de saldo se registra en `movimientos_economia` con
  `uuid` único, `saldo_anterior`, `saldo_resultante`, `clave_idempotencia`
  única, origen y actor. La tabla no define columnas de actualización
  (`updated_at` ausente), por lo que se opera como registro de movimientos;
  la garantía de append-only no está impuesta por una restricción de base de
  datos explícita (se verifica como práctica de servicio).
- Dominio: Economía
- Actores: Sistema
- Precondiciones: Cambio de saldo
- Disparador: Recompensa o canje
- Resultado esperado: Movimiento trazable y no rejugable
- Datos afectados: `movimientos_economia`
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: migración `2026_07_19_000000_...learning_interoperability...php`
  (tabla `movimientos_economia`), `app/Models/MovimientoEconomia.php`,
  `EconomiaService::otorgarDual`
- Tipo de evidencia: Verified data model
- Estado: verified
- Riesgo si se incumple: Fraude o pérdida de trazabilidad

### BR-020 — Una aprobación no otorga recompensa dos veces

- Regla: La protección contra doble recompensa se basa en el estado de la
  entrega y en la `clave_idempotencia` del movimiento; una entrega ya
  aprobada no vuelve a sumar saldos.
- Dominio: Economía
- Actores: Sistema
- Precondiciones: Entrega aprobada
- Disparador: Segunda revisión
- Resultado esperado: Sin doble otorgamiento
- Datos afectados: Saldos y ledger
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `EconomiaService::otorgarDual` (clave de idempotencia),
  `MisionController::revisar`, tests `GamificacionXpTest`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Inflación de saldos

### BR-021 — Ajustes manuales de moneda no otorgan XP

- Regla: Los ajustes desde `docente/tokens` son ajustes de moneda y no
  otorgan experiencia.
- Dominio: Economía
- Actores: Docente
- Precondiciones: Rol docente
- Disparador: Ajuste de tokens
- Resultado esperado: Cambio de tokens sin XP
- Datos afectados: `usuarios.tokens`
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `DocenteController::asignarTokens`, ruta `/docente/tokens`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Ranking manipulado

## 12. Tienda, stock y canjes

### BR-022 — El canje solo modifica tokens

- Regla: Un canje descuenta `tokens` y conserva intacta la `experiencia`.
- Dominio: Economía
- Actores: Estudiante
- Precondiciones: Stock y saldo suficientes
- Disparador: Solicitud de canje
- Resultado esperado: Canje registrado; XP sin cambios
- Datos afectados: `usuarios.tokens`, canjes, stock
- Autoridad: Laravel (transacción)
- Excepciones: No aplica
- Fuente: `TiendaController::canjear`, tests `GamificacionXpTest`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Pérdida de XP o saldo incorrecto

### BR-023 — Validación de stock y saldo en backend

- Regla: La transacción de canje valida stock y saldo en Laravel; el botón
  deshabilitado del frontend no es un control de seguridad.
- Dominio: Economía
- Actores: Estudiante
- Precondiciones: No aplica
- Disparador: Canje
- Resultado esperado: Canje rechazado si no hay stock o saldo
- Datos afectados: Stock y saldos
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `TiendaController::canjear`, `EconomiaService`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Canjes inválidos

## 13. Logros, insignias, mascotas y cosméticos

### BR-024 — Insignias gestionadas por docente

- Regla: Las insignias se crean, asignan y retiran mediante endpoints
  `docente/insignias` con rol docente o administrador.
- Dominio: Gamificación
- Actores: Docente
- Precondiciones: Rol autorizado
- Disparador: Creación/asignación
- Resultado esperado: Insignia visible para el estudiante
- Datos afectados: Insignias
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `DocenteController`, rutas `/docente/insignias*`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Reconocimientos sin control

### BR-025 — Compra de cosméticos con DAEMONS

- Regla: La compra de cosméticos descuenta DAEMONS, reduce stock, crea el
  canje y otorga la pieza al inventario en una misma transacción.
- Dominio: Economía/Gamificación
- Actores: Estudiante
- Precondiciones: Stock, saldo y compatibilidad
- Disparador: Compra
- Resultado esperado: Inventario actualizado; XP intacta
- Datos afectados: `mascota_inventario`, canjes, stock, `tokens`
- Autoridad: Laravel
- Excepciones: Compra repetida rechazada antes de descontar
- Fuente: `TiendaController::canjear` (entrega cosmético),
  migraciones `mascota_*`, `sistema-mascotas-cosmeticos.md`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Economía paralela o inventario duplicado

### BR-026 — El backend es la única autoridad de equipamiento

- Regla: La compra y el equipamiento de cosméticos se validan en el
  backend (propiedad, compatibilidad, ranura, disponibilidad).
- Dominio: Gamificación
- Actores: Estudiante
- Precondiciones: Pieza en inventario
- Disparador: Equipar/retirar
- Resultado esperado: Una pieza por ranura; piezas incompatibles retiradas
  sin eliminarse del inventario
- Datos afectados: `mascota_equipamientos`, `mascota_inventario`
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `MascotaController::equipar`, migraciones `mascota_*`,
  `sistema-mascotas-cosmeticos.md`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Equipamiento inconsistente

## 14. Cuentos, creación y publicación

### BR-027 — Cuentos v2 con autoridad Firestore

- Regla: El agregado de cuentos v2 vive en Firestore según ADR-002/003; la
  autoridad del control plane está en transición. El despliegue del control
  plane no está verificado como desplegado con la evidencia disponible; el
  estado remoto es unknown.
- Dominio: Creatividad
- Actores: Estudiante, moderador
- Precondiciones: No aplica
- Disparador: Creación/lectura de cuentos v2
- Resultado esperado: Cuentos gestionados según el modelo Firestore
- Datos afectados: Colecciones Firestore de cuentos
- Autoridad: Firestore + Laravel (adaptador)
- Excepciones: Cuentos v1 legacy en PostgreSQL siguen vigentes como
  transición
- Fuente: ADR-002/003, `CuentoV2Service.php`,
  `FirestoreRestCuentoGateway.php`
- Tipo de evidencia: Accepted ADR
- Estado: partial
- Riesgo si se incumple: Dual-write o pérdida de autoridad; despliegue
  remoto no verificado

### BR-028 — Publicación con moderación

- Regla: La publicación de un cuento requiere solicitud y moderación
  (publicación moderada por admin/docente).
- Dominio: Creatividad
- Actores: Estudiante, moderador
- Precondiciones: Cuento guardado
- Disparador: Solicitud de publicación
- Resultado esperado: Cuento visible tras moderación
- Datos afectados: Estado de publicación
- Autoridad: Laravel + moderación
- Excepciones: No aplica
- Fuente: `CuentoV2Controller`, rutas `/cuentos-v2/{id}/publicacion` y
  `/cuentos-v2/admin/{id}/publicacion`
- Tipo de evidencia: Verified code
- Estado: partial
- Riesgo si se incumple: Contenido no moderado

## 15. Comentarios, reacciones y moderación

### BR-029 — Comentarios server-only en rules v2

- Regla: En el modelo Firestore v2, los comentarios se escriben a través de
  Laravel (server-only); las reglas v2 no autorizan escritura directa de
  comentarios desde el cliente. El despliegue de las reglas v2 no está
  verificado como desplegado; el estado remoto es unknown.
- Dominio: Comunidad
- Actores: Estudiante, moderador
- Precondiciones: Reglas v2 desplegadas (no verificado)
- Disparador: Comentar
- Resultado esperado: Comentario creado por el backend
- Datos afectados: Colecciones de comentarios
- Autoridad: Firestore rules + Laravel
- Excepciones: Despliegue de rules sin verificar
- Fuente: ADR-003, `firestore.rules`, `CuentoV2Service::comentar`
- Tipo de evidencia: Accepted ADR
- Estado: partial
- Riesgo si se incumple: Escrituras no autorizadas

### BR-030 — Reacciones con ID determinista por usuario

- Regla: Las reacciones usan un ID determinista por usuario autenticado
  (rules v2), impidiendo reacciones duplicadas.
- Dominio: Comunidad
- Actores: Estudiante
- Precondiciones: Reglas v2 (despliegue no verificado)
- Disparador: Reaccionar
- Resultado esperado: Una reacción por usuario
- Datos afectados: Colecciones de reacciones
- Autoridad: Firestore rules
- Excepciones: No aplica
- Fuente: ADR-003, `CuentoV2Service::reaccionesPath` (ID determinista)
- Tipo de evidencia: Accepted ADR
- Estado: partial
- Riesgo si se incumple: Reacciones duplicadas

### BR-031 — Moderación de reportes y bloqueos

- Regla: Los reportes y bloqueos de la comunidad los resuelven moderadores
  y administradores mediante el backend.
- Dominio: Comunidad
- Actores: Usuario, moderador, administrador
- Precondiciones: Reporte creado
- Disparador: Resolución
- Resultado esperado: Reporte resuelto o usuario bloqueado
- Datos afectados: Reportes y bloqueos
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `SeguridadComunidadController`, rutas `/comunidad/reportes`,
  `/moderacion/admin`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Contenido nocivo sin control

## 16. Familia, tutor, vínculo y consentimiento

### BR-032 — Vínculo tutor-estudiante verificado

- Regla: El vínculo familiar se establece cuando el estudiante declara el
  correo del adulto y el adulto crea una cuenta `tutor` verificada que
  acepta el vínculo; una declaración del menor no concede acceso por sí
  sola.
- Dominio: Familia
- Actores: Estudiante, tutor
- Precondiciones: Correo verificado en Firebase
- Disparador: Aceptación de invitación
- Resultado esperado: `tutores_alumnos` creado con consentimiento
  `verificado`
- Datos afectados: `tutores_alumnos`, consentimiento
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `TutorPortalService.php` (`asegurarTutorVerificado`,
  `aceptar`), `app/Models/TutorAlumno.php`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Acceso no autorizado al progreso de un menor

### BR-033 — El tutor no accede a contenido privado

- Regla: El portal familiar muestra solo señales de aprendizaje (XP,
  nivel, misiones aprobadas, evaluaciones enviadas, actividad diaria
  agregada) y no expone chats, evidencias, archivos privados, credenciales
  ni saldo de DAEMONS.
- Dominio: Familia
- Actores: Tutor
- Precondiciones: Vínculo verificado
- Disparador: Lectura del panel
- Resultado esperado: Reporte familiar sin contenido sensible
- Datos afectados: Reporte del panel
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `TutorPortalController::panel`, `TutorPortalService`,
  `portal-familias.md`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Exposición de datos de menores

### BR-034 — Límite de pantalla por tutor verificado

- Regla: El tutor puede fijar un máximo diario (30–480 min) y un horario de
  silencio; el sistema registra latidos solo con pestaña visible y
  almacena totales agregados por día.
- Dominio: Bienestar
- Actores: Tutor, estudiante
- Precondiciones: Vínculo verificado
- Disparador: Configuración/uso
- Resultado esperado: Límite aplicado con pausa amigable; sin telemetría
  invasiva
- Datos afectados: `uso_pantalla_diario`
- Autoridad: Laravel
- Excepciones: Falla abierta ante caída de red
- Fuente: `BienestarDigitalController`, `app/Models/UsoPantallaDiario`,
  `TutorPortalController::actualizarLimite`, `portal-familias.md`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Vigilancia o corte injustificado de clase

## 17. Privacidad, bienestar y protección de menores

### BR-035 — DAEMON no debe almacenar datos de pago (restricción futura)

- Regla: DAEMON no debe almacenar PAN, CVV ni datos completos de tarjeta.
  Una futura integración de pagos familiares debe utilizar checkout alojado
  o tokenización del proveedor. No se declara un sistema de pagos
  implementado; la integración real de cobros está desactivada hasta elegir
  proveedor y validar webhooks.
- Dominio: Privacidad
- Actores: Tutor
- Precondiciones: No aplica (sin sistema de pagos activo)
- Disparador: Futura integración de pagos
- Resultado esperado: Restricción respetada al integrar pagos
- Datos afectados: No aplica (sin almacenamiento)
- Autoridad: Decisión de producto/privacidad
- Excepciones: No aplica
- Fuente: `portal-familias.md` (membresía y pagos),
  `config/` (sin proveedor configurado; `FAMILY_PAYMENTS_PORTAL_URL` sin
  valor)
- Tipo de evidencia: Future dependency
- Estado: pending
- Riesgo si se incumple: Datos sensibles de pago

### BR-036 — Retención predeterminada de uso de pantalla

- Regla: La retención de `uso_pantalla_diario` se configura mediante
  `PRIVACY_SCREEN_USAGE_DAYS` con valor predeterminado 45 días y se ejecuta
  mediante el comando `daemon:aplicar-retencion`, que elimina registros
  elegibles solo con `--confirm` y no toca el historial académico.
- Dominio: Privacidad
- Actores: Sistema
- Precondiciones: No aplica
- Disparador: Comando programado o manual
- Resultado esperado: Datos agregados retenidos según configuración
- Datos afectados: `uso_pantalla_diario`
- Autoridad: Laravel
- Excepciones: Configuración `PRIVACY_SCREEN_USAGE_DAYS`
- Fuente: `app/Console/Commands/AplicarRetencionPrivacidad.php`,
  `config/privacy.php` (línea 10), `.env.example`
  (`PRIVACY_SCREEN_USAGE_DAYS=45`), `routes/console.php` (schedule)
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Retención excesiva

### BR-037 — Exportación y eliminación de datos con límite de frecuencia

- Regla: El usuario puede solicitar exportación y eliminación de sus datos
  mediante endpoints de privacidad protegidos con límite de frecuencia
  (`throttle:3,60`).
- Dominio: Privacidad
- Actores: Usuario
- Precondiciones: Sesión válida
- Disparador: Solicitud
- Resultado esperado: Exportación entregada o eliminación procesada
- Datos afectados: Datos personales
- Autoridad: Laravel
- Excepciones: Resolución administrativa de solicitudes
- Fuente: `routes/api.php` (`throttle:3,60` en `/privacidad/exportar` y
  `/privacidad/eliminacion`), `PrivacidadController`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Incumplimiento de derechos de datos

### BR-038 — Sin telemetría invasiva (lista cerrada)

- Regla: No se registran páginas visitadas, teclas, capturas, chat ni
  contenido; solo se permiten eventos de la lista cerrada
  `EVENTOS_PERMITIDOS` validada con `Rule::in` en el controlador.
- Dominio: Privacidad
- Actores: Sistema
- Precondiciones: No aplica
- Disparador: Eventos permitidos
- Resultado esperado: Telemetría limitada a la lista cerrada
- Datos afectados: Eventos de telemetría
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `app/Services/Analitica/ProductoAnalyticsService.php`
  (`EVENTOS_PERMITIDOS`, `PROPIEDADES_PERMITIDAS`),
  `app/Http/Controllers/Api/V1/TelemetriaController.php`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Vigilancia de menores

## 18. Archivos, ownership y eliminación

### BR-039 — Archivos con ownership en PostgreSQL + Supabase Storage

- Regla: Los bytes viven en Supabase Storage y la metadata/ownership en
  PostgreSQL; la administración de archivos se hace con endpoints admin.
- Dominio: Datos
- Actores: Todos, administrador
- Precondiciones: No aplica
- Disparador: Subida/gestión
- Resultado esperado: Archivo trazable con propietario
- Datos afectados: Storage + tablas de archivos
- Autoridad: Laravel + Supabase Storage
- Excepciones: No aplica
- Fuente: ADR-004, `ArchivoService`, `ArchivoAdminController`, rutas
  `/archivos*`
- Tipo de evidencia: Accepted ADR
- Estado: verified
- Riesgo si se incumple: Archivos huérfanos o sin ownership

## 19. Notificaciones y comunicaciones

### BR-041 — Notificaciones con marcas de lectura

- Regla: Las notificaciones se listan y se marcan como leídas (individual o
  masivamente) mediante el backend.
- Dominio: Comunicación
- Actores: Usuario
- Precondiciones: Sesión válida
- Disparador: Lectura/gestión
- Resultado esperado: Estado de lectura actualizado
- Datos afectados: Notificaciones
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `NotificacionController`, rutas `/notificaciones*`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Comunicación poco confiable

## 20. Comunidad, reportes y seguridad

### BR-042 — Comunidad moderada

- Regla: La comunidad permite interacción moderada; los reportes y bloqueos
  se gestionan por moderación.
- Dominio: Comunidad
- Actores: Usuario, moderador
- Precondiciones: No aplica
- Disparador: Interacción o reporte
- Resultado esperado: Interacción dentro de reglas; reportes resueltos
- Datos afectados: Comunidad, reportes, bloqueos
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: `SeguridadComunidadController`, rutas `/comunidad*`,
  `/moderacion/admin`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Entorno inseguro para menores

## 21. Administración y operación

### BR-043 — Funciones administrativas con rol admin

- Regla: La administración de alumnos, modelos IA, mascotas, archivos,
  moderación, privacidad e interoperabilidad requiere `role:admin`.
- Dominio: Administración
- Actores: Administrador
- Precondiciones: Rol admin
- Disparador: Operación administrativa
- Resultado esperado: Operación ejecutada con trazabilidad
- Datos afectados: Múltiples dominios
- Autoridad: Laravel
- Excepciones: `docente,admin` en grupos académicos
- Fuente: grupos `role:admin` en `routes/api.php`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Acciones administrativas sin control

## 22. Interoperabilidad e integraciones

### BR-044 — Integraciones encapsuladas y autorizadas

- Regla: Las integraciones externas (OneRoster, LTI) están encapsuladas en
  `routes/interoperability.php` con autenticación propia y administración
  por rol admin.
- Dominio: Integración
- Actores: Servicio externo, administrador
- Precondiciones: Cliente/registro autorizado
- Disparador: Llamada de interoperabilidad
- Resultado esperado: Sincronización dentro del contrato
- Datos afectados: Datos interoperables
- Autoridad: Laravel + contrato externo
- Excepciones: No aplica
- Fuente: `routes/interoperability.php`, `OneRosterAuthService`,
  `interoperabilidad-oneroster-lti.md`
- Tipo de evidencia: Verified code
- Estado: partial
- Riesgo si se incumple: Interoperabilidad insegura

## 23. Estados y transiciones de dominio

| Entidad o flujo | Estado origen | Acción | Estado destino | Actor autorizado | Evidencia |
|---|---|---|---|---|---|
| Entrega de misión | enviada | Revisar | aprobada / rechazada | Docente | `MisionController::revisar` |
| Evaluación | borrador | Activar | activo | Docente | `EvaluacionController` |
| Evaluación | activo | Finalizar | finalizado | Docente | `EvaluacionController` |
| Cuento v2 | borrador | Solicitar publicación | en revisión | Estudiante | `CuentoV2Controller` |
| Cuento v2 | en revisión | Publicar moderado | publicado | Moderador | `CuentoV2Controller::publicarModerado` |
| Consentimiento familiar | pendiente | Aceptar | verificado | Tutor | `TutorPortalService::aceptar` |
| Reporte comunidad | abierto | Resolver | resuelto | Moderador | `SeguridadComunidadController` |

Nota: los estados implícitos de otras entidades no se inventan; se registran
como partial hasta que FND-4/FND-5 los verifique.

## 24. Invariantes globales de producto

1. `rol` y `nivel` permanecen separados (BR-003).
2. KIDS y TEENS no duplican producto (BR-007).
3. Identidad no equivale a autorización (BR-002).
4. El frontend no autoriza operaciones privilegiadas (BR-002, BR-005).
   BR-023 es un ejemplo específico de validación server-side en el canje,
   no la fuente principal de este invariante.
5. XP y DAEMONS usan servicios de dominio (BR-013, BR-019).
6. Los movimientos económicos son trazables (BR-019).
7. Una autoridad de datos por entidad (ADR-001).
8. Cuentos v2 respetan Firestore según ADR (BR-027).
9. Los datos de negocio respetan PostgreSQL según ADR.
10. Los archivos respetan ownership (BR-039).
11. Los menores tienen protección adicional (BR-032 a BR-038).
12. El diseño no sustituye reglas de negocio (Constitución §13).
13. Experiencias diferentes no duplican lógica (BR-007).
14. Una capacidad no se declara productiva sin evidencia.

### Restricción operativa derivada

### BR-040 — No se usan credenciales productivas en desarrollo

- Regla: Los entornos locales no deben apuntar a recursos productivos;
  `EnvironmentSafety` bloquea ante configuración insegura.
- Dominio: Operación (restricción constitucional/arquitectónica transversal)
- Actores: Desarrolladores, agentes
- Precondiciones: No aplica
- Disparador: Ejecución local
- Resultado esperado: Bloqueo ante configuración productiva local
- Datos afectados: Configuración
- Autoridad: `EnvironmentSafety` + ADR-006
- Excepciones: No aplica
- Fuente: `app/Services/Seguridad/EnvironmentSafety.php` (o equivalente),
  ADR-006, `ENVIRONMENTS.md`
- Tipo de evidencia: Accepted ADR
- Estado: verified
- Riesgo si se incumple: Operaciones sobre producción desde local

Aclaraciones:

- Esta restricción es transversal y no constituye una capability del
  producto; su detalle canónico pertenecerá a FND-5 (`environments.md`).
- GAP-005 permanece abierto: el entorno local real sigue bloqueado y no se
  declara solucionado.

## 25. Casos desconocidos y decisiones pendientes

| ID | Pregunta no resuelta | Impacto | Evidencia faltante | Fase o responsable |
|---|---|---|---|---|
| UNK-001 | Definición e implementación de "racha" | Medio | Código o documentación | FND-3/FND-5 |
| UNK-002 | Estado de despliegue de reglas Firestore v2 | Alto | Verificación remota | FND-5 + propietario |
| UNK-003 | Estado del control plane de cuentos v2 | Alto | Verificación remota | FND-4/5 |
| UNK-004 | Cobertura funcional de OneRoster/LTI | Medio | Pruebas de contrato | FND-4/5 |
| UNK-005 | Experiencia de aula Firestore enrutada | Medio | Ruta activa frontend | FND-4 |
| UNK-006 | Dispositivos predominantes por portal | Bajo | Telemetría/analítica autorizada | FND-5 |
| UNK-007 | Cumplimiento legal específico | Medio | Revisión jurídica | Propietario |
| UNK-008 | Definición de "logro" frente a "insignia" | Bajo | Código/documentación | FND-3 |
| UNK-009 | Login local (`password_hash`) como desviación técnica frente a la autoridad normativa Firebase Auth (ADR-001) | Alto | Decisión de gobernanza sobre ADR-001 | Propietario + FND-4/5 |
| UNK-010 | Alcance del enforcement de verificación de correo (qué funciones se bloquean) | Medio | Middleware/guard de verificación | FND-4/5 |

## 26. Revisión, versionado y changelog

1. Revisión al menos semestral o ante un cambio estructural.
2. Versión mayor para ruptura; versión menor para ampliación compatible.
3. Aprobación explícita; no existe aprobación silenciosa.

| Fecha | Versión | Estado | Cambio | Aprobaciones |
|---|---|---|---|---|
| 2026-08-06 | 1.0-candidate | draft | Creación del candidato FND-3A | Pendiente |
| 2026-08-06 | 1.0-candidate | draft | Corrección R1: auditoría de evidencia, estados y tipos exactos, BR-001 y nuevos UNK | Pendiente |
| 2026-08-06 | 1.0-candidate | draft | Corrección R2: BR-001 como autoridad normativa + desviación observada; invariantes y referencias | Pendiente |
| 2026-08-06 | 1.0 | canonical | Aprobación y activación FND-3B | project-owner + product-reviewer |

## Apéndice A. Índice de reglas

| ID | Nombre | Dominio | Estado | Actores | Fuente principal |
|---|---|---|---|---|---|
| BR-001 | Firebase Auth autoridad normativa (login local no resuelto) | Identidad | partial | Todos | ADR-001, `AutenticacionService` |
| BR-002 | Autorización efectiva en Laravel | Autorización | verified | Todos | `EnsureRole`, rutas API |
| BR-003 | `rol` y `nivel` separados | Identidad | verified | Todos | `Usuario`, migración niveles |
| BR-004 | Perfil no autoritativo | Identidad | verified | Estudiante, docente | `AlumnoController`, `AlumnoService` |
| BR-005 | Permisos por rol | Autorización | verified | Todos | `routes/api.php` |
| BR-006 | KIDS/TEENS no son roles | Autorización | verified | Estudiante | Constitución §12 |
| BR-007 | Una única base compartida | Experiencia | verified | Estudiante | Constitución §12, ADR-005 |
| BR-008 | Variantes no rompen reglas | Experiencia | verified | Estudiante | Constitución §12 |
| BR-009 | Registro con verificación (enforcement parcial) | Acceso | partial | Visitante | `AutenticacionService`, `EmailVerificationService` |
| BR-010 | Recuperación vía Firebase | Acceso | verified | Usuario | `RecuperacionClaveService` |
| BR-011 | Currículo estructurado | Académico | verified | Docente, admin | `AcademicoController` |
| BR-012 | Matrícula a aula | Académico | verified | Docente, admin | `AcademicoController::matricular` |
| BR-013 | Recompensa dual por misión | Académico/Economía | verified | Docente, estudiante | `GamificacionService` |
| BR-014 | Revisión autoridad del docente | Académico | verified | Docente | `MisionController::revisar` |
| BR-015 | Evaluaciones con estados | Académico | verified | Estudiante, docente | `EvaluacionController` |
| BR-016 | XP nunca se descuenta | Economía | verified | Estudiante, sistema | `EconomiaService`, `TiendaController` |
| BR-017 | Nivel calculado en Laravel | Economía | verified | Sistema | `UsuarioResource`, `GamificacionService` |
| BR-018 | Rachas | Gamificación | unknown | Estudiante | evidencia insuficiente |
| BR-019 | Ledger con idempotencia | Economía | verified | Sistema | migración `movimientos_economia` |
| BR-020 | Sin doble recompensa | Economía | verified | Sistema | `EconomiaService`, `MisionController` |
| BR-021 | Ajustes manuales sin XP | Economía | verified | Docente | `DocenteController::asignarTokens` |
| BR-022 | Canje solo modifica tokens | Economía | verified | Estudiante | `TiendaController::canjear` |
| BR-023 | Validación de stock en backend | Economía | verified | Estudiante | `TiendaController`, `EconomiaService` |
| BR-024 | Insignias gestionadas por docente | Gamificación | verified | Docente | `DocenteController` |
| BR-025 | Compra de cosméticos con DAEMONS | Economía/Gamificación | verified | Estudiante | `TiendaController`, migraciones mascota |
| BR-026 | Backend autoridad de equipamiento | Gamificación | verified | Estudiante | `MascotaController` |
| BR-027 | Cuentos v2 con autoridad Firestore | Creatividad | partial | Estudiante, moderador | ADR-002/003, `CuentoV2Service` |
| BR-028 | Publicación con moderación | Creatividad | partial | Estudiante, moderador | `CuentoV2Controller` |
| BR-029 | Comentarios server-only | Comunidad | partial | Estudiante, moderador | ADR-003, `firestore.rules` |
| BR-030 | Reacciones con ID determinista | Comunidad | partial | Estudiante | ADR-003, `CuentoV2Service` |
| BR-031 | Moderación de reportes | Comunidad | verified | Moderador, admin | `SeguridadComunidadController` |
| BR-032 | Vínculo tutor verificado | Familia | verified | Estudiante, tutor | `TutorPortalService` |
| BR-033 | Tutor sin contenido privado | Familia | verified | Tutor | `TutorPortalController` |
| BR-034 | Límite de pantalla | Bienestar | verified | Tutor, estudiante | `BienestarDigitalController` |
| BR-035 | Sin datos de pago (restricción futura) | Privacidad | pending | Tutor | `portal-familias.md` |
| BR-036 | Retención 45 días | Privacidad | verified | Sistema | `AplicarRetencionPrivacidad`, `config/privacy.php` |
| BR-037 | Exportación y eliminación con límite | Privacidad | verified | Usuario | `routes/api.php` (throttle) |
| BR-038 | Sin telemetría invasiva | Privacidad | verified | Sistema | `ProductoAnalyticsService` |
| BR-039 | Archivos con ownership | Datos | verified | Todos, admin | ADR-004, `ArchivoService` |
| BR-040 | Sin credenciales productivas en dev | Operación | verified | Desarrolladores | ADR-006, `EnvironmentSafety` |
| BR-041 | Notificaciones con marcas | Comunicación | verified | Usuario | `NotificacionController` |
| BR-042 | Comunidad moderada | Comunidad | verified | Usuario, moderador | `SeguridadComunidadController` |
| BR-043 | Funciones admin con rol admin | Administración | verified | Administrador | `routes/api.php` |
| BR-044 | Integraciones encapsuladas | Integración | partial | Servicio externo, admin | `interoperability.php` |
