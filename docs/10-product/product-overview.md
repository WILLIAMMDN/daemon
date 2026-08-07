---
title: DAEMON Product Overview
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

# DAEMON Product Overview

## 1. Autoridad, propósito y alcance

1. Este documento es el candidato de definición global del producto DAEMON
   (FND-3A). Mientras conserve `status: draft`, no autoriza implementación.
2. Describe producto, actores, experiencias, capacidades y estado funcional
   de toda la plataforma, no únicamente del portal estudiante.
3. No modifica arquitectura, no diseña interfaces y no sustituye
   `business-rules.md`.
4. No sustituye la Constitución General del Proyecto
   (`docs/00-governance/project-constitution.md`), que tiene autoridad
   global.
5. La activación como documento canónico requiere aprobación explícita del
   `project-owner` y de `product-reviewer`; ningún agente puede autoaprobarlo.

## 2. Identidad del producto

1. DAEMON es una plataforma educativa digital para niños y adolescentes de
   una academia de tecnología, con aprendizaje gamificado.
2. El aprendizaje se organiza mediante misiones, progreso (XP), recompensas
   (DAEMONS), evaluación, creatividad (cuentos) y acompañamiento.
3. Ofrece experiencias diferenciadas para estudiantes, docentes, familias y
   funciones de administración, además de experiencias públicas, de aula e
   integraciones autorizadas, sobre un núcleo compartido de identidad,
   datos, seguridad, diseño y servicios.
4. La tecnología (Angular, Laravel, Firebase, Supabase) sirve al producto;
   no lo define.
5. DAEMON no es un videojuego, ni una red social de consumo infinito, ni un
   sistema administrativo puro, ni una aplicación preescolar.

## 3. Problema y propuesta de valor

1. Aborda la fragmentación del acompañamiento educativo: aprendizaje,
   práctica, evaluación y supervisión familiar suelen vivir en herramientas
   desconectadas.
2. Integra, en un mismo entorno, aprendizaje por misiones, seguimiento del
   progreso, gamificación y acompañamiento de docentes y familias.
3. Para el estudiante: progresión visible, recompensas y actividades que
   hacen el aprendizaje continuo y medible.
4. Para el docente: gestión académica, evaluación y seguimiento del
   progreso.
5. Para la familia: supervisión del progreso, límites de uso y bienestar
   digital del menor.
6. Para las funciones de administración: control de usuarios, permisos,
   configuración, supervisión y trazabilidad operativa conforme a los
   permisos implementados.
7. La progresión es parte central del producto: el avance del estudiante es
   el eje que conecta misiones, experiencia, niveles, recompensas y
   seguimiento.
8. No se declaran métricas de impacto, alcance nacional o internacional ni
   inclusión territorial, por no existir evidencia documental verificable.

## 4. Usuarios y actores

Se distinguen formalmente:

- **usuario:** identidad de una persona en el sistema (cuenta);
- **actor:** rol funcional que participa en flujos (visitante, estudiante,
  docente, familia, administrador, servicio externo, operador);
- **rol:** posición administrativa o de acceso (`alumno`, `docente`,
  `admin`, `tutor`);
- **nivel:** variante de experiencia del estudiante (`KIDS`, `TEENS`);
- **perfil:** atributos y preferencias de un usuario;
- **permiso:** capacidad concreta otorgada a un rol;
- **portal:** experiencia de navegación de un tipo de usuario;
- **experiencia:** conjunto funcional y visual asociado a un actor;
- **capability:** capacidad funcional del producto.

`rol` y `nivel` no son equivalentes. KIDS y TEENS son variantes de
experiencia del estudiante, no roles.

| Actor | Descripción | Evidencia |
|---|---|---|
| Visitante no autenticado | Accede a páginas públicas, registro y recuperación | rutas `/`, `/registro`, `/recuperar-clave` |
| Estudiante | Usuario principal del aprendizaje gamificado | rutas `/alumno`, rol `alumno` |
| Docente | Gestiona académico, misiones, evaluación, insignias y tienda | rutas `/docente`, rol `docente` |
| Administrador | Administra usuarios, permisos, config, moderación e interoperabilidad | grupos `role:admin` en API |
| Tutor / familia | Supervisa el progreso de un menor con vínculo verificado | rutas `/familias`, rol `tutor` |
| Servicio externo | Integraciones institucionales (OneRoster, LTI) | `routes/interoperability.php` |
| Operador interno / moderador | Resuelve reportes y solicitudes administrativas | grupos `moderacion/admin`, `privacidad/admin` |

## 5. Roles, niveles, perfiles, permisos y portales

| Concepto | Definición | Evidencia | Regla de separación |
|---|---|---|---|
| Rol | Posición administrativa o de acceso | `usuarios.rol` (`alumno`, `docente`, `admin`, `tutor`) | Independiente del nivel |
| Nivel | Variante de experiencia del estudiante | `usuarios.nivel` (`KIDS`, `TEENS`) | No determina el rol |
| Perfil | Atributos y preferencias del usuario | `alumno/perfil`, `editar-perfil` | Personal, no autoritativo |
| Permiso | Capacidad concreta por rol | middleware `role:*` en rutas API | No se deduce del nivel |
| Portal | Experiencia de navegación | layouts `layout-alumno`, `layout-docente`, `layout-tutor` | No equivale a un rol automáticamente |
| Capability | Capacidad funcional | Sección 7 | Puede aparecer en varios portales |

Roles verificados:

| Rol | Propósito | Permisos principales verificados | Portal o experiencia | Estado | Evidencia |
|---|---|---|---|---|---|
| Estudiante | Aprender, avanzar, crear | misiones, entregas, tienda, cuentos, mascota, ranking | Estudiante | implemented | rutas `/alumno`, middleware `role:alumno` |
| Docente | Gestionar, evaluar, acompañar | académico, aulas, misiones, entregas, insignias, tienda, tokens | Docente | implemented | rutas `/docente`, grupos `role:docente,admin` |
| Administrador | Administrar y auditar | alumnos, IA, mascota, archivos, moderación, privacidad, interop | Funciones administrativas | implemented | grupos `role:admin` |
| Tutor / familia | Supervisar y acompañar | invitaciones, panel, límite de pantalla | Familia / tutor | implemented | rutas `/tutor/*`, rol `tutor` |

## 6. Mapa global de experiencias

| ID | Experiencia | Actores | Propósito | Tipo | Capacidades principales | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| EXP-001 | Público y autenticación | Visitante, estudiante, docente, tutor | Informar, registrar, acceder, recuperar cuenta | portal visual | Autenticación, recuperación, verificación | implemented | rutas `/`, `/login`, `/registro`, `/recuperar-clave` |
| EXP-002 | Estudiante | Estudiante | Aprender, progresar, crear, canjear | portal visual | Panel, misiones, XP/DAEMONS, ranking, tienda, cuentos, mascota, chatbot, competencia, comunidad, certificados, laboratorio | implemented | rutas `/alumno/*`, layout-alumno |
| EXP-003 | Docente | Docente, administrador | Gestionar académico, evaluar, acompañar | portal visual | Panel docente, aulas, currículo, misiones, entregas, insignias, tienda, evaluaciones, competencia, tokens | implemented | rutas `/docente/*`, layout-docente |
| EXP-004 | Familia / tutor | Tutor | Supervisar progreso, bienestar, consentimiento | portal visual | Invitaciones, panel familiar, límite de pantalla | implemented | rutas `/familias`, `/tutor/*` |
| EXP-005 | Funciones administrativas | Administrador | Control, auditoría, configuración, operación | función administrativa | Alumnos admin, IA admin, mascota admin, archivos admin, moderación, privacidad admin, interop admin | implemented | grupos `role:admin` en API |
| EXP-006 | Aula | Estudiante, docente | Interacción activa con estado en vivo | experiencia integrada | Layout aula con Firestore (inicio, cursos) | experimental | `layout-aula.ts`; `features/aula` sin páginas enrutadas en `app.routes.ts` |
| EXP-007 | Integraciones institucionales | Servicio externo, administrador | Interoperabilidad OneRoster/LTI | integración | Clientes OneRoster, registros LTI, vínculos | partial | `routes/interoperability.php` |
| EXP-008 | Funciones internas | Operador, moderador, administrador | Moderación, soporte, seguridad, operación | función transversal | Reportes, bloqueos, solicitudes de privacidad, auditoría de tokens | implemented | grupos `moderacion/admin`, `privacidad/admin` |

Nota: `/dev/design-system` es una herramienta interna de desarrollo, no una
experiencia de producto.

## 7. Inventario de capacidades

Revalidación de las 25 capacidades preliminares de FND-1 contra rutas,
features, controladores y documentación vigente.

Valores de las columnas Frontend, Backend, Datos e Integraciones:
`verified`, `partial`, `absent`, `not applicable`, `unknown`.

La columna **Actores** enumera todos los actores que tienen una relación
distinta de `Not applicable` o `Unknown` en la matriz actor-capacidad. La
matriz determina si la relación es Primary, Supporting, Read-only,
Administrative o System.

| ID | Capacidad | Dominio | Actores | Experiencia | Estado | Frontend | Backend | Datos | Integraciones | Evidencia | Riesgo |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CAP-001 | Autenticación y sesión | Identidad | Visitante, Estudiante, Docente, Familia o tutor, Administrador, Operador interno | Público/Auth, Estudiante, Docente, Familia, Administración, Aula | implemented | verified | verified | verified | verified | `/auth/*`, firebase-auth.ts, FirebaseTokenVerifier; proveedor: Firebase Auth; login local observado no aprobado (BR-001, UNK-009) | Medio (desviación de identidad pendiente) |
| CAP-002 | Panel alumno (dashboard, perfil) | Alumno | Estudiante, Docente, Familia o tutor, Administrador | Estudiante | implemented | verified | verified | verified | not applicable | `/alumno`, AlumnoService | Bajo |
| CAP-003 | Misiones y entregas | Académico | Estudiante, Docente, Familia o tutor, Administrador | Estudiante, Docente, Familia, Administración, Aula | implemented | verified | verified | verified | not applicable | `/misiones*`, MisionController | Medio |
| CAP-004 | XP / niveles / DAEMONS (ledger) | Economía | Estudiante, Docente, Familia o tutor, Administrador | Estudiante, Docente, Familia, Administración, Aula | implemented | verified | verified | verified | not applicable | GamificacionService, `movimientos_economia` | Bajo |
| CAP-005 | Ranking por XP | Alumno | Estudiante, Docente, Familia o tutor, Administrador | Estudiante, Docente, Familia, Administración, Aula | implemented | verified | verified | verified | not applicable | `/ranking`, RankingController | Bajo |
| CAP-006 | Tienda / stock / canjes | Economía | Estudiante, Docente, Administrador | Estudiante, Docente, Administración | implemented | verified | verified | verified | not applicable | `/tienda*`, TiendaController | Medio |
| CAP-007 | Insignias | Gamificación | Estudiante, Docente, Familia o tutor, Administrador | Estudiante, Docente, Familia, Administración | implemented | verified | verified | verified | not applicable | `/docente/insignias*` | Bajo |
| CAP-008 | Evaluaciones (live, resultados) | Académico | Estudiante, Docente, Familia o tutor, Administrador | Estudiante, Docente, Familia, Administración, Aula | implemented | verified | verified | verified | not applicable | `/evaluaciones*`, EvaluacionController | Medio |
| CAP-009 | Aulas / académico (cursos, lecciones) | Académico | Estudiante, Docente, Administrador | Estudiante, Docente, Administración, Aula | implemented | verified | verified | verified | not applicable | `/academico`, `/docente/aulas` | Medio |
| CAP-010 | Cuentos v1 (PostgreSQL legacy) | Creatividad | Visitante, Estudiante, Docente, Administrador | Público/Auth, Estudiante, Docente, Administración | deprecated | partial | verified | verified | not applicable | `/cuentos`, CuentoController; sustituido por v2 (transición) | Bajo (transición) |
| CAP-011 | Cuentos v2 (Firestore, galería, editor, IA) | Creatividad | Visitante, Estudiante, Docente, Administrador, Operador interno | Público/Auth, Estudiante, Docente, Administración, Aula | partial | partial | partial | partial | partial | `/cuentos-v2*`, CuentoV2Controller, ADR-002/003; integración: Firestore; despliegue del control plane no verificado | Alto (transición; despliegue remoto unknown) |
| CAP-012 | Comentarios / reacciones cuentos | Comunidad | Estudiante, Docente, Administrador, Operador interno | Estudiante, Docente, Administración, Aula | partial | partial | partial | partial | partial | ADR-003, firestore.rules v2; comentarios server-only; despliegue de rules no verificado | Alto (rules v2 sin despliegue verificado) |
| CAP-013 | Chatbot IA (OpenRouter/Ollama) | IA | Estudiante, Docente, Administrador | Estudiante, Docente, Administración, Aula | implemented | verified | verified | verified | verified | `/chatbot*`, ChatbotService; proveedores: OpenRouter, Ollama | Medio (variable incoherente, GAP-009) |
| CAP-014 | Mascota y cosméticos | Gamificación | Estudiante, Docente, Administrador | Estudiante, Docente, Administración | implemented | verified | verified | verified | not applicable | `/mascota*`, MascotaController | Bajo |
| CAP-015 | Competencia en vivo | Gamificación | Estudiante, Docente, Administrador | Estudiante, Docente, Administración, Aula | implemented | verified | verified | verified | verified | `/competencia*`, CompetenciaLive; integración: Pusher | Medio |
| CAP-016 | Comunidad | Comunidad | Estudiante, Docente, Administrador, Operador interno | Estudiante, Docente, Administración | implemented | verified | verified | verified | not applicable | `/comunidad*` | Medio |
| CAP-017 | Certificados | Académico | Estudiante, Docente, Administrador | Estudiante, Docente, Administración | implemented | verified | verified | verified | not applicable | `/certificados`, CertificadoController | Bajo |
| CAP-018 | Portal familias / tutor | Familia | Estudiante, Familia o tutor, Administrador | Estudiante, Familia, Administración | implemented | verified | verified | verified | verified | `/tutor/*`, TutorPortalController; integración: Firebase (correo verificado) | Medio |
| CAP-019 | Bienestar digital (límites pantalla) | Privacidad | Estudiante, Familia o tutor, Administrador | Estudiante, Familia, Administración | implemented | verified | verified | verified | not applicable | `/bienestar-digital`, UsoPantallaDiario | Bajo |
| CAP-020 | Privacidad (exportar, eliminar, retención) | Privacidad | Estudiante, Docente, Familia o tutor, Administrador, Operador interno | Público/Auth, Estudiante, Docente, Familia, Administración | implemented | verified | verified | verified | not applicable | `/privacidad*`, PrivacidadService | Bajo |
| CAP-021 | Interoperabilidad OneRoster/LTI | Integración | Administrador, Servicio externo | Administración, Integraciones | partial | not applicable | partial | partial | partial | `routes/interoperability.php`; integración: OneRoster, LTI; cobertura funcional no consolidada | Medio |
| CAP-022 | Archivos (Supabase Storage) | Datos | Estudiante, Docente, Administrador, Operador interno | Estudiante, Docente, Administración, Aula | implemented | verified | verified | verified | verified | `/archivos*`, ArchivoService, ADR-004; integración: Supabase Storage | Medio |
| CAP-023 | Notificaciones | Comunicación | Estudiante, Docente, Familia o tutor, Administrador, Operador interno | Estudiante, Docente, Familia, Administración, Aula | implemented | verified | verified | verified | not applicable | `/notificaciones*`, NotificacionController | Bajo |
| CAP-024 | Telemetría (lista cerrada) | Privacidad | Estudiante, Administrador (sistema) | Estudiante, Administración | implemented | verified | verified | verified | not applicable | `/telemetria/eventos`, `EVENTOS_PERMITIDOS` | Bajo |
| CAP-025 | Seguridad comunidad (reportes/bloqueos) | Comunidad | Estudiante, Docente, Administrador, Operador interno | Estudiante, Docente, Administración, Aula | implemented | verified | verified | verified | not applicable | `/comunidad/reportes`, `/comunidad/bloqueos` | Medio |

### Capacidades candidatas fuera del inventario

| ID | Capacidad | Evidencia | Estado |
|---|---|---|---|
| CAND-001 | Herramientas de laboratorio IA (lab-ia, neuro-maze, defensa-ia, entrenamiento) | `features/laboratorio`, rutas `/herramientas/*`; código existe, integración de producto no confirmada | partial |
| CAND-002 | Experiencia de aula Firestore (layout-aula) | `core/layouts/layout-aula`, `features/aula`; sin páginas enrutadas en `app.routes.ts` | experimental |

Estas candidatas quedan pendientes de aprobación del propietario para
incorporarse al inventario oficial.

## 8. Matriz actor-capacidad

Valores: `Primary`, `Supporting`, `Read-only`, `Administrative`, `System`,
`Not applicable`, `Unknown`.

| Capacidad | Visitante | Estudiante | Docente | Familia | Administrador | Operador interno | Servicio externo |
|---|---|---|---|---|---|---|---|
| CAP-001 Autenticación y sesión | Supporting | Primary | Primary | Primary | Primary | System | Not applicable |
| CAP-002 Panel alumno | Not applicable | Primary | Read-only | Read-only | Read-only | Not applicable | Not applicable |
| CAP-003 Misiones y entregas | Not applicable | Primary | Primary | Read-only | Administrative | Not applicable | Not applicable |
| CAP-004 XP / DAEMONS | Not applicable | Primary | Supporting | Read-only | Administrative | Not applicable | Not applicable |
| CAP-005 Ranking | Not applicable | Primary | Supporting | Read-only | Read-only | Not applicable | Not applicable |
| CAP-006 Tienda / canjes | Not applicable | Primary | Primary | Not applicable | Administrative | Not applicable | Not applicable |
| CAP-007 Insignias | Not applicable | Read-only | Primary | Read-only | Administrative | Not applicable | Not applicable |
| CAP-008 Evaluaciones | Not applicable | Primary | Primary | Read-only | Administrative | Not applicable | Not applicable |
| CAP-009 Aulas / académico | Not applicable | Supporting | Primary | Not applicable | Administrative | Not applicable | Not applicable |
| CAP-010 Cuentos v1 | Read-only | Supporting | Administrative | Not applicable | Administrative | Not applicable | Not applicable |
| CAP-011 Cuentos v2 | Read-only | Primary | Supporting | Not applicable | Administrative | Supporting | Not applicable |
| CAP-012 Comentarios / reacciones | Not applicable | Primary | Supporting | Not applicable | Administrative | Supporting | Not applicable |
| CAP-013 Chatbot IA | Not applicable | Primary | Supporting | Not applicable | Administrative | Not applicable | Not applicable |
| CAP-014 Mascota y cosméticos | Not applicable | Primary | Administrative | Not applicable | Administrative | Not applicable | Not applicable |
| CAP-015 Competencia en vivo | Not applicable | Primary | Primary | Not applicable | Administrative | Not applicable | Not applicable |
| CAP-016 Comunidad | Not applicable | Primary | Supporting | Not applicable | Administrative | Supporting | Not applicable |
| CAP-017 Certificados | Not applicable | Primary | Read-only | Not applicable | Administrative | Not applicable | Not applicable |
| CAP-018 Portal familias | Not applicable | Supporting | Not applicable | Primary | Administrative | Not applicable | Not applicable |
| CAP-019 Bienestar digital | Not applicable | Supporting | Not applicable | Primary | Administrative | Not applicable | Not applicable |
| CAP-020 Privacidad | Not applicable | Primary | Primary | Primary | Administrative | Supporting | Not applicable |
| CAP-021 Interoperabilidad | Not applicable | Not applicable | Not applicable | Not applicable | Administrative | Not applicable | Primary |
| CAP-022 Archivos | Not applicable | Supporting | Supporting | Not applicable | Administrative | System | Not applicable |
| CAP-023 Notificaciones | Not applicable | Primary | Primary | Primary | Administrative | System | Not applicable |
| CAP-024 Telemetría | Not applicable | Supporting | Not applicable | Not applicable | System | Not applicable | Not applicable |
| CAP-025 Seguridad comunidad | Not applicable | Supporting | Supporting | Not applicable | Administrative | Primary | Not applicable |

## 9. Matriz portal-capacidad

Valores: `Primary`, `Supporting`, `Read-only`, `Administrative`, `System`,
`Not applicable`, `Unknown`.

| Capacidad | Público/Auth | Estudiante | Docente | Familia | Administración | Aula | Integraciones |
|---|---|---|---|---|---|---|---|
| CAP-001 Autenticación y sesión | Primary | Primary | Primary | Primary | Primary | Primary | Not applicable |
| CAP-002 Panel alumno | Not applicable | Primary | Not applicable | Not applicable | Not applicable | Not applicable | Not applicable |
| CAP-003 Misiones y entregas | Not applicable | Primary | Primary | Read-only | Administrative | Supporting | Not applicable |
| CAP-004 XP / DAEMONS | Not applicable | Primary | Supporting | Read-only | Administrative | Supporting | Not applicable |
| CAP-005 Ranking | Not applicable | Primary | Supporting | Read-only | Read-only | Supporting | Not applicable |
| CAP-006 Tienda / canjes | Not applicable | Primary | Primary | Not applicable | Administrative | Not applicable | Not applicable |
| CAP-007 Insignias | Not applicable | Read-only | Primary | Read-only | Administrative | Not applicable | Not applicable |
| CAP-008 Evaluaciones | Not applicable | Primary | Primary | Read-only | Administrative | Supporting | Not applicable |
| CAP-009 Aulas / académico | Not applicable | Supporting | Primary | Not applicable | Administrative | Primary | Not applicable |
| CAP-010 Cuentos v1 | Read-only | Supporting | Administrative | Not applicable | Administrative | Not applicable | Not applicable |
| CAP-011 Cuentos v2 | Read-only | Primary | Supporting | Not applicable | Administrative | Supporting | Not applicable |
| CAP-012 Comentarios / reacciones | Not applicable | Primary | Supporting | Not applicable | Administrative | Supporting | Not applicable |
| CAP-013 Chatbot IA | Not applicable | Primary | Supporting | Not applicable | Administrative | Supporting | Not applicable |
| CAP-014 Mascota y cosméticos | Not applicable | Primary | Administrative | Not applicable | Administrative | Not applicable | Not applicable |
| CAP-015 Competencia en vivo | Not applicable | Primary | Primary | Not applicable | Administrative | Primary | Not applicable |
| CAP-016 Comunidad | Not applicable | Primary | Supporting | Not applicable | Administrative | Not applicable | Not applicable |
| CAP-017 Certificados | Not applicable | Primary | Read-only | Not applicable | Administrative | Not applicable | Not applicable |
| CAP-018 Portal familias | Not applicable | Supporting | Not applicable | Primary | Administrative | Not applicable | Not applicable |
| CAP-019 Bienestar digital | Not applicable | Supporting | Not applicable | Primary | Administrative | Not applicable | Not applicable |
| CAP-020 Privacidad | Supporting | Primary | Primary | Primary | Administrative | Not applicable | Not applicable |
| CAP-021 Interoperabilidad | Not applicable | Not applicable | Not applicable | Not applicable | Administrative | Not applicable | Primary |
| CAP-022 Archivos | Not applicable | Supporting | Supporting | Not applicable | Administrative | Supporting | Not applicable |
| CAP-023 Notificaciones | Not applicable | Primary | Primary | Primary | Administrative | Supporting | Not applicable |
| CAP-024 Telemetría | Not applicable | Supporting | Not applicable | Not applicable | System | Not applicable | Not applicable |
| CAP-025 Seguridad comunidad | Not applicable | Supporting | Supporting | Not applicable | Administrative | Supporting | Not applicable |

## 10. Núcleo compartido de DAEMON

Global obligatorio:

- identidad y sesión: fundamento global implementado, con contradicción de
  autoridad pendiente por el login local (BR-001 y UNK-009);
- autorización efectiva (Laravel, middleware `role:*`);
- perfiles de usuario;
- notificaciones;
- privacidad, exportación y eliminación;
- archivos con ownership (Supabase Storage + reserva en PostgreSQL);
- seguridad y validación server-side;
- fundamentos visuales (tokens `--daemon-*`, Constitución Visual);
- accesibilidad base;
- manejo de errores y feedback del sistema;
- telemetría de lista cerrada;
- navegación base y componentes comunes realmente reutilizables
  (`core/`, `shared/`).

Compartido configurable:

- densidad, tono y presentación de variantes KIDS/TEENS (tokens y
  configuración);
- presencia de gamificación según experiencia.

Específico de experiencia:

- composición de cada portal (dashboard, navegación, jerarquía);
- prioridad de acciones por actor.

No verificado:

- componentes de aula Firestore (layout-aula, CAND-002).

Regla: compartir sistema no implica compartir composición. No se exige que
todos los portales usen el mismo shell, dashboard ni navegación.

## 11. Responsabilidades específicas por experiencia

| Experiencia | Responsabilidades principales |
|---|---|
| Estudiante | Aprender, avanzar, completar misiones, recibir feedback, crear (cuentos, laboratorio), visualizar progreso, interactuar con gamificación |
| Docente | Gestionar, planificar, asignar, evaluar, revisar, acompañar, analizar progreso |
| Familia / tutor | Comprender progreso, acompañar, supervisar bienestar, gestionar consentimiento o vínculo, recibir información relevante |
| Administración | Gestionar usuarios y permisos, configurar, supervisar, auditar, operar, resolver incidencias administrativas |
| Público y autenticación | Informar, generar confianza, permitir acceso, registrar, recuperar cuenta |
| Aula | Concentrar la actividad vigente, facilitar interacción, mostrar estado relevante, reducir distracción |
| Integraciones | Interoperar, sincronizar, validar contratos, mantener trazabilidad |

Estas responsabilidades combinan capacidades verificadas e intenciones de
producto. El estado de implementación se determina exclusivamente en las
Secciones 6, 7 y 13; esta tabla no declara funcionalidad no verificada.

## 12. Flujos transversales

| FLW-ID | Flujo | Iniciador | Participantes | Experiencias | Autoridad de datos | Estado | Riesgo | Evidencia |
|---|---|---|---|---|---|---|---|---|
| FLW-001 | Registro | Visitante | Visitante, sistema | Público/Auth | Firebase Auth (identidad) + PostgreSQL (perfil de negocio) | implemented | Bajo | `/auth/registro`, AutenticacionService::registrarAlumno |
| FLW-002 | Inicio de sesión | Usuario | Usuario, sistema | Público/Auth | Firebase Auth (autoridad normativa de identidad) + PostgreSQL `password_hash` (flujo local observado, no aprobado como autoridad) + Sanctum (sesión) + Laravel (autorización efectiva) | implemented | Medio | `/auth/login`, `/auth/firebase`, `/auth/google`; ver BR-001, UNK-009 |
| FLW-003 | Recuperación de cuenta | Usuario | Usuario, sistema | Público/Auth | Firebase Auth (recuperación de identidad) + PostgreSQL (sincronización de credencial local observada) | implemented | Medio | `/auth/recuperar`, recuperar-clave |
| FLW-004 | Creación o vinculación de estudiante | Administrador | Admin, sistema | Administración | PostgreSQL | implemented | Bajo | `/auth/usuarios`, `alumnos/admin` |
| FLW-005 | Matrícula / asignación a aula | Docente | Docente, estudiante | Docente, Estudiante | PostgreSQL | implemented | Medio | `/academico/aulas/{aula}/usuarios/{usuario}` |
| FLW-006 | Creación y asignación de misión | Docente | Docente, estudiante | Docente, Estudiante | PostgreSQL | implemented | Medio | `/misiones` (store) |
| FLW-007 | Entrega | Estudiante | Estudiante, sistema | Estudiante | PostgreSQL | implemented | Medio | `/misiones/{mision}/entregar` |
| FLW-008 | Revisión | Docente | Docente, sistema | Docente | PostgreSQL | implemented | Medio | `/misiones/entregas/{entrega}/revisar` |
| FLW-009 | Evaluación | Estudiante | Estudiante, docente | Estudiante, Docente | PostgreSQL | implemented | Medio | `/evaluaciones/{evaluacion}/responder` |
| FLW-010 | Publicación de resultados | Docente | Docente, estudiante | Docente, Estudiante | PostgreSQL | implemented | Medio | evaluaciones, resultados |
| FLW-011 | Progreso / XP | Sistema | Sistema, estudiante | Estudiante, Docente | PostgreSQL (GamificacionService) | implemented | Bajo | gamificacion-xp-daemons.md, GamificacionService |
| FLW-012 | DAEMONS / economía | Sistema | Sistema, estudiante | Estudiante, Docente | PostgreSQL (`movimientos_economia`) | implemented | Bajo | gamificacion-xp-daemons.md, migración ledger |
| FLW-013 | Tienda | Estudiante | Estudiante, sistema | Estudiante | PostgreSQL | implemented | Medio | `/tienda` |
| FLW-014 | Canje | Estudiante | Estudiante, sistema | Estudiante | PostgreSQL | implemented | Medio | `/tienda/canjear/{premio}` |
| FLW-015 | Cuentos (creación) | Estudiante | Estudiante, sistema | Estudiante | Firestore (v2) / PostgreSQL (v1) | partial | Alto | cuentos v2, ADR-002; despliegue no verificado |
| FLW-016 | Publicación de cuentos | Estudiante, moderador | Estudiante, moderador | Estudiante | Firestore | partial | Alto | `/cuentos-v2/{id}/publicacion` |
| FLW-017 | Comentarios | Estudiante | Estudiante, sistema | Estudiante | Firestore | partial | Alto | `/cuentos-v2/{id}/comentarios` |
| FLW-018 | Reacciones | Estudiante | Estudiante, sistema | Estudiante | Firestore | partial | Alto | `/cuentos-v2/{id}/reaccion` |
| FLW-019 | Moderación | Usuario, moderador | Usuario, moderador, admin | Funciones internas | PostgreSQL | implemented | Medio | `/comunidad/reportes`, `/moderacion/admin` |
| FLW-020 | Vínculo familiar | Estudiante, tutor | Estudiante, tutor, sistema | Familia, Estudiante | PostgreSQL (HMAC) | implemented | Medio | portal-familias.md |
| FLW-021 | Consentimiento | Tutor | Tutor, sistema | Familia | PostgreSQL | implemented | Medio | `/tutor/invitaciones/{id}/aceptar` |
| FLW-022 | Notificaciones | Sistema | Sistema, usuarios | Transversal | PostgreSQL | implemented | Bajo | `/notificaciones*` |
| FLW-023 | Privacidad / exportación | Usuario | Usuario, sistema | Transversal | PostgreSQL | implemented | Bajo | `/privacidad/exportar` (throttle:3,60) |
| FLW-024 | Eliminación | Usuario | Usuario, admin | Transversal | PostgreSQL | implemented | Bajo | `/privacidad/eliminacion` (throttle:3,60) |
| FLW-025 | Archivos | Usuario | Usuario, sistema | Transversal | Supabase Storage + PostgreSQL | implemented | Medio | `/archivos*`, ADR-004 |
| FLW-026 | Reportes / incidencias | Usuario | Usuario, moderador | Funciones internas | PostgreSQL | implemented | Medio | `/comunidad/reportes` |
| FLW-027 | Integraciones institucionales | Sistema externo | Sistema externo, admin | Integraciones | PostgreSQL | partial | Medio | `routes/interoperability.php`; cobertura funcional experimental, no consolidada |

## 13. Estado funcional del producto

| Dominio | Implemented | Partial | Experimental | Deprecated | Planned | Unknown | Riesgo principal |
|---|---|---|---|---|---|---|---|
| Identidad y acceso | CAP-001 | — | — | — | — | — | Medio (desviación de identidad pendiente, BR-001/UNK-009) |
| Alumno | CAP-002, 005, 013, 014, 016, 017 | CAND-001 | — | — | — | — | Bajo |
| Académico | CAP-003, 008, 009 | — | — | — | — | — | Medio |
| Economía | CAP-004, 006 | — | — | — | — | — | Bajo |
| Gamificación | CAP-007, 015 | — | — | — | — | — | Bajo |
| Creatividad (cuentos) | — | CAP-011, 012 | — | CAP-010 | — | — | Alto (transición Firestore; despliegue no verificado) |
| Familia | CAP-018, 019 | — | — | — | — | — | Medio |
| Privacidad | CAP-020, 024 | — | — | — | — | — | Bajo |
| Comunidad | CAP-016, 025 | — | — | — | — | — | Medio |
| Archivos | CAP-022 | — | — | — | — | — | Medio |
| Comunicación | CAP-023 | — | — | — | — | — | Bajo |
| Integraciones | — | CAP-021 | — | — | — | — | Medio |
| Aula (CAND-002) | — | — | experimental | — | — | — | Medio (no enrutado; no pertenece al inventario oficial) |

Nota: la fila Aula usa la capacidad candidata CAND-002, que todavía no
pertenece al inventario oficial de capacidades. Esta tabla no constituye una
estimación porcentual de madurez productiva y no declara producción remota
verificada.

## 14. Intenciones de experiencia por portal

Los valores de frecuencia, densidad, gamificación, ilustración y tono son
**intenciones de producto** ("product intent"), no resultados de analítica
ni decisiones visuales finales.

| Experiencia | Objetivo principal | Frecuencia estimada | Densidad necesaria | Criticidad de acciones | Gamificación | Ilustración | Tono | Evidencia |
|---|---|---|---|---|---|---|---|---|
| Público/Auth | Informar, acceder, registrar | product intent: baja | product intent: baja | media | no aplicable (product intent) | contextual (product intent) | confiable (product intent) | rutas públicas |
| Estudiante | Aprender, progresar, crear | product intent: alta | product intent: media | media | central (product intent) | prominente (product intent) | motivacional (product intent) | portal-alumno.md |
| Docente | Gestionar, evaluar, acompañar | product intent: alta | product intent: alta | alta | contextual (product intent) | mínima (product intent) | operativo, eficiente (product intent) | rutas docente |
| Familia | Comprender, supervisar, acompañar | product intent: media | product intent: baja | media | mínima (product intent) | contextual (product intent) | simple, confiable (product intent) | portal-familias.md |
| Administración | Controlar, auditar, operar | product intent: media | product intent: alta | alta | no aplicable (product intent) | mínima (product intent) | denso, preciso (product intent) | rutas admin |
| Aula | Concentrar, interactuar | product intent: alta | product intent: media | alta | contextual (product intent) | mínima (product intent) | enfocado (product intent) | layout-aula (experimental) |
| Integraciones | Interoperar, sincronizar | product intent: baja | product intent: alta | media | no aplicable (product intent) | no aplicable (product intent) | técnico (product intent) | interoperability.php |

Las frecuencias, densidades, niveles de ilustración y tonos de esta tabla
son intenciones de producto, no resultados de analítica ni decisiones
visuales finales. No se declara dispositivo predominante sin evidencia.

## 15. Requisitos de diferenciación entre portales

1. Existe una marca DAEMON compartida.
2. Existe un sistema visual compartido (Constitución Visual, tokens).
3. Cada experiencia tiene un perfil funcional y visual propio.
4. Compartir marca no implica compartir composición.
5. El docente no debe parecer una variante infantil del estudiante.
6. La familia no debe heredar complejidad operativa del docente.
7. La administración no debe adoptar gamificación decorativa.
8. El estudiante no debe adoptar una interfaz administrativa densa.
9. El público no debe copiar el dashboard interno.
10. El aula debe priorizar concentración y estado activo.
11. KIDS y TEENS comparten producto y componentes base, y pueden variar en
    tono, densidad y presentación mediante tokens y configuración.
12. La diferenciación visual nunca puede duplicar reglas de negocio,
    servicios ni datos.

| Experiencia | Debe transmitir | Debe priorizar | Puede compartir | Debe diferenciar | No debe parecer |
|---|---|---|---|---|---|
| Público/Auth | Confianza, acceso | Registro y recuperación | Marca, sistema visual | Contenido, densidad | Dashboard interno |
| Estudiante | Motivación, progreso | Misiones, feedback, recompensas | Núcleo, tokens, componentes | Composición, tono, gamificación | Interfaz administrativa |
| Docente | Eficiencia, control | Gestión, evaluación, seguimiento | Núcleo, tokens | Densidad, jerarquía, flujos | Variante infantil |
| Familia | Claridad, bienestar | Progreso, límites, consentimiento | Núcleo, tokens | Superficie, tono, información | Dashboard docente |
| Administración | Precisión, trazabilidad | Auditoría, configuración, operación | Núcleo, tokens | Densidad, ausencia de gamificación | Gamificación estudiantil |
| Aula | Concentración, estado | Actividad vigente, respuesta rápida | Núcleo, tokens | Composición, inmediatez | Panel administrativo |
| Integraciones | Interoperabilidad, trazabilidad | Contratos, sincronización | API, datos | Superficie (API), contratos | UI de consumo |

No se definen colores por portal, valores hexadecimales, layouts,
wireframes ni componentes visuales definitivos en este documento.

## 16. Dependencias y restricciones

1. Constitución General (`project-constitution.md`, canonical v1.0).
2. ADR vigentes (ADR-001..006).
3. Fuente de verdad de datos (ADR-001: PostgreSQL negocio, Firestore cuentos
   v2, Firebase Auth identidad, Supabase Storage archivos). Nota: el login
   local por `password_hash` es una desviación técnica observada, no una
   autoridad normativa aprobada; se registra como contradicción pendiente
   (ver `business-rules.md` BR-001 y UNK-009).
4. Autenticación y autorización (Firebase Auth + Sanctum + middleware
   `role:*`).
5. Protección de menores (privacidad-kids-teens.md).
6. Constitución Visual (autoridad máxima solo en el dominio visual).
7. Arquitectura pendiente FND-4 (`system-architecture.md`,
   `backend-architecture.md`).
8. Datos, seguridad y operaciones pendientes FND-5.
9. Calidad pendiente FND-6 (`quality-gates.md`).
10. GAP-005 (`.env` local apunta a producción; desarrollo local bloqueado).
11. GAP-009 (variable de entorno IA incoherente: `OPENROUTER_API_KEY` vs
    `OPENROUTER_API_KEY_NUEVA`).
12. Estado remoto no verificado: no se declara disponibilidad productiva de
    los servicios ni despliegue de reglas o control plane no confirmados.

Este documento no cierra brechas; solo registra dependencias.

## 17. Riesgos e incertidumbres

| ID | Riesgo o incertidumbre | Impacto | Evidencia faltante | Fase o responsable |
|---|---|---|---|---|
| R-01 | Cuentos v2 (control plane Firestore): despliegue no verificado | Alto | Estado de despliegue remoto (unknown) | FND-4/5 + propietario |
| R-02 | Reglas Firestore v2: despliegue no verificado | Alto | Estado de despliegue (unknown) | FND-5 |
| R-03 | Experiencia de aula Firestore sin páginas enrutadas | Medio | Ruta activa en frontend | FND-4 |
| R-04 | Interoperabilidad OneRoster/LTI parcial | Medio | Cobertura funcional | FND-4/5 |
| R-05 | Variable OpenRouter incoherente (GAP-009) | Medio | Variable real en Render | Propietario + FND-5 |
| R-06 | Entorno local bloqueado (GAP-005) | Medio | Configuración local | Propietario |
| R-07 | Estado remoto no validado | Alto | Verificación de producción | FND-5/operaciones |
| R-08 | Capacidades candidatas CAND-001/002 no aprobadas | Bajo | Decisión del propietario | Propietario |
| R-09 | Login local observado (`password_hash`) como desviación frente a la autoridad normativa Firebase Auth (BR-001) | Medio | Decisión de gobernanza sobre identidad | Propietario + FND-4/5 |

## 18. Prioridad propuesta de transformación

Esta propuesta respeta los gates del plan de fundación. **No es una
autorización de implementación.**

| Orden | Frente | Alcance | Dependencias | Beneficio | Riesgo | Gate de inicio |
|---|---|---|---|---|---|---|
| 1 | FND-4 — Arquitectura global | system-architecture, backend-architecture, fronteras e integraciones, estado arquitectónico de cuentos y aula | Constitución, ADR vigentes, FND-3 aprobado | Resuelve incertidumbres estructurales (cuentos v2, aula, interop) | Alto | FND-3 aprobado |
| 2 | FND-5 — Datos, seguridad y operaciones | data-ownership, entity-catalog, security-baseline, threat-model, environments, operations-runbook; GAP-005 y GAP-009 por el propietario | FND-4 | Reduce riesgos de datos, seguridad y operación | Alto | FND-4 |
| 3 | FND-6 — Calidad y preparación de agentes | quality-gates, testing strategy, Definition of Done, archivos protegidos y stop conditions | FND-4/5 | Cambio seguro y agentes preparados | Bajo | FND-5 |
| 4 | Cold Start final | Revalidación de preparación; objetivo documental de gobernanza | FND-2..6 | Confirma madurez de agentes | Bajo | FND-6 |
| 5 | UXA-1 — Arquitectura de experiencias | Perfiles por portal, navegación, shells, jerarquía, responsive, componentes compartidos; diferenciación estudiante/docente/familia/admin/público/aula | FND-4..6, Constitución Visual | Define experiencia sin duplicar lógica | Medio | Cold Start final |
| 6 | Implementación del sistema compartido | tokens, fundamentos, componentes base, seguridad y accesibilidad | UXA-1 | Base visual y funcional estable | Bajo | UXA-1 |
| 7 | Transformación de portales | Orden decidido después de UXA-1; ningún portal se copia indiscriminadamente a otro | UXA-1, sistema compartido | Diferenciación por portal | Medio | Implementación compartida |
| 8 | Transformación de módulos y flujos | Priorización por riesgo, dependencias, valor y evidencia | Portales | Mejora incremental | Medio | Portales |

Aclaraciones:

- No se implementan shells antes de FND-4.
- No se inicia transformación productiva completa antes de controlar los P0
  aplicables:
  - GAP-003 — ownership de datos;
  - GAP-004 — seguridad baseline / threat model;
  - GAP-005 — entorno local productivo;
  - GAP-009 — variable OpenRouter incoherente.
- GAP-001 está cerrado (FND-2B).
- GAP-002 se resolverá mediante la aprobación y activación de FND-3; es P1,
  no P0.
- El estudiante puede servir posteriormente como referencia de componentes,
  pero su composición no se copia en docente, familia o administración.
- No se redefinen colores ni interfaces en este documento.

## 19. Límites del documento

1. No define interfaces, colores, layouts ni componentes.
2. No modifica arquitectura ni código.
3. No sustituye `business-rules.md` ni la Constitución.
4. No activa documentos ni cierra brechas.
5. Las decisiones de composición visual se desarrollarán en UXA-1,
   respetando la Constitución Visual y los tokens aprobados.

## 20. Revisión, versionado y changelog

1. Revisión al menos semestral o ante un cambio estructural del producto.
2. Versión mayor para ruptura; versión menor para ampliación compatible.
3. Corrección editorial sin cambio normativo.
4. Aprobación explícita; no existe aprobación silenciosa.

| Fecha | Versión | Estado | Cambio | Aprobaciones |
|---|---|---|---|---|
| 2026-08-06 | 1.0-candidate | draft | Creación del candidato FND-3A | Pendiente |
| 2026-08-06 | 1.0-candidate | draft | Corrección R1: taxonomía, matrices, despliegue, intenciones y prioridad | Pendiente |
| 2026-08-06 | 1.0-candidate | draft | Corrección R2: autoridad de identidad, actores vs matrices, candidatas, invariantes y P0 | Pendiente |

## Apéndice A. Matriz de evidencia

| Afirmación o elemento | Tipo de evidencia | Fuente | Estado de confianza |
|---|---|---|---|
| Plataforma educativa gamificada | Active documentation | README, Constitución §2 | high |
| Roles `alumno`, `docente`, `admin`, `tutor` | Verified code | `usuarios.rol`, middleware `role:*` | high |
| Niveles `KIDS`/`TEENS` separados del rol | Verified code | `usuarios.nivel`, `nivel-alumno.ts` | high |
| Firebase Auth como identidad | Accepted ADR | ADR-001, firebase-auth.md | high |
| Login local observado (`password_hash`), desviación frente a ADR-001 | Verified code | `AutenticacionService::intentarLogin` | high (desviación no aprobada; UNK-009) |
| PostgreSQL como datos de negocio | Accepted ADR | ADR-001, supabase-postgres.md | high |
| Firestore autoridad de cuentos v2 | Accepted ADR | ADR-002, ADR-003 | high (transición; despliegue no verificado) |
| Supabase Storage para archivos | Accepted ADR | ADR-004 | high |
| Fail-closed de entornos | Accepted ADR | ADR-006, ENVIRONMENTS.md | high |
| Portal alumno implementado | Verified code | `app.routes.ts`, features/alumno | high |
| Portal docente implementado | Verified code | `app.routes.ts`, features/docente | high |
| Portal familias implementado | Verified code | `app.routes.ts`, features/familias | high |
| Funciones administrativas por API | Verified code | grupos `role:admin` en api.php | high |
| Aula Firestore experimental | Verified code | `layout-aula.ts`, features/aula sin rutas | medium |
| Interoperabilidad parcial | Verified code | `routes/interoperability.php` | medium |
| Ledger de movimientos con idempotencia | Verified data model | migración `movimientos_economia` (`clave_idempotencia` unique, sin `updated_at`) | high |
| Lista cerrada de telemetría | Verified code | `ProductoAnalyticsService::EVENTOS_PERMITIDOS`, `TelemetriaController` | high |
| Retención 45 días | Verified code | `AplicarRetencionPrivacidad`, `config/privacy.php` | high |
| Cuentos v2: despliegue no verificado | Unknown | FND-1 limitación; sin prueba remota | low |
| Estado remoto no verificado | Unknown | FND-1 limitación | low |

## Apéndice B. Términos funcionales

| Término | Definición | Evidencia | Estado |
|---|---|---|---|
| XP | Experiencia permanente que ordena el ranking y calcula el nivel | gamificacion-xp-daemons.md, GamificacionService | defined |
| DAEMONS | Saldo gastable (`usuarios.tokens`), independiente de XP | gamificacion-xp-daemons.md | defined |
| Misión | Tarea académica asignada al estudiante con recompensa dual | MisionController, portal-alumno | defined |
| Entrega | Evidencia enviada por el estudiante para revisión | `/misiones/{id}/entregar` | defined |
| Evaluación | Examen con estados y resultados | EvaluacionController | defined |
| Nivel de progresión | Nivel de gamificación calculado por experiencia | UsuarioResource (`nivel_gamificacion`) | defined |
| Racha | Secuencia de días con actividad | No verificado en fuentes | unknown |
| Logro | Reconocimiento de progreso | No diferenciado de insignia en fuentes | unknown |
| Insignia | Reconocimiento creado y asignado por el docente | `/docente/insignias*` | defined |
| Tienda | Catálogo de premios canjeables con DAEMONS | TiendaController | defined |
| Canje | Transacción que descuenta tokens y otorga el premio | `/tienda/canjear/{premio}` | defined |
| Cuento | Historia creada por el estudiante (v1 legacy / v2 Firestore) | CuentoController, CuentoV2Controller | defined (transición) |
| Publicación | Acción que hace visible un cuento tras revisión | `/cuentos-v2/{id}/publicacion` | partial |
| Tutor | Rol de familiar o adulto responsable verificado | portal-familias.md | defined |
| Vínculo familiar | Relación verificada entre tutor y estudiante | `tutores_alumnos`, consentimiento | defined |
| Aula | Grupo académico gestionado por el docente | `/docente/aulas`, `/academico` | defined |
| Curso | Unidad académica del currículo con unidades y lecciones | AcademicoController | defined |
| Capability | Capacidad funcional del producto | Sección 7 de este documento | defined |
| Núcleo DAEMON | Personaje/mascota de la plataforma | sistema-mascotas-cosmeticos.md | defined |
