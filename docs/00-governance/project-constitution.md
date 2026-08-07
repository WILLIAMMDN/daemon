---
title: Constitución General del Proyecto DAEMON
status: canonical
normative: true
version: 1.0
owner: project-owner
phase: FND-2B
created: 2026-08-06
last_reviewed: 2026-08-06
approved_on: 2026-08-06
applies_to: all
approvals:
  project-owner: approved
  technical-reviewer: approved
supersedes: null
---

# Constitución General del Proyecto DAEMON

Este documento es la autoridad global del proyecto DAEMON, aprobada por el
propietario en FND-2B. Es normativa, tiene precedencia global y obliga a
todos los dominios, personas y agentes. No sustituye los documentos
especializados y no puede modificarse sin el proceso formal definido en la
Sección 19.

## 1. Autoridad, propósito y alcance

1. La Constitución es la autoridad global de mayor nivel de DAEMON,
   aprobada por el propietario del proyecto (FND-2B).
2. Obliga a todos los dominios —producto, arquitectura, datos, seguridad,
   diseño visual, operaciones, calidad— y a todas las personas y agentes
   (humanos o de IA) que trabajen en el repositorio.
3. No sustituye los documentos especializados de cada dominio. Define el
   "qué", el "porqué" y los límites globales; los documentos de dominio
   definen el detalle.
4. Ningún documento especializado puede contradecir la Constitución. Si un
   documento de dominio contradice una regla constitucional, prevalece la
   Constitución y el conflicto se resuelve según la Sección 20.
5. No puede ser modificada ni derogada sin el proceso formal definido en la
   Sección 19. Un documento de dominio que la contradiga se marca como
   conflicto y se resuelve según la Sección 20.
6. Ningún agente (humano o de IA) puede autoaprobar la Constitución,
   modificar su estado documental ni crear excepciones sin autorización
   explícita del propietario.

La Constitución distingue los siguientes tipos de autoridad documental:

| Tipo | Descripción | Ejemplo |
|---|---|---|
| Autoridad global | Documento de mayor precedencia del proyecto | Constitución General |
| Autoridad de dominio | Documento canónico único de un dominio | product-overview.md (futuro), frontend-architecture.md, security-baseline.md (futuro) |
| Referencia técnica | Documento verificable que describe estado, no decisión | api-crud, supabase-postgres |
| Iniciativa temporal | Documentación de trabajo en curso, no permanente | 80-initiatives/* |
| Evidencia histórica | Registro del pasado, sin autoridad normativa | 90-audits-history, 99-archive |

## 2. Identidad del producto

1. DAEMON es una plataforma educativa digital para niños, niñas y
   adolescentes, diseñada para una academia de tecnología.
2. El aprendizaje se estructura mediante gamificación: misiones, progreso,
   experiencia (XP), recompensas y economía interna.
3. DAEMON ofrece portales diferenciados para estudiantes, docentes y
   familias, sobre una base compartida de lógica, datos y componentes.
4. Incluye componentes de aprendizaje, progreso, evaluación,
   acompañamiento, creatividad (cuentos) y bienestar digital.
5. La relación estudiante–docente–familia es parte central del producto:
   los docentes acompañan y evalúan; las familias supervisan y acompañan;
   los estudiantes avanzan y crean.
6. DAEMON ofrece experiencias diferenciadas para estudiantes, docentes,
   familias y funciones de administración, además de experiencias públicas,
   de aula e integraciones autorizadas cuando correspondan, sobre un núcleo
   compartido de identidad, datos, seguridad, diseño y servicios.
7. DAEMON no es un videojuego, no es una red social de consumo infinito, no
   es un sistema administrativo puro, no es una aplicación preescolar y no
   es una demostración técnica. Su tecnología (Angular, Laravel, Firebase,
   Supabase) sirve al producto; no lo define.

La lista detallada de capacidades del producto pertenece a
`product-overview.md` (FND-3) y no se reproduce en esta Constitución.

## 3. Problema y propuesta de valor

1. DAEMON aborda la fragmentación del acompañamiento educativo: los
   materiales de aprendizaje, la práctica, la evaluación y la supervisión
   familiar suelen vivir en herramientas separadas y desconectadas.
2. La propuesta de valor integra, en un mismo entorno, el aprendizaje por
   misiones, el seguimiento del progreso, la gamificación y el
   acompañamiento de docentes y familias.
3. Para el estudiante, ofrece progresión visible (XP, niveles, logros),
   recompensas y actividades que hacen el aprendizaje continuo y medible.
4. Para el docente, ofrece gestión académica, evaluación y seguimiento del
   progreso de sus estudiantes.
5. Para la familia, ofrece supervisión del progreso, límites de uso y
   acompañamiento del bienestar digital del menor.
6. La progresión es parte central del producto: el avance del estudiante es
   el eje que conecta misiones, experiencia, niveles, recompensas y
   seguimiento.
7. Para las funciones de administración, DAEMON ofrece control de usuarios,
   permisos, configuración, supervisión y trazabilidad operativa conforme a
   los permisos implementados. No se declara un portal administrativo
   independiente más allá de lo que el código confirme.
8. Esta Constitución no declara métricas de impacto, alcance nacional o
   internacional, ni inclusión territorial alguna, por no existir evidencia
   documental vigente y verificable que las sustente.

## 4. Usuarios, roles, niveles y portales

Esta sección distingue formalmente los siguientes conceptos:

- **Usuario:** identidad de una persona en el sistema (cuenta).
- **Rol:** posición administrativa o de acceso de un usuario en el sistema.
- **Nivel de experiencia (audiencia):** variante de experiencia KIDS o
  TEENS de un estudiante sobre una base compartida.
- **Portal:** experiencia de navegación y funcionalidades asociadas a un
  tipo de usuario.
- **Permiso:** capacidad concreta otorgada a un rol para realizar una
  operación.
- **Perfil:** conjunto de atributos y preferencias de un usuario.

Regla obligatoria: **`rol` y `nivel` son conceptos diferentes y
permanecen separados.**

Los roles documentados en las fuentes son, como mínimo:

| Rol | Descripción | Fuente |
|---|---|---|
| Estudiante | Usuario principal del aprendizaje gamificado | rutas `/alumno`, modelos |
| Docente | Gestiona académico, misiones, evaluación e insignias | rutas `/docente` |
| Administrador | Administración del sistema y de datos | backend, roles |
| Tutor / familia | Supervisa el progreso de un menor con consentimiento y vínculo | rol `tutor`, portal `/familias` |

KIDS y TEENS **no son roles administrativos**: son variantes o niveles de
experiencia de los estudiantes sobre una base compartida (Sección 12).

Los portales se describen a nivel conceptual: público, estudiante,
docente, familias y aula. El detalle de rutas pertenece a la
documentación de frontend y a `product-overview.md`.

## 5. Alcance del producto

El alcance constitucional se organiza en categorías generales:

- **Aprendizaje:** contenidos, actividades y práctica guiada.
- **Misiones y progreso:** misiones, entregas, XP, niveles y logros.
- **Economía y recompensas:** DAEMONS, tienda y canjes, con trazabilidad.
- **Evaluación:** evaluaciones y resultados.
- **Cuentos y creatividad:** creación, edición, lectura, comentarios y
  reacciones, con asistencia de IA.
- **Acompañamiento familiar:** portal de familias, vínculo y supervisión.
- **Comunidad:** interacción moderada entre usuarios.
- **Administración académica:** aulas, cursos y gestión docente.
- **Privacidad y bienestar:** exportación, eliminación, límites de pantalla
  y protección de menores.
- **Integraciones autorizadas:** identidad, almacenamiento, mensajería y
  servicios externos aprobados.

Una capability no se declara productiva si el estudio de fundación
(FND-1) la clasificó como parcial, experimental, deprecada, no desplegada
o no verificada. La lista detallada de capabilities y su estado pertenece
a `product-overview.md` (FND-3).

## 6. Fuera de alcance y no objetivos

DAEMON no busca ser, y no se debe construir como:

1. Una red social de consumo infinito ni de navegación sin límite.
2. Un videojuego cuyo objetivo sea la retención por encima del aprendizaje.
3. Dos productos duplicados para KIDS y TEENS (una sola base compartida,
   Sección 12).
4. Una plataforma donde el frontend pueda omitir la autorización del
   backend (Sección 9 y 11).
5. Un repositorio de experimentos sin gobernanza ni documentación.
6. Un conjunto de microservicios sin necesidad comprobada y sin aprobación.
7. Una plataforma donde un mismo dato tenga múltiples fuentes de verdad sin
   transición explícita (Sección 10).
8. Un sistema donde el diseño visual sustituya o anule reglas de producto,
   seguridad o accesibilidad (Sección 13).

## 7. Principios globales

1. **Producto antes que tecnología.** La tecnología sirve al producto; no
   se adoptan tecnologías por preferencia de un agente.
2. **Evidencia antes que suposición.** Las afirmaciones verificables se
   contrastan con código, configuración o documentación canónica.
3. **Una fuente de verdad por dominio.** Cada dominio tiene un documento
   canónico (Sección 17).
4. **Una autoridad de datos por entidad.** Cada dato tiene un sistema de
   registro y escritores definidos (Sección 10).
5. **Seguridad y privacidad por defecto.** Se aplican mínimo privilegio,
   validación server-side y no exposición de secretos.
6. **Accesibilidad por defecto.** Las experiencias deben ser accesibles y
   no degradarse entre variantes.
7. **Una base compartida KIDS/TEENS.** No se duplican páginas, lógica ni
   sistemas por audiencia (Sección 12).
8. **Evolución incremental.** Los cambios son pequeños, revisables y
   verificables; no se realizan reescrituras sin decisión.
9. **Decisiones importantes mediante ADR.** Los cambios estructurales se
   registran como decisiones aceptadas (Sección 18).
10. **Cambios limitados al alcance autorizado.** Ningún agente amplía el
    alcance de una tarea sin autorización.
11. **Calidad verificable.** Un cambio se considera terminado cuando pasa
    las validaciones aplicables (Sección 15).
12. **Documentación como parte del sistema.** La documentación canónica se
    mantiene alineada con el código.
13. **Producción protegida por fail-closed.** Ante configuración insegura,
    el sistema bloquea antes que degradar (Sección 14).
14. **Ningún agente se autoautoriza.** Ni aprueba sus propias decisiones ni
    activa documentos que requieren aprobación.

## 8. Invariantes del sistema

Los siguientes invariantes están verificados o aprobados en las fuentes y
no pueden relajarse sin un cambio constitucional o un ADR, según aplique:

1. KIDS y TEENS comparten lógica, datos, rutas y componentes base.
2. No se duplican páginas ni sistemas por audiencia.
3. `rol` y `nivel` permanecen separados (Sección 4).
4. Identidad y autorización no son equivalentes: autenticarse no otorga
   permisos que el rol no tenga.
5. Las modificaciones de XP, DAEMONS o economía usan servicios de dominio
   con trazabilidad; no se escriben directamente desde el frontend.
6. Los datos no pueden tener múltiples fuentes de verdad sin una transición
   explícita y documentada.
7. Un cambio de autoridad de datos requiere ADR.
8. Un cambio mayor de autenticación requiere ADR.
9. Las reglas de seguridad no se relajan sin aprobación.
10. El frontend no puede omitir los controles de autorización del backend.
11. Los secretos no se almacenan en el repositorio.
12. Los entornos locales no deben apuntar a recursos productivos.
13. La producción se protege mediante barreras fail-closed.
14. El sistema visual se rige por su Constitución Visual dentro del dominio
    visual (Sección 13).
15. Las auditorías y el historial no son fuentes normativas.
16. Un cambio no se considera terminado sin las validaciones aplicables.

No se transforman recomendaciones futuras en invariantes actuales: una
regla solo es invariante si está verificada o aprobada en las fuentes.

## 9. Fronteras de arquitectura

El baseline actual verificado es:

| Frontera | Tecnología |
|---|---|
| Frontend | Angular (SPA, standalone, zoneless) |
| Backend | Laravel (API REST, Sanctum) |
| Identidad | Firebase Authentication |
| Datos de negocio | Supabase PostgreSQL |
| Agregado de cuentos v2 | Firestore |
| Archivos de negocio | Supabase Storage |
| Alojamiento frontend | Firebase Hosting |
| Alojamiento backend | Render |

Reglas de frontera:

1. Las versiones actuales son un baseline, no la identidad del producto.
2. Un cambio de framework principal o de proveedor requiere evaluación y
   ADR (Sección 18).
3. El frontend no sustituye al backend en reglas de negocio protegidas ni
   en operaciones privilegiadas.
4. El backend gobierna las operaciones privilegiadas y la autorización
   efectiva.
5. Las integraciones externas deben estar encapsuladas detrás de servicios
   y adaptadores; no se acoplan al dominio directamente.
6. No se introduce una tecnología nueva por preferencia de un agente ni por
   moda; requiere necesidad comprobada y aprobación.
7. No se crean microservicios sin necesidad y aprobación.

El detalle C4 (System Context, Container, Deployment, integraciones)
pertenece a `system-architecture.md` (FND-4).

## 10. Autoridad y ciclo de vida de los datos

1. **Firebase Auth** es la autoridad de identidad (verificación de
   credenciales y correo).
2. **PostgreSQL (Supabase)** es la autoridad de los datos de negocio, salvo
   excepción documentada.
3. **Firestore** es la autoridad del agregado de cuentos v2, según el ADR
   vigente; su control plane está en transición y no se declara desplegado
   sin evidencia.
4. **Supabase Storage** es el almacenamiento de archivos de negocio según
   el modelo aprobado (metadata y ownership permanecen trazables).
5. La metadata y el ownership de los datos permanecen trazables.
6. Toda transición entre tecnologías debe declarar autoridad, lectores,
   escritores y condición de finalización de la transición.
7. El dual-write no se permite sin diseño explícito y ADR.
8. Las migraciones requieren respaldo, revisión y ejecución segura; se
   prefiere el modo seco y la revisión previa.
9. Los datos productivos no se usan como entorno local ni como datos de
   prueba.
10. Un cambio de fuente de verdad requiere ADR (Sección 18).

El detalle por entidad (catálogo, lectores, escritores, retención)
pertenece a `data-ownership.md` y `entity-catalog.md` (FND-5). Esta
Constitución no documenta todas las entidades ni inventa políticas de
retención.

## 11. Seguridad, privacidad y protección de menores

1. **Seguridad por defecto:** la configuración segura es el estado
   predeterminado.
2. **Mínimo privilegio:** cada rol y servicio accede solo a lo necesario.
3. **Autenticación y autorización separadas:** verificar la identidad no
   equivale a tener permisos.
4. **Validación server-side:** el backend valida entradas y decisiones; el
   frontend no es la frontera de seguridad.
5. **Secretos fuera del repositorio:** claves y credenciales no se
   almacenan en el repositorio ni se registran en logs.
6. **No registrar datos sensibles innecesarios** ni exponerlos en
   respuestas, logs o informes.
7. **No exponer service accounts** ni credenciales de servicio.
8. **No usar credenciales productivas en desarrollo.**
9. **Protección especial para menores:** las cuentas, datos y contenidos de
   menores reciben tratamiento y controles adicionales según las reglas
   verificadas en la documentación de privacidad.
10. **Consentimiento y vínculo familiar** se aplican según las reglas
    verificadas para el rol tutor y el portal de familias.
11. **La moderación y el reporte no dependen únicamente del color ni de la
    interfaz:** se implementan como reglas de dominio.
12. **Los cambios de seguridad requieren revisión** técnica y, cuando son
    estructurales, ADR (Sección 18).
13. **Una credencial sospechada debe rotarse** y su exposición debe
    registrarse como brecha.
14. **Los agentes se detienen ante riesgo de exposición** de secretos,
    datos productivos o configuración insegura (Sección 16).

Esta Constitución no declara cumplimiento legal específico sin evidencia
jurídica verificada. El detalle de controles, autenticación, autorización,
secretos y modelo de amenazas pertenece a `security-baseline.md` y
`threat-model.md` (FND-5).

## 12. KIDS y TEENS

1. Una única base de código para todas las audiencias.
2. Una única arquitectura y un único conjunto de datos y servicios
   compartidos.
3. Las diferencias entre KIDS y TEENS se expresan mediante configuración,
   tokens visuales, densidad, tono y presentación; no mediante sistemas
   duplicados.
4. Ambas variantes ofrecen accesibilidad equivalente.
5. KIDS no significa preescolar.
6. TEENS no significa estética de videojuego oscuro ni hacker.
7. Ninguna variante puede romper seguridad, datos ni reglas de negocio.
8. No existen páginas duplicadas por variante.
9. El rol administrativo no se deduce del nivel KIDS/TEENS de un usuario.

El detalle visual de las variantes se delega a la Constitución Visual
(Sección 13).

## 13. Sistema visual y experiencia

1. La **Constitución Visual** (`docs/30-design-system/visual-constitution.md`)
   tiene autoridad máxima **únicamente dentro del dominio visual**.
2. La **Constitución General** tiene precedencia global sobre cualquier
   documento, incluida la Constitución Visual, fuera del dominio visual.
3. El diseño no puede contradecir producto, seguridad ni accesibilidad.
4. Los nuevos valores visuales siguen el mapa de tokens
   (`token-map.md`); no se introducen valores fuera del sistema.
5. El diseño no puede introducir comportamiento de negocio.
6. Las variantes visuales (KIDS/TEENS) no duplican lógica.
7. Las reglas visuales vigentes se leen desde `docs/30-design-system/`
   (README, visual-constitution, token-map, color-accessibility).

Esta Constitución no duplica la paleta ni los tokens; remite a los
documentos del sistema visual.

## 14. Entornos, operación y producción

1. Se distinguen los entornos local, testing, staging y producción.
2. **Fail-closed:** ante una configuración insegura o ausente, el sistema
   bloquea en lugar de degradarse.
3. No se usan recursos productivos desde el desarrollo local.
4. No se despliega sin autorización.
5. No se modifican secretos ni configuración para "hacer pasar" una prueba.
6. Un build exitoso no equivale a un despliegue exitoso.
7. La disponibilidad remota se verifica con evidencia; no se declara un
   servicio operativo sin comprobación.
8. Los backups deben existir, ejecutarse y comprobarse; la restauración
   debe estar probada.
9. Los cambios operativos requieren un plan de rollback.
10. Los incidentes se documentan y se revisan.
11. La observabilidad preserva la privacidad: no registra datos sensibles
    innecesarios.

DAEMON dispone de una configuración de despliegue productivo y de
evidencia documental de operación. La disponibilidad remota actual de los
servicios no fue validada durante FND-1.

El detalle de entornos y procedimientos pertenece a `environments.md` y
`operations-runbook.md` (FND-5).

## 15. Calidad y definición de cambio aceptable

Un cambio se considera aceptable cuando:

1. Está dentro de una tarea y una rama autorizada.
2. Está respaldado por evidencia.
3. Respeta la Constitución y los documentos canónicos.
4. No introduce contradicciones documentales.
5. No deja documentación falsa ni afirmaciones no verificadas.
6. Ejecuta los checks aplicables (documentación, arquitectura, estilo,
   tokens, tests y build cuando correspondan).
7. No oculta warnings relevantes.
8. No reduce seguridad.
9. No rompe accesibilidad.
10. No mezcla deuda técnica no autorizada.
11. Tiene una condición de parada clara.
12. Deja el worktree en un estado comprensible y reversible.

Esta Constitución no enumera todos los comandos de validación; el detalle
de gates, Definition of Done, estrategia de testing y release checklist
pertenece a `quality-gates.md` (FND-6).

## 16. Contrato operativo para agentes

Este contrato es obligatorio para agentes humanos o de IA que trabajen en
el repositorio.

Todo agente debe:

1. Leer el orden de lectura obligatorio antes de trabajar
   (`AGENTS.md`, `docs/README.md`, `source-of-truth.md`,
   `agent-reading-order.md` y la documentación del dominio asignado).
2. Respetar las fuentes canónicas y no usar documentos históricos,
   auditorías o conversaciones previas como especificación.
3. Verificar afirmaciones contra código y configuración.
4. Distinguir hechos verificados de hipótesis y registrarlos como tales.
5. Trabajar en una rama dedicada.
6. Limitarse al alcance autorizado de la tarea.
7. No modificar archivos no autorizados.
8. No autoaprobar decisiones ni cambiar estados documentales sin
   aprobación.
9. No introducir dependencias nuevas sin aprobación.
10. No tocar secretos ni exponer credenciales.
11. No desplegar sin autorización.
12. Detenerse ante conflicto, riesgo de exposición, datos productivos sin
    autorización o ambigüedad crítica (stop-condition).
13. Presentar el diff y los resultados de validación al terminar.
14. No declarar éxito si un gate falla ni inventar resultados.

Este contrato define reglas globales; el detalle operativo pertenece a
`AGENTS.md`, que no se sustituye ni se reemplaza por esta sección.

## 17. Gobernanza documental

1. **Una fuente canónica por dominio:** cada dominio tiene un documento
   canónico; no se admiten dos documentos que se atribuyan la misma
   autoridad.
2. **El frontmatter es un contrato documental:** `status`, `owner`,
   `normative` y `applies_to` describen la autoridad real del documento.
3. Los estados documentales permitidos son: `canonical`, `active`,
   `draft`, `superseded`, `archived` y `obsolete`.
4. `draft` no autoriza implementación.
5. `active` no significa autoridad única ni canónica.
6. `superseded` debe apuntar al documento que lo reemplaza.
7. `archived` y `obsolete` no se leen por defecto.
8. Ningún documento histórico recupera autoridad por ser reciente o por
   estar mal clasificado.
9. La documentación canónica se mantiene alineada con el código y la
   configuración.
10. Las iniciativas son temporales; cuando una iniciativa cierra, sus
    decisiones se consolidan en el canónico del dominio.
11. No se crean archivos Markdown nuevos cuando una sección de un documento
    existente es suficiente (evita fragmentación).
12. Un documento canónico que contradiga la Constitución se marca como
    conflicto y se resuelve según la Sección 20; no se corrige en silencio.

Esta sección no modifica `documentation-policy.md`; su ampliación detallada
pertenece a una fase posterior autorizada.

## 18. Decisiones arquitectónicas y ADR

Requieren ADR los siguientes cambios:

1. Cambio de fuente de verdad de un dato.
2. Cambio de proveedor de identidad o de esquema de autenticación mayor.
3. Cambio de frontera frontend/backend.
4. Incorporación de una nueva plataforma de datos.
5. Introducción de dual-write.
6. Cambio mayor de framework.
7. Nueva integración crítica.
8. Cambio en seguridad estructural.
9. Cambio incompatible de la experiencia KIDS/TEENS.
10. Cambio estructural que requiera modificar la Constitución.

Reglas de los ADR:

- Un ADR no sustituye la Constitución.
- Un ADR no puede contradecir la Constitución.
- Un ADR puede ser superseded por otro ADR.
- Un ADR debe registrar contexto, decisión, consecuencias y estado.
- Un ADR por sí solo no puede autorizar una contradicción o excepción a la
  Constitución. Una excepción constitucional requiere el procedimiento
  formal de aprobación definido en la Sección 19. Cuando la excepción
  también afecte la arquitectura, requiere además un ADR.

Los ADR aceptados se mantienen en `docs/20-architecture/adr/` y se
consideran autoridad de dominio dentro de su alcance.

## 19. Cambios, excepciones y aprobación

Tipos de cambio:

| Tipo | Descripción | Aprobación requerida |
|---|---|---|
| Cambio menor | Corrección editorial, ajuste local sin efecto estructural | Revisión estándar de la tarea |
| Cambio de dominio | Modificación dentro de un dominio canónico | Propietario del dominio |
| Cambio estructural | Fronteras, autoridad de datos, seguridad estructural, KIDS/TEENS | ADR + propietario |
| Cambio incompatible | Ruptura de invariantes o de la Constitución | Aprobación explícita del project-owner + revisión técnica + modificación constitucional o excepción temporal formal + ADR cuando afecte arquitectura, datos, identidad o seguridad estructural |
| Excepción temporal | Desviación acotada en tiempo y alcance | Propietario + duración fija |
| Excepción permanente | Desviación estructural durable | No existe como simple desviación: requiere modificación formal de la Constitución + aprobación del project-owner + revisión técnica + ADR cuando afecte arquitectura |

Toda excepción debe:

- ser explícita y documentada;
- tener alcance definido;
- tener propietario responsable;
- tener motivo;
- tener duración (o condición de cierre);
- no convertirse automáticamente en precedente;
- ser aprobadas siempre por una función con autoridad: ningún agente puede
  aprobar una excepción.

Están prohibidas las excepciones que:

- expongan secretos;
- eliminen controles de seguridad;
- permitan usar producción desde local;
- eliminen accesibilidad;
- alteren la autoridad de datos sin decisión;
- permitan autoaprobación de agentes.

Las excepciones temporales caducan; su vencimiento se revisa y se cierra o
se convierte en decisión formal.

## 20. Precedencia y resolución de conflictos

Orden de precedencia obligatorio:

1. Constitución General aprobada.
2. Documento canónico del dominio.
3. ADR aceptado y vigente.
4. Referencia técnica verificada.
5. Iniciativa activa.
6. Auditoría o informe.
7. Historial y archivo.

Reglas:

1. Una fuente inferior no puede contradecir una superior.
2. Ante un conflicto entre fuentes del mismo nivel, se detiene el trabajo y
   se eleva el conflicto; no se resuelve por antigüedad ni por preferencia.
3. No se resuelve un conflicto escogiendo el documento más reciente sin
   evaluar la autoridad real de cada fuente.
4. El código y la configuración sirven para verificar estado, pero no
   sustituyen una decisión de gobernanza.
5. Una implementación que contradice la Constitución se registra como deuda
   o incumplimiento; la implementación no se convierte en norma por existir.
6. Ningún agente resuelve unilateralmente un conflicto estructural.

## 21. Vocabulario de gobernanza

| Término | Definición |
|---|---|
| DAEMON | Plataforma educativa gamificada para niños y adolescentes (Sección 2) |
| Constitución | Documento de autoridad global del proyecto; este documento |
| Autoridad global | Precedencia máxima sobre todo el proyecto, una vez aprobada |
| Autoridad de dominio | Precedencia dentro de un dominio canónico |
| Documento canónico | Fuente oficial única de un dominio o decisión |
| Referencia | Documento verificable que describe estado, no decisión |
| Iniciativa | Trabajo en curso con documentación temporal |
| Auditoría | Revisión o registro histórico, sin autoridad normativa |
| ADR | Registro formal de una decisión arquitectónica aceptada |
| Propietario | Responsable de aprobar y mantener un documento o dominio |
| Revisor | Persona o función que revisa técnicamente los cambios |
| Agente | Persona o sistema de IA que ejecuta tareas en el repositorio |
| Rol | Posición administrativa o de acceso de un usuario |
| Nivel | Variante de experiencia (KIDS/TEENS) de un estudiante |
| Portal | Experiencia de navegación de un tipo de usuario |
| Capability | Capacidad funcional del producto |
| Fuente de verdad | Autoridad que determina el estado válido de un dato |
| Sistema de registro | Componente que escribe la fuente de verdad de un dato |
| Proyección | Representación derivada de una fuente de verdad, no autoritativa |
| Entorno | Contexto de ejecución (local, testing, staging, producción) |
| Gate | Validación que debe pasar un cambio |
| Fail-closed | Comportamiento de bloquear ante configuración insegura |
| Excepción | Desviación explícita, acotada y aprobada de una regla |
| Deuda técnica | Desviación conocida y registrada que debe resolverse |
| Cambio incompatible | Cambio que rompe invariantes o contratos vigentes |

Los términos funcionales (XP, DAEMONS, misiones, rachas, niveles de
experiencia) pertenecen a `product-overview.md` (FND-3) y no se definen en
detalle aquí.

## 22. Revisión, versionado y changelog

1. La Constitución se revisa al menos semestralmente o ante un cambio
   estructural que la afecte.
2. Una versión mayor indica ruptura o cambio incompatible.
3. Una versión menor indica ampliación compatible.
4. Una corrección editorial no cambia la versión normativa.
5. El propietario del documento es el `project-owner`.
6. Todo cambio sustancial requiere revisión técnica.
7. Toda aprobación es explícita; no existe aprobación silenciosa.
8. El changelog es obligatorio y se registra en la tabla siguiente.

| Fecha | Versión | Estado | Cambio | Aprobaciones |
|---|---|---|---|---|
| 2026-08-06 | 1.0-candidate | draft | Creación del candidato FND-2A | Pendiente |
| 2026-08-06 | 1.0 | canonical | Corrección, aprobación y activación FND-2B | project-owner + technical-reviewer |

## Apéndice A. Matriz de trazabilidad

| Regla constitucional | Tipo | Fuente de evidencia | Estado |
|---|---|---|---|
| Autoridad global de la Constitución | Governance decision | FND-1 (foundation-assessment, canonical-document-map) | Vigente — aprobada en FND-2B |
| KIDS y TEENS comparten base | Accepted ADR | ADR-005, portal-alumno | Vigente |
| `rol` y `nivel` separados | Verified state | Modelos `usuarios` (rol/nivel), ADR-005 | Vigente |
| Firebase Auth como identidad | Accepted ADR | ADR-001, firebase-auth.md | Vigente |
| PostgreSQL como datos de negocio | Accepted ADR | ADR-001, supabase-postgres.md | Vigente |
| Firestore como autoridad de cuentos v2 | Accepted ADR | ADR-002, ADR-003 | Vigente (transición) |
| Supabase Storage para archivos | Accepted ADR | ADR-004 | Vigente |
| Fail-closed de entornos | Accepted ADR | ADR-006, ENVIRONMENTS.md | Vigente |
| Seguridad por defecto y secretos fuera del repo | Domain rule | SECURITY.md, firebase-auth.md, privacidad-kids-teens.md | Vigente |
| Sistema visual con autoridad de dominio | Governance decision | visual-constitution.md, canonical-document-map.md | Vigente (V1 aprobada) |
| Cambios estructurales requieren ADR | Governance decision | ADR-001..006 (práctica establecida) | Vigente |
| Contrato operativo para agentes | Governance decision | agent-reading-order.md, AGENTS.md | Vigente |
| Calidad y validaciones para cambios | Governance decision | qa-produccion.md, checks de CI | Vigente |
| Gobernanza documental y estados | Governance decision | document-statuses.md, source-of-truth.md | Vigente |
| security-baseline y threat-model | Future dependency | documentation-gap-register (GAP-004) | Pendiente (FND-5) |
| data-ownership y entity-catalog | Future dependency | documentation-gap-register (GAP-003) | Pendiente (FND-5) |
| operations-runbook y environments | Future dependency | documentation-gap-register (GAP-006) | Pendiente (FND-5) |
| quality-gates | Future dependency | documentation-gap-register (GAP-007) | Pendiente (FND-6) |
| product-overview y business-rules | Future dependency | documentation-gap-register (GAP-002) | Pendiente (FND-3) |
| system-architecture y backend-architecture | Future dependency | documentation-gap-register (GAP-013/014) | Pendiente (FND-4) |
