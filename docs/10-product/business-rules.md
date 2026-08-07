---
title: DAEMON Business Rules
status: draft
normative: true
version: 1.0-candidate
owner: product
phase: FND-3A
created: 2026-08-06
last_reviewed: 2026-08-06
applies_to: product
approval_required:
  - project-owner
  - product-reviewer
supersedes: null
---

# DAEMON Business Rules

## 1. Autoridad, propósito y alcance

1. Este documento es el candidato de reglas de negocio de DAEMON (FND-3A).
   Mientras conserve `status: draft`, no autoriza implementación.
2. Registra las reglas verificadas o documentadas que no deben romperse,
   con evidencia y estado.
3. No sustituye la Constitución General ni `product-overview.md`.
4. Complementa `product-overview.md`: allí se definen actores, experiencias
   y capacidades; aquí se definen las reglas de negocio.
5. La activación como documento canónico requiere aprobación explícita del
   `project-owner` y de `product-reviewer`; ningún agente puede autoaprobarlo.

## 2. Convención de reglas

Cada regla usa:

- identificador estable `BR-XXX`;
- campos: Regla, Dominio, Actores, Precondiciones, Disparador, Resultado
  esperado, Datos afectados, Autoridad, Excepciones, Fuente, Tipo de
  evidencia, Estado, Riesgo si se incumple;
- estados permitidos: `verified`, `accepted`, `partial`, `pending`,
  `unknown`, `deprecated`;
- tipos de evidencia: Constitutional rule, Accepted ADR, Verified code,
  Verified data model, Active documentation, Future dependency, Unknown.

Cuando no aplique un campo, se usa "No aplica". Cuando no exista evidencia,
se usa `Estado: unknown` y `Fuente: evidencia insuficiente`, registrando la
dependencia necesaria.

## 3. Identidad, usuarios y perfiles

### BR-001 — Firebase Auth es la autoridad de identidad

- Regla: La identidad (credenciales, verificación de correo, Google) se
  autentica mediante Firebase Auth; Laravel valida los tokens y emite
  sesión Sanctum.
- Dominio: Identidad
- Actores: Todos
- Precondiciones: Cuenta Firebase existente
- Disparador: Inicio de sesión
- Resultado esperado: Sesión válida tras validación del token
- Datos afectados: `usuarios.firebase_uid`
- Autoridad: Firebase Auth + Laravel
- Excepciones: Login local por nombre de usuario llama a `/auth/login`
- Fuente: firebase-auth.md, ADR-001
- Tipo de evidencia: Accepted ADR
- Estado: verified
- Riesgo si se incumple: Identidad no verificable; sesiones falsas

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
- Fuente: rutas API (`role:*`), Constitución §11
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
  cambiar el rol
- Fuente: portal-alumno.md, ADR-005
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
- Fuente: portal-alumno.md
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
- Fuente: `routes/api.php`
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
- Fuente: Constitución §12, portal-alumno.md
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
- Fuente: Constitución §12, ADR-005
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

### BR-009 — Registro con verificación de correo

- Regla: El registro con correo exige verificación antes de funciones
  críticas; Google crea cuenta y completa perfil.
- Dominio: Acceso
- Actores: Visitante
- Precondiciones: No aplica
- Disparador: Registro
- Resultado esperado: Cuenta creada; correo pendiente de verificación
- Datos afectados: `usuarios`
- Autoridad: Firebase Auth + Laravel
- Excepciones: Login Google con perfil pendiente
- Fuente: manual_usuario.md, rutas `/auth/registro`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Cuentas sin verificar con funciones críticas

### BR-010 — Recuperación de cuenta vía Firebase

- Regla: La recuperación de contraseña usa Firebase
  `sendPasswordResetEmail` (frontend), no el endpoint de correos Resend.
- Dominio: Acceso
- Actores: Usuario
- Precondiciones: Correo registrado
- Disparador: Solicitud de recuperación
- Resultado esperado: Correo de restablecimiento enviado por Firebase
- Datos afectados: No aplica
- Autoridad: Firebase Auth
- Excepciones: No aplica
- Fuente: AGENTS.md, recuperar-clave
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
- Fuente: `/academico`, AcademicoController
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
- Fuente: `/academico/aulas/{aula}/usuarios/{usuario}`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Asignaciones incorrectas

## 8. Misiones, asignaciones y entregas

### BR-013 — Recompensa dual por misión aprobada

- Regla: Una misión aprobada suma la misma cantidad a `experiencia` y
  `tokens` mediante `GamificacionService`; no se incrementan desde Angular.
- Dominio: Académico/Economía
- Actores: Docente, estudiante
- Precondiciones: Entrega aprobada
- Disparador: Revisión docente
- Resultado esperado: XP y DAEMONS otorgados una sola vez
- Datos afectados: `usuarios.experiencia`, `usuarios.tokens`,
  `movimientos_economia`
- Autoridad: Laravel (`GamificacionService`)
- Excepciones: Ajustes manuales de moneda no otorgan XP
- Fuente: gamificacion-xp-daemons.md
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
- Fuente: `/misiones/entregas/{id}/revisar`
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
- Fuente: `/evaluaciones*`, EvaluacionController
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
- Fuente: gamificacion-xp-daemons.md
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Ranking y niveles corruptos

### BR-017 — El nivel se calcula en Laravel

- Regla: El nivel de gamificación y el progreso del nivel se calculan en el
  backend (`UsuarioResource`) y se exponen al frontend.
- Dominio: Economía
- Actores: Sistema
- Precondiciones: No aplica
- Disparador: Lectura de usuario
- Resultado esperado: `nivel_gamificacion` y `progreso_nivel` disponibles
- Datos afectados: Proyección de progreso
- Autoridad: Laravel
- Excepciones: Valores de respaldo de UI durante la carga
- Fuente: gamificacion-xp-daemons.md
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

### BR-019 — Ledger append-only de movimientos

- Regla: Cada cambio de saldo se registra en el ledger `movimientos_economia`
  con saldo anterior/resultante, idempotencia, origen y actor.
- Dominio: Economía
- Actores: Sistema
- Precondiciones: Cambio de saldo
- Disparador: Recompensa o canje
- Resultado esperado: Movimiento trazable y no rejugable
- Datos afectados: `movimientos_economia`
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: gamificacion-xp-daemons.md
- Tipo de evidencia: Verified data model
- Estado: verified
- Riesgo si se incumple: Fraude o pérdida de trazabilidad

### BR-020 — Una aprobación no otorga recompensa dos veces

- Regla: La protección contra doble recompensa se basa en el estado de la
  entrega; una entrega ya aprobada no vuelve a sumar saldos.
- Dominio: Economía
- Actores: Sistema
- Precondiciones: Entrega aprobada
- Disparador: Segunda revisión
- Resultado esperado: Sin doble otorgamiento
- Datos afectados: Saldos y ledger
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: gamificacion-xp-daemons.md
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
- Fuente: gamificacion-xp-daemons.md
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
- Fuente: gamificacion-xp-daemons.md, portal-alumno.md
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
- Fuente: gamificacion-xp-daemons.md
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
- Fuente: `/docente/insignias*`
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
- Fuente: sistema-mascotas-cosmeticos.md
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
- Fuente: sistema-mascotas-cosmeticos.md
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Equipamiento inconsistente

## 14. Cuentos, creación y publicación

### BR-027 — Cuentos v2 con autoridad Firestore

- Regla: El agregado de cuentos v2 vive en Firestore según ADR-002/003; la
  autoridad del control plane está en transición y no se declara desplegado.
- Dominio: Creatividad
- Actores: Estudiante, moderador
- Precondiciones: No aplica
- Disparador: Creación/lectura de cuentos v2
- Resultado esperado: Cuentos gestionados según el modelo Firestore
- Datos afectados: Colecciones Firestore de cuentos
- Autoridad: Firestore + Laravel (adaptador)
- Excepciones: Cuentos v1 legacy en PostgreSQL siguen vigentes como
  transición
- Fuente: ADR-002/003
- Tipo de evidencia: Accepted ADR
- Estado: partial (control plane no desplegado)
- Riesgo si se incumple: Dual-write o pérdida de autoridad

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
- Fuente: `/cuentos-v2/{id}/publicacion`, ADR-003
- Tipo de evidencia: Verified code
- Estado: partial
- Riesgo si se incumple: Contenido no moderado

## 15. Comentarios, reacciones y moderación

### BR-029 — Comentarios server-only en rules v2

- Regla: En el modelo Firestore v2, los comentarios se escriben a través de
  Laravel (server-only); las reglas v2 no autorizan escritura directa de
  comentarios desde el cliente.
- Dominio: Comunidad
- Actores: Estudiante, moderador
- Precondiciones: Reglas v2 desplegadas
- Disparador: Comentar
- Resultado esperado: Comentario creado por el backend
- Datos afectados: Colecciones de comentarios
- Autoridad: Firestore rules + Laravel
- Excepciones: Reglas v2 no desplegadas (riesgo)
- Fuente: ADR-003
- Tipo de evidencia: Accepted ADR
- Estado: partial
- Riesgo si se incumple: Escrituras no autorizadas

### BR-030 — Reacciones con ID determinista por usuario

- Regla: Las reacciones usan un ID determinista por usuario autenticado
  (rules v2), impidiendo reacciones duplicadas.
- Dominio: Comunidad
- Actores: Estudiante
- Precondiciones: Reglas v2
- Disparador: Reaccionar
- Resultado esperado: Una reacción por usuario
- Datos afectados: Colecciones de reacciones
- Autoridad: Firestore rules
- Excepciones: No aplica
- Fuente: ADR-003
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
- Fuente: `/comunidad/reportes`, `/moderacion/admin`
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
- Fuente: portal-familias.md
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
- Fuente: portal-familias.md
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
- Fuente: portal-familias.md, privacidad-kids-teens.md
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Vigilancia o corte injustificado de clase

## 17. Privacidad, bienestar y protección de menores

### BR-035 — No se almacenan datos de pago

- Regla: DAEMON no almacena PAN, CVV ni datos de tarjeta; los pagos
  familiares se realizan mediante checkout alojado por el proveedor.
- Dominio: Privacidad
- Actores: Tutor
- Precondiciones: No aplica
- Disparador: Pago familiar
- Resultado esperado: Redirección a checkout del proveedor, sin datos de
  tarjeta
- Datos afectados: No aplica (sin almacenamiento)
- Autoridad: Proveedor + Laravel
- Excepciones: Pagos desactivados hasta elegir proveedor
- Fuente: portal-familias.md
- Tipo de evidencia: Verified configuration
- Estado: verified
- Riesgo si se incumple: Datos sensibles de pago

### BR-036 — Retención predeterminada de uso de pantalla

- Regla: La retención predeterminada de `uso_pantalla_diario` es 45 días
  mediante `daemon:aplicar-retencion`.
- Dominio: Privacidad
- Actores: Sistema
- Precondiciones: No aplica
- Disparador: Tarea de retención
- Resultado esperado: Datos agregados retenidos 45 días
- Datos afectados: `uso_pantalla_diario`
- Autoridad: Laravel
- Excepciones: Configuración `PRIVACY_SCREEN_USAGE_DAYS`
- Fuente: portal-familias.md
- Tipo de evidencia: Active documentation
- Estado: verified
- Riesgo si se incumple: Retención excesiva

### BR-037 — Exportación y eliminación de datos

- Regla: El usuario puede solicitar exportación y eliminación de sus datos
  mediante endpoints de privacidad con límite de frecuencia.
- Dominio: Privacidad
- Actores: Usuario
- Precondiciones: Sesión válida
- Disparador: Solicitud
- Resultado esperado: Exportación entregada o eliminación procesada
- Datos afectados: Datos personales
- Autoridad: Laravel
- Excepciones: Resolución administrativa de solicitudes
- Fuente: `/privacidad/exportar`, `/privacidad/eliminacion`
- Tipo de evidencia: Verified code
- Estado: verified
- Riesgo si se incumple: Incumplimiento de derechos de datos

### BR-038 — Sin telemetría invasiva

- Regla: No se registran páginas visitadas, teclas, capturas, chat ni
  contenido; solo se permiten eventos de la lista cerrada de telemetría.
- Dominio: Privacidad
- Actores: Sistema
- Precondiciones: No aplica
- Disparador: Eventos permitidos
- Resultado esperado: Telemetría limitada a la lista cerrada
- Datos afectados: Eventos de telemetría
- Autoridad: Laravel
- Excepciones: No aplica
- Fuente: privacidad-kids-teens.md, AGENTS.md
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
- Fuente: ADR-004, `/archivos*`
- Tipo de evidencia: Accepted ADR
- Estado: verified
- Riesgo si se incumple: Archivos huérfanos o sin ownership

### BR-040 — No se usan credenciales productivas en desarrollo

- Regla: Los entornos locales no deben apuntar a recursos productivos;
  `EnvironmentSafety` bloquea ante configuración insegura.
- Dominio: Operación
- Actores: Desarrolladores, agentes
- Precondiciones: No aplica
- Disparador: Ejecución local
- Resultado esperado: Bloqueo ante configuración productiva local
- Datos afectados: Configuración
- Autoridad: EnvironmentSafety
- Excepciones: No aplica
- Fuente: ADR-006, ENVIRONMENTS.md
- Tipo de evidencia: Accepted ADR
- Estado: verified
- Riesgo si se incumple: Operaciones sobre producción desde local

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
- Fuente: `/notificaciones*`
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
- Fuente: `/comunidad*`, `/moderacion/admin`
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
- Fuente: grupos `role:admin` en api.php
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
- Fuente: `routes/interoperability.php`, interoperabilidad-oneroster-lti.md
- Tipo de evidencia: Verified code
- Estado: partial
- Riesgo si se incumple: Interoperabilidad insegura

## 23. Estados y transiciones de dominio

| Entidad o flujo | Estado origen | Acción | Estado destino | Actor autorizado | Evidencia |
|---|---|---|---|---|---|
| Entrega de misión | enviada | Revisar | aprobada / rechazada | Docente | `/misiones/entregas/{id}/revisar` |
| Evaluación | borrador | Activar | activo | Docente | `/evaluaciones*` |
| Evaluación | activo | Finalizar | finalizado | Docente | `/evaluaciones*` |
| Cuento v2 | borrador | Solicitar publicación | en revisión | Estudiante | `/cuentos-v2/{id}/publicacion` |
| Cuento v2 | en revisión | Publicar moderado | publicado | Moderador | `/cuentos-v2/admin/{id}/publicacion` |
| Consentimiento familiar | pendiente | Aceptar | verificado | Tutor | `/tutor/invitaciones/{id}/aceptar` |
| Reporte comunidad | abierto | Resolver | resuelto | Moderador | `/moderacion/admin/reportes` |

Nota: los estados implícitos de otras entidades no se inventan; se registran
como partial hasta que FND-4/FND-5 los verifique.

## 24. Invariantes globales de producto

1. `rol` y `nivel` permanecen separados (BR-003).
2. KIDS y TEENS no duplican producto (BR-007).
3. Identidad no equivale a autorización (BR-002).
4. El frontend no autoriza operaciones privilegiadas (BR-023).
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

## 26. Revisión, versionado y changelog

1. Revisión al menos semestral o ante un cambio estructural.
2. Versión mayor para ruptura; versión menor para ampliación compatible.
3. Aprobación explícita; no existe aprobación silenciosa.

| Fecha | Versión | Estado | Cambio | Aprobaciones |
|---|---|---|---|---|
| 2026-08-06 | 1.0-candidate | draft | Creación del candidato FND-3A | Pendiente |

## Apéndice A. Índice de reglas

| ID | Nombre | Dominio | Estado | Actores | Fuente principal |
|---|---|---|---|---|---|
| BR-001 | Firebase Auth autoridad de identidad | Identidad | verified | Todos | ADR-001, firebase-auth.md |
| BR-002 | Autorización efectiva en Laravel | Autorización | verified | Todos | rutas API |
| BR-003 | `rol` y `nivel` separados | Identidad | verified | Todos | portal-alumno.md, ADR-005 |
| BR-004 | Perfil no autoritativo | Identidad | verified | Estudiante, docente | portal-alumno.md |
| BR-005 | Permisos por rol | Autorización | verified | Todos | routes/api.php |
| BR-006 | KIDS/TEENS no son roles | Autorización | verified | Estudiante | Constitución §12 |
| BR-007 | Una única base compartida | Experiencia | verified | Estudiante | Constitución §12, ADR-005 |
| BR-008 | Variantes no rompen reglas | Experiencia | verified | Estudiante | Constitución §12 |
| BR-009 | Registro con verificación | Acceso | verified | Visitante | manual_usuario.md |
| BR-010 | Recuperación vía Firebase | Acceso | verified | Usuario | AGENTS.md |
| BR-011 | Currículo estructurado | Académico | verified | Docente, admin | AcademicoController |
| BR-012 | Matrícula a aula | Académico | verified | Docente, admin | routes/api.php |
| BR-013 | Recompensa dual por misión | Académico/Economía | verified | Docente, estudiante | gamificacion-xp-daemons.md |
| BR-014 | Revisión autoridad del docente | Académico | verified | Docente | routes/api.php |
| BR-015 | Evaluaciones con estados | Académico | verified | Estudiante, docente | EvaluacionController |
| BR-016 | XP nunca se descuenta | Economía | verified | Estudiante, sistema | gamificacion-xp-daemons.md |
| BR-017 | Nivel calculado en Laravel | Economía | verified | Sistema | gamificacion-xp-daemons.md |
| BR-018 | Rachas | Gamificación | unknown | Estudiante | evidencia insuficiente |
| BR-019 | Ledger append-only | Economía | verified | Sistema | gamificacion-xp-daemons.md |
| BR-020 | Sin doble recompensa | Economía | verified | Sistema | gamificacion-xp-daemons.md |
| BR-021 | Ajustes manuales sin XP | Economía | verified | Docente | gamificacion-xp-daemons.md |
| BR-022 | Canje solo modifica tokens | Economía | verified | Estudiante | gamificacion-xp-daemons.md |
| BR-023 | Validación de stock en backend | Economía | verified | Estudiante | gamificacion-xp-daemons.md |
| BR-024 | Insignias gestionadas por docente | Gamificación | verified | Docente | routes/api.php |
| BR-025 | Compra de cosméticos con DAEMONS | Economía/Gamificación | verified | Estudiante | sistema-mascotas-cosmeticos.md |
| BR-026 | Backend autoridad de equipamiento | Gamificación | verified | Estudiante | sistema-mascotas-cosmeticos.md |
| BR-027 | Cuentos v2 con autoridad Firestore | Creatividad | partial | Estudiante, moderador | ADR-002/003 |
| BR-028 | Publicación con moderación | Creatividad | partial | Estudiante, moderador | routes/api.php |
| BR-029 | Comentarios server-only | Comunidad | partial | Estudiante, moderador | ADR-003 |
| BR-030 | Reacciones con ID determinista | Comunidad | partial | Estudiante | ADR-003 |
| BR-031 | Moderación de reportes | Comunidad | verified | Moderador, admin | routes/api.php |
| BR-032 | Vínculo tutor verificado | Familia | verified | Estudiante, tutor | portal-familias.md |
| BR-033 | Tutor sin contenido privado | Familia | verified | Tutor | portal-familias.md |
| BR-034 | Límite de pantalla | Bienestar | verified | Tutor, estudiante | portal-familias.md |
| BR-035 | Sin datos de pago | Privacidad | verified | Tutor | portal-familias.md |
| BR-036 | Retención 45 días | Privacidad | verified | Sistema | portal-familias.md |
| BR-037 | Exportación y eliminación | Privacidad | verified | Usuario | routes/api.php |
| BR-038 | Sin telemetría invasiva | Privacidad | verified | Sistema | privacidad-kids-teens.md |
| BR-039 | Archivos con ownership | Datos | verified | Todos, admin | ADR-004 |
| BR-040 | Sin credenciales productivas en dev | Operación | verified | Desarrolladores | ADR-006 |
| BR-041 | Notificaciones con marcas | Comunicación | verified | Usuario | routes/api.php |
| BR-042 | Comunidad moderada | Comunidad | verified | Usuario, moderador | routes/api.php |
| BR-043 | Funciones admin con rol admin | Administración | verified | Administrador | routes/api.php |
| BR-044 | Integraciones encapsuladas | Integración | partial | Servicio externo, admin | interoperability.php |
