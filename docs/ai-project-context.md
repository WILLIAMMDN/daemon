# DAEMON: contexto maestro para IA y equipo técnico

> Última revisión integral: **19 de julio de 2026**.
>
> Este es el documento principal para incorporar a otra IA, desarrollador o
> proveedor técnico al proyecto. No contiene secretos. Los estados de ramas y
> PR son una fotografía y deben volver a consultarse antes de integrar cambios.

## 1. Cómo usar este documento

Antes de editar DAEMON:

1. Leer `AGENTS.md` y este archivo completos.
2. Ejecutar `git status --short --branch`; el repositorio puede contener trabajo
   paralelo del propietario o de Antigravity.
3. Identificar si el dato relevante está en **producción**, `origin/main`, un
   **PR**, una **rama local** o un servicio externo.
4. Leer la guía especializada indicada en la sección 27.
5. Inspeccionar el código vigente antes de confiar en una descripción histórica.
6. Trabajar en una rama o worktree aislado cuando existan cambios ajenos.
7. Validar de manera proporcional al cambio y documentar la evidencia.

Orden de autoridad cuando algo no coincide:

```text
código y configuración efectiva del entorno objetivo
  > este contexto maestro, verificando fecha y etiqueta de estado
  > documentación especializada
  > documentos históricos, capturas o conversaciones
```

Este archivo es completo como mapa técnico y operativo. No pretende copiar cada
contrato, migración o runbook; enlaza la fuente especializada para conservar una
única definición detallada de cada subsistema.

## 2. Lenguaje de estado obligatorio

Toda afirmación sobre una función debe usar uno de estos estados:

| Estado | Significado |
| --- | --- |
| **PRODUCCIÓN** | Está publicado y fue comprobado en los servicios públicos. |
| **MAIN** | Está en `origin/main`; puede coincidir con producción o estar esperando despliegue. |
| **PR** | Está propuesto y validado en su rama, pero no integrado ni desplegado. |
| **LOCAL** | Está en un worktree o árbol sin commit; puede cambiar o perderse. |
| **EXTERNO** | Depende de consola, credencial, contrato o proveedor fuera del repositorio. |

No usar “implementado” como sinónimo de “desplegado”. Un check verde de GitHub
no prueba por sí solo que Render o Firebase estén sirviendo ese commit.

## 3. Resumen ejecutivo

DAEMON es una plataforma educativa gamificada para estudiantes **KIDS** y
**TEENS**. Tiene portales de estudiante, docente/administración y familia;
aprendizaje por cursos, unidades, lecciones, misiones y evaluaciones;
gamificación con XP y DAEMONS; ranking contextual; tienda; criatura
personalizable; comunidad moderada; herramientas de IA; interoperabilidad
OneRoster/LTI; privacidad infantil y operación cloud.

No es un prototipo estático. La arquitectura activa es:

```text
Firebase Hosting
  -> SPA Angular 21
  -> API Laravel 12 en Render
       -> Supabase PostgreSQL: datos de negocio
       -> Supabase Storage: archivos de negocio
       -> Firebase Auth: identidad y correos de autenticación
       -> Pusher: capacidades en tiempo real configurables
       -> Sentry: observabilidad configurable
```

Límites de autoridad:

- Firebase Auth acredita identidad para Google y email/password.
- Laravel valida identidad, emite la sesión DAEMON/Sanctum y aplica roles,
  permisos y reglas de negocio.
- PostgreSQL/Supabase es la fuente de verdad del negocio.
- Angular presenta estado y solicita operaciones; no decide premios, saldos,
  permisos, propiedad de cosméticos ni calificaciones.
- Firebase Hosting entrega la SPA y los assets estáticos versionados.
- Supabase Storage aloja uploads del negocio.

## 4. Estado verificado al 19 de julio de 2026

### 4.1 Producción

| Elemento | Estado verificado |
| --- | --- |
| Frontend | `https://daemonestudiante.web.app` |
| API | `https://daemon-5vo1.onrender.com/api/v1` |
| Salud | `https://daemon-5vo1.onrender.com/api/v1/salud` |
| Código funcional publicado | commit `2d76c4558149a48b6b4f91013dc00d6e1afe2ce4` |
| Evidencia | `docs/release-2026-07-19-plataforma-estandar.md` |
| Base de datos | Supabase PostgreSQL, salud OK en la evidencia de release |
| Storage | Supabase `daemon-assets`; evidencias privadas en `daemon-private` |
| Monitor Render | cada 10 minutos; mitigación gratuita, **no SLA** |

La comprobación en vivo realizada durante esta actualización devolvió HTTP 200
en el frontend y `ok: true`, base de datos OK y
`backend_commit: 2d76c4558149a48b6b4f91013dc00d6e1afe2ce4` en `/salud`.

El commit `55cbd75fd64a2cc529bfacbdfafb97357511f656` de `main` solo añadió
documentación de evidencia con `[skip ci]`. La publicación funcional demostrada
continúa identificada por `2d76c45` hasta que un despliegue posterior se
compruebe expresamente.

La release publicada incluye núcleo académico, ledger de economía, OneRoster
1.2 de lectura, lanzamiento LTI 1.3, moderación, bloqueo, analítica minimizada,
outbox, correlación de solicitudes y currículo de estudiante/docente. La
certificación formal 1EdTech y la prueba con un SIS/LMS socio siguen pendientes.

### 4.2 `origin/main`

La referencia revisada fue:

```text
55cbd75fd64a2cc529bfacbdfafb97357511f656
docs(platform): registrar evidencia del despliegue [skip ci]
```

Contiene la base de producción y documentación posterior. No contiene por
defecto las propuestas de los PR 21 a 24 descritas más adelante.

### 4.3 Trabajo local de Antigravity

El worktree original estaba en `feature/frontend-design-system`, 14 commits por
delante de su rama remota y un commit por detrás de `origin/main`. Además había
decenas de cambios frontend sin commit y algunos archivos generados/eliminados.

Reglas:

- no revertir, limpiar ni incluir esos cambios por accidente;
- revisar cada fragmento antes de promoverlo;
- conservar la eliminación intencional de “Mi perfil” del sidebar;
- validar comportamiento, accesibilidad, móvil, arquitectura y bundle, no solo
  apariencia;
- usar el PR 21 como integración seleccionada; el árbol local completo sigue
  siendo material en evaluación.

### 4.4 Pull requests funcionales abiertos

Fotografía consultada el 19 de julio de 2026:

| PR | Estado | Propósito | Condición |
| --- | --- | --- | --- |
| `#21 codex/antigravity-integration` | Draft, checks verdes | Integración frontend seleccionada y QA de coordinación | Requiere revisión visual/producto antes de fusionar. |
| `#22 codex/academic-mastery-foundation` | Ready, checks verdes | Dominio académico, Gradebook y OneRoster Gradebook | Es la propuesta funcional más preparada para integración. |
| `#23 codex/local-network-development` | Draft, checks verdes | Inicio local/LAN determinista, proxy y guardas Firebase | Requiere rebase tras cambios frontend que toquen entornos o `angular.json`. |
| `#24 codex/legacy-google-link` | Draft, checks verdes | Enlace explícito y seguro de Google/Firebase con cuentas legacy | Requiere QA manual de conflictos e identidad antes de producción. |

Los PR de Dependabot 5–19 revisados estaban atrasados y varios tenían checks de
preview/frontend fallidos. En especial, no fusionar automáticamente Angular 22
o TypeScript 7 en una base Angular 21. Cada actualización exige una rama de
upgrade, matriz de compatibilidad y suite completa.

## 5. Recursos públicos y nombres de proyecto

```text
Repositorio GitHub:      https://github.com/WILLIAMMDN/daemon
Frontend producción:    https://daemonestudiante.web.app
Backend producción:     https://daemon-5vo1.onrender.com/api/v1
Health:                  https://daemon-5vo1.onrender.com/api/v1/salud
Firebase project:        daemon-a41f8
Firebase Hosting site:  daemonestudiante
Supabase project:        lbxdcvsrmkkynttgwblc
Supabase bucket público: daemon-assets
Supabase bucket privado: daemon-private
Zona operativa base:     America/Lima
```

No copiar valores secretos a documentación, issues, mensajes, PR ni frontend.
La configuración web pública de Firebase no es una service account; el JSON de
service account y su base64 sí son secretos.

## 6. Tecnologías y versiones base

| Capa | Base en `main` |
| --- | --- |
| Frontend | Angular `^21.2.18`, TypeScript `~5.9.2` |
| UI compleja | NG-ZORRO `^21.3.2` con identidad visual DAEMON |
| Pruebas frontend | Jest 30, 39 pruebas en la release del 19 de julio |
| Backend | PHP `^8.2`, Laravel `^12.0` |
| Auth de API | Laravel Sanctum + validación de Firebase ID tokens |
| Base de negocio | PostgreSQL en Supabase |
| Archivos | Supabase Storage público/privado + Firebase Hosting para estáticos |
| CI/CD | GitHub Actions, Firebase Hosting y Render |

El bundle inicial conserva un presupuesto de advertencia de 1 MB. El resultado
exacto es específico de cada rama: la release publicada produjo 912,08 kB; los
PR posteriores rondaron 909–920 kB; el árbol local de Antigravity validado llegó
a 973,03 kB. No presentar una cifra de una rama como resultado universal.

## 7. Estructura del repositorio

```text
backend-laravel/       API Laravel, dominio, migraciones, servicios y tests
frontend-angular/      SPA Angular, portales y assets estáticos
database/              respaldo y material de soporte de base de datos
docs/                  contexto, contratos, runbooks y evidencia
legado/                sistema anterior de referencia; no editar salvo pedido
scripts/               automatización local, smoke, backup y recuperación
.github/workflows/     CI, seguridad, preview, deploy, backup y monitor
render.yaml            producción Render
render.staging.yaml    plantilla de staging aislado
firebase.json          Hosting, headers, cache y target de publicación
```

Puntos de entrada principales:

```text
frontend-angular/src/app/app.routes.ts
frontend-angular/src/app/core/
frontend-angular/src/app/features/
frontend-angular/src/app/shared/
frontend-angular/src/environments/
backend-laravel/routes/api.php
backend-laravel/app/Http/Controllers/Api/V1/
backend-laravel/app/Services/
backend-laravel/app/Models/
backend-laravel/database/migrations/
```

## 8. Arquitectura frontend

Regla de dependencias:

```text
routes -> features + core
features -> core + shared
core -> shared
shared -> Angular/librerías externas solamente
```

`shared` no debe importar `core` ni `features`; `core` no debe importar
`features`. Ejecutar `npm run check:architecture` después de cambios de
estructura.

- `core`: sesión, auth, guards, interceptores, servicios singleton y layouts.
- `features`: casos de uso y páginas por dominio.
- `shared`: componentes presentacionales reutilizables y sin dependencia de
  producto superior.
- Las rutas de módulos se cargan de forma diferida.
- Los layouts del portal viven en `core`, incluido
  `core/layouts/sidebar-portal`.
- Los IDs del sidebar forman parte del tour de incorporación y son contrato.

La sesión y datos remotos deben reutilizarse mediante servicios/caché con una
política explícita de invalidación. No asumir que “descargar una vez” significa
conservar datos obsoletos indefinidamente. La práctica esperada es:

```text
mostrar caché vigente o último dato útil
  -> revalidar en segundo plano cuando corresponda
  -> conservar el dato visible ante error
  -> invalidar después de una mutación exitosa, cambio de usuario o logout
```

Evitar suscripciones duplicadas, llamadas en getters/template, recargas por
cambio de ruta y listeners que sobreviven al componente sin limpieza.

## 9. Rutas y módulos frontend

### 9.1 Público y autenticación

```text
/
/login
/login-docente
/familias/acceso
/registro
/bienvenida
/recuperar-clave
/restablecer-clave
/verificar-correo
```

### 9.2 Portal estudiante

Prefijo `/alumno`, protegido por sesión y rol. Incluye:

- dashboard, perfil, edición y notificaciones;
- misiones, detalle y entrega;
- cursos/recursos/currículo y progreso;
- herramientas IA, chatbot personal y configuración del bot;
- tienda, canjes y vestidor de criatura;
- evaluaciones, examen en vivo y resultados;
- competencia, TV y votación;
- cuentos, creación y detalle;
- ranking contextual y comunidad;
- laboratorios IA, Neuro Maze, Defensa IA y entrenamiento;
- certificados y versión imprimible.

### 9.3 Portal docente/administración

Prefijo `/docente`, protegido por rol docente o administrador según operación.
Incluye:

- dashboard, perfil y notificaciones;
- alumnos, aulas y carnés;
- currículo, cursos, unidades, lecciones y asignaciones;
- misiones, entregas e insignias;
- tienda, premios, especies y cosméticos;
- evaluaciones, resultados y Gradebook cuando se integre el PR 22;
- competencias, TV, rondas e historial/ajustes de DAEMONS.

### 9.4 Portal familias

`/familias` usa el rol dedicado `tutor`. No es una variante de alumno o docente.
Exige correo Firebase verificado y aceptación expresa de una invitación antes
de exponer el progreso de un menor.

## 10. Sistema visual y UX del alumno

Dirección vigente:

- fuente Inter;
- fondo `#f4f7fb`, superficies blancas y bordes suaves;
- azul para acción/XP, ámbar para DAEMONS y verde para éxito;
- tarjetas sólidas, sin glassmorphism ni gradientes en módulos principales;
- radios generalmente de 12–16 px;
- header compacto;
- sidebar morado preservado;
- objetivos mínimos de 40 px para controles táctiles;
- soporte obligatorio de 1440 × 900 y 390 × 844;
- `prefers-reduced-motion`, foco visible, semántica y textos alternativos.

NG-ZORRO se usa cuando aporta comportamiento robusto: dropdown, modal,
notificación, tabs, tabla, skeleton, select y empty state. La marca DAEMON se
conserva en navegación, gamificación, criatura y momentos de recompensa.

Decisión reciente del propietario: las ilustraciones actuales de estados vacíos
se conservan. No eliminarlas solo por una regla visual anterior. Sí se debe
garantizar que el estado vacío explique qué falta y el siguiente paso. Algunas
variantes locales usan recursos externos de Alipay/NG-ZORRO; antes de una
apertura masiva conviene versionarlas localmente para eliminar esa dependencia,
pero ese cambio requiere revisión visual y no debe hacerse silenciosamente.

Estados obligatorios de cada pantalla remota:

- carga con skeleton o estructura estable, sin panel blanco gigante;
- éxito con datos;
- vacío intencional con ilustración aprobada y acción útil;
- error real con mensaje accionable y reintento;
- refresco que no borra datos anteriores útiles;
- móvil sin recortes, superposiciones ni controles invisibles.

## 11. Backend y dominios

Las rutas viven en `backend-laravel/routes/api.php`. El inventario revisado
tenía 182 rutas: 169 bajo `/api/v1` y cuatro bajo `/ims` para
interoperabilidad, además de rutas LTI públicas.

Dominios principales:

- autenticación, perfil, sesión y roles;
- instituciones, aulas, matrículas y alumnos;
- cursos, unidades, lecciones, objetivos y progreso;
- misiones, entregas, evaluaciones y resultados;
- Gradebook y dominio de mastery propuesto en PR 22;
- XP, DAEMONS, ledger, ranking, insignias y tienda;
- criaturas, especies, cosméticos, inventario y equipamiento;
- comunidad, moderación, bloqueo y reportes de seguridad;
- chatbot, modelos IA, cuentos y laboratorios;
- competencias y votación;
- archivos, evidencias privadas y activos;
- privacidad, consentimiento, retención y solicitudes de eliminación;
- tutores, reportes familiares y bienestar digital;
- OneRoster 1.2, LTI 1.3/Advantage, outbox y telemetría permitida.

`usuarios` es la tabla canónica. No introducir la tabla Laravel `users` como
segunda autoridad.

Reglas backend:

- validar roles, alcance institucional y propiedad en servidor;
- usar transacciones para premios, canjes, inventario y cambios relacionados;
- exigir idempotencia en acciones que pueden repetirse;
- no confiar en botones deshabilitados ni datos calculados por Angular;
- emitir `X-Request-ID`/correlación para diagnosticar operaciones;
- usar recursos/DTO y servicios de dominio; evitar controladores monolíticos;
- no ejecutar migraciones destructivas contra Supabase desde pruebas.

## 12. Identidad, autenticación y cuentas legacy

### 12.1 Responsabilidades

```text
Firebase Auth:
  Google, email/password, verificación y recuperación por correo

Laravel/Sanctum:
  aceptación del Firebase ID token, usuario DAEMON, rol, perfil,
  permisos, sesión y toda autoridad de negocio
```

Archivos clave:

```text
frontend-angular/src/app/core/servicios/firebase-auth.ts
frontend-angular/src/app/core/servicios/autenticacion.ts
backend-laravel/app/Services/Auth/FirebaseTokenVerifier.php
backend-laravel/app/Services/Auth/AutenticacionService.php
backend-laravel/app/Http/Controllers/Api/V1/AutenticacionController.php
```

### 12.2 Flujos activos en `main`

- Si el identificador contiene `@`, el login email/password usa Firebase y
  luego intercambia el ID token con Laravel.
- El login por usuario local llama `POST /api/v1/auth/login`.
- Google usa Firebase Popup y después `POST /api/v1/auth/firebase`.
- Laravel enlaza por `firebase_uid`, correo o teléfono según sus reglas actuales,
  crea/actualiza el usuario cuando está autorizado y emite Sanctum.
- `email_verified_at` se sincroniza desde claims Firebase.
- Verificación vuelve con `?verificacion=firebase` y el banner resincroniza.
- Recuperación activa usa `sendPasswordResetEmail` de Firebase.
- Tutor usa exclusivamente `POST /api/v1/auth/tutor/firebase`.

No convertir silenciosamente una cuenta alumno/docente/admin a `tutor`.

### 12.3 Firebase local

Firebase Console debe autorizar al menos:

```text
localhost
127.0.0.1
daemonestudiante.web.app
```

Laravel local necesita las variables Firebase válidas y un proceso iniciado
después de cargarlas. `php artisan serve` conserva el entorno del proceso; si se
cambia `.env` sin reiniciar y limpiar caché de configuración, puede responder
“Firebase no está configurado” aunque el archivo ya sea correcto.

Secuencia segura de diagnóstico:

```powershell
cd C:\laragon\www\daemon\backend-laravel
php artisan optimize:clear
php artisan serve --host=localhost --port=8000
```

No mostrar una falla de configuración Firebase como “usuario o contraseña
incorrectos”. Angular debe conservar códigos/mensajes diferenciados sin revelar
secretos.

### 12.4 Enlace seguro de Google con cuenta legacy

**PR 24, no `main`:** agrega un flujo explícito para conservar la misma cuenta
legacy, XP, DAEMONS y datos al vincular Google. Exige reautenticación con usuario
y contraseña local, proveedor `google.com`, comprobación de conflictos de UID,
correo y rol, y solo reemplaza placeholders incompletos en condiciones seguras.

No implementar un autoenlace silencioso por similitud de nombre o correo. Antes
de fusionar, probar: cuenta correcta, clave incorrecta, Google ya usado, correo
en conflicto, rol docente/alumno, placeholder seguro y repetición idempotente.

Los nombres de cuentas de prueba están en `docs/datos-prueba.txt`; las claves
permanecen redactadas en Git. Obtenerlas del propietario por un canal adecuado.

## 13. Dominio académico

La base publicada incorpora:

```text
periodos_academicos
cursos
unidades_curso
lecciones
objetivos_aprendizaje
matriculas_aula
progreso_lecciones
```

El currículo se administra con alcance institucional y de aula. El estudiante
ve recursos publicados y asignados; el docente administra estructura y
asignaciones dentro de su alcance. No inventar cursos para rellenar un estado
vacío: si no existe asignación, mostrar el vacío aprobado.

**PR 22:** agrega el dominio de mastery y Gradebook, categorías, ítems,
resultados, idempotencia de evaluación y lecturas familiares/OneRoster. Sus
tests reportaron 139 pruebas Laravel/540 assertions, 39 frontend y build de
919,89 kB. Estos números pertenecen a esa rama.

Principios:

- periodo, curso, clase/aula y matrícula son entidades separadas;
- resultados deben tener procedencia, actor e idempotencia;
- no cruzar instituciones o aulas por un ID recibido del cliente;
- una calificación publicada no debe depender de una fórmula duplicada en UI;
- cambios de esquema requieren migración incremental y estrategia de rollback.

## 14. OneRoster 1.2 y LTI Advantage

### 14.1 OneRoster

Base: `/ims/oneroster/rostering/v1p2`.

Lecturas publicadas: sesiones académicas, cursos, clases, organizaciones,
escuelas, usuarios, estudiantes, docentes y matrículas; consulta individual y
por clase; paginación, orden, filtro seguro y `fields`.

- `sourcedId` usa UUID sin PII.
- Cada cliente está limitado a una institución.
- OAuth2 `client_credentials`; secretos hasheados y token opaco almacenado como
  SHA-256 con duración de una hora.
- Alta/revocación se realiza desde endpoints administrativos.

**PR 22** extiende Gradebook OneRoster. No atribuir esa extensión a producción
antes de integrar, desplegar y repetir el smoke.

### 14.2 LTI 1.3 / Advantage

La herramienta publica `GET /lti/login` y `POST /lti/launch` con validaciones de
issuer, audience, nonce, expiración, firma RS256, deployment, `state` de un uso
y JWKS remoto cacheado.

- Un `sub` externo debe vincularse; no se aprovisiona silenciosamente.
- No se pasan tokens DAEMON en URL.
- El registro nace inactivo y debe verificar JWKS HTTPS.
- Por ahora se abre en ventana completa porque CSP/X-Frame-Options bloquea
  iframe; autorizar un LMS exige una lista explícita de orígenes.
- NRPS y AGS necesitan endpoints/scopes reales anunciados por el LMS.
- No afirmar certificación 1EdTech ni compatibilidad con un LMS concreto hasta
  completar su conformance suite y pruebas end-to-end.

## 15. XP, DAEMONS, economía y ranking

Son magnitudes distintas:

```text
usuarios.experiencia = XP permanente para progreso, nivel y ranking
usuarios.tokens       = DAEMONS gastables para tienda
```

Invariantes:

1. La XP no se descuenta.
2. Canjes y ajustes de moneda solo afectan DAEMONS.
3. Recompensas académicas pasan por `GamificacionService`.
4. La misma aprobación no puede premiar dos veces.
5. El nivel se calcula en Laravel y llega en `UsuarioResource`.
6. El ranking ordena por experiencia, no por tokens.
7. El ranking exige sesión, limita la comparación al contexto académico y no
   publica login, nombre completo ni saldo.

Desde el 19 de julio, `movimientos_economia` es un ledger append-only con saldo
anterior/resultante, tipo, origen, actor e idempotencia. `usuarios.experiencia`
y `usuarios.tokens` continúan como proyecciones de lectura rápida. No modificar
una proyección sin el movimiento correspondiente.

Fuentes duales actuales: misión aprobada, evaluación aprobada y competencia.
Ajustes manuales, login, perfil, avatar y compras no otorgan XP.

## 16. Tienda, criatura y cosméticos

El módulo no genera arte. Define una plataforma para que el equipo creativo
publique especies y capas compatibles.

Modelo:

```text
mascota_especies
mascota_cosmeticos
mascota_compatibilidades
mascotas_alumnos
mascota_inventario
mascota_equipamientos
```

Flujo:

```text
artista crea base/capas con el mismo lienzo
  -> administrador registra especie y premio cosmético
  -> alumno compra con DAEMONS
  -> transacción descuenta saldo/stock y otorga inventario
  -> alumno equipa una pieza compatible por ranura
  -> Angular compone capas ordenadas por el backend
```

Ranuras iniciales: fondo, espalda, piel, atuendo, ojos, rostro, cuello, cabeza,
mano y aura. Base y capas comparten dimensiones/origen; usar WebP lossless o PNG
transparente, sin trim. El contrato artístico completo está en
`docs/sistema-mascotas-cosmeticos.md`.

El backend es autoridad de compra, propiedad, compatibilidad y equipamiento.
Una compra duplicada no descuenta dos veces; cambiar especie desequipa lo
incompatible sin borrar inventario; un cosmético entregado se desactiva, no se
elimina como si nunca hubiera existido.

## 17. Privacidad KIDS/TEENS, seguridad y comunidad

Solo existen niveles académicos `KIDS` y `TEENS`; rol y nivel son conceptos
separados.

- KIDS exige declaración de tutor y consentimiento versionado.
- El correo del tutor se cifra; un HMAC permite coincidencia sin indexar texto
  en claro.
- IP y user-agent de auditoría no se conservan en claro.
- Evidencias privadas usan `daemon-private` y enlaces temporales.
- La cuenta puede exportar datos y solicitar eliminación.
- La eliminación requiere revisión y coordinación entre Firebase, PostgreSQL y
  Storage; no es un borrado instantáneo de historial académico.
- Comunidad está limitada por contexto; existen reporte, moderación y bloqueo.
- La telemetría usa una lista cerrada de eventos y no acepta texto libre, chat,
  URL, IP, teclas ni historial.
- La sesión analítica se almacena solo como hash.

Retención automatizada configurable:

- notificaciones leídas: 180 días;
- jobs fallidos: 168 horas;
- solicitudes resueltas: 730 días;
- uso diario de pantalla: 45 días.

`daemon:aplicar-retencion` debe ejecutarse primero como simulación; `--confirm`
es una operación explícita.

## 18. Familias y bienestar digital

El tutor controla una cuenta Firebase con rol DAEMON `tutor`. El vínculo exige:

1. declaración del correo por el estudiante KIDS;
2. control del mismo correo por el adulto;
3. email Firebase verificado;
4. aceptación expresa del parentesco/responsabilidad;
5. creación del vínculo `tutores_alumnos`.

El reporte familiar puede mostrar XP, nivel, ranking contextual, misiones,
evaluaciones y actividad agregada. No muestra chats, evidencias, credenciales ni
saldo DAEMONS.

El bienestar digital registra segundos agregados por alumno/día mediante un
latido visible de hasta 60 segundos. No registra páginas, pulsaciones, capturas
o contenido. Falla abierto si la API cae para no interrumpir una clase.

DAEMON no recibe PAN, CVC ni datos de tarjeta. Una membresía futura debe usar un
checkout HTTPS alojado por el proveedor y webhooks verificados en backend.

## 19. Archivos y activos

```text
Firebase Hosting / Angular:
  img/, galeria/, audio/, rive/, legacy/ y otros estáticos versionados

Supabase Storage público daemon-assets:
  uploads/perfiles
  uploads/bots
  uploads/tienda/premios
  uploads/insignias
  uploads/cuentos
  otros uploads de negocio explícitamente públicos

Supabase Storage privado daemon-private:
  evidencias y archivos que requieren autorización temporal
```

Usar el servicio Angular `Activos` para resolver URLs. No colocar credenciales
S3/Supabase en Angular. No mover archivos de negocio a Firebase ni assets
estáticos a Supabase sin una decisión documentada de migración.

## 20. Desarrollo local

### 20.1 Modos de frontend en `main`

`npm run start` usa la configuración cloud y consume servicios reales. Sirve
para inspección segura, pero cualquier canje, entrega, eliminación o mutación
impacta datos reales.

```powershell
cd C:\laragon\www\daemon\frontend-angular
npm run start
```

`npm run start:local` usa `environment.development.ts` y exige Laravel en el
puerto 8000:

```powershell
cd C:\laragon\www\daemon\backend-laravel
php artisan optimize:clear
php artisan serve --host=localhost --port=8000

cd C:\laragon\www\daemon\frontend-angular
npm run start:local -- --host localhost --port 4200
```

El 19 de julio se comprobó frontend local en `http://localhost:4200` y salud de
API en `http://localhost:8000/api/v1/salud` después de reiniciar el backend con
su entorno correcto. Los PID concretos son efímeros y no deben documentarse.

### 20.2 Desarrollo por red local

En `main`, el entorno de desarrollo apunta directamente a `localhost`; un
teléfono interpreta `localhost` como el propio teléfono. Por eso no basta abrir
la IP de la PC.

**PR 23** propone:

- API relativa `/api/v1` en desarrollo;
- proxy Angular hacia Laravel;
- comando `start:lan`;
- backend escuchando en la interfaz apropiada;
- guardas de configuración Firebase y salud sin secretos;
- documentación de firewall y dominios autorizados.

No copiar solo una línea del PR: proxy, host, CORS, Firebase Authorized Domains
y firewall forman un contrato conjunto.

### 20.3 Base local y pruebas

Laravel local puede conectarse a Supabase, lo que añade latencia y riesgo de
mutaciones reales. Para pruebas automáticas usar `.env.testing` y SQLite o la
base aislada configurada por CI. Las barreras destructivas deben rechazar el
host/proyecto Supabase de producción.

Nunca ejecutar `migrate:fresh`, truncate, reset o una importación destructiva
contra producción. El incidente del 18 de julio está documentado en
`docs/incidentes/2026-07-18-restauracion-supabase.md`.

## 21. Rendimiento y comportamiento profesional

Objetivos de implementación:

- lazy loading por feature;
- caché/revalidación de lecturas estables;
- invalidación dirigida después de mutaciones;
- skeletons con tamaño estable;
- no bloquear navegación por solicitudes secundarias;
- cancelar o ignorar respuestas obsoletas al cambiar ruta/usuario;
- evitar múltiples listeners del sidebar y doble manejo touch/click;
- usar un único evento de navegación y feedback inmediato;
- mantener el shell mientras carga el módulo;
- medir antes de optimizar: tiempo de API, waterfall, bundle, render y memoria.

El sidebar debe responder al primer toque. Un retraso suele venir de handlers
duplicados, overlay invisible, `pointer-events`, navegación bloqueada por carga,
trabajo síncrono o solicitudes encadenadas. No “arreglarlo” eliminando funciones
o ocultando contenido. Reproducir en móvil, inspeccionar hit targets y validar
que cada toque produzca una única navegación.

El monitor de diez minutos reduce cold starts de Render gratuito, pero no
garantiza disponibilidad. Una plataforma con SLA necesita un plan/arquitectura
que lo ofrezca, observabilidad y presupuesto aprobado.

## 22. Infraestructura, despliegue y operación

### 22.1 Firebase

`main` despliega Hosting mediante GitHub Actions:

```text
npm ci
  -> Jest
  -> arquitectura/build
  -> deploy hosting:estudiante
  -> smoke-produccion.ps1
```

Despliegue manual autorizado:

```powershell
cd C:\laragon\www\daemon
firebase deploy --only hosting:estudiante --project daemon-a41f8
```

No desplegar desde un árbol sucio ni desde una rama sin confirmar alcance. Tras
publicar, comparar el bundle servido y ejecutar smoke.

### 22.2 Render

`render.yaml` define producción. El entrypoint limpia cachés, ejecuta migraciones
forzadas no interactivas y Supervisor conserva Apache, `queue:work` y
`schedule:work`. No existe una ruta HTTP pública para migrar.

Render despliega backend desde GitHub/checks. Si cambia código o variables,
verificar el commit efectivo y `/salud`; no asumir que un push equivale a un
deploy terminado.

### 22.3 Staging

`render.staging.yaml` es una plantilla. Staging debe usar proyectos distintos
de Firebase, Supabase, buckets, Pusher, URLs y opcionalmente Sentry. El workflow
debe fallar si detecta identificadores de producción.

### 22.4 Backups y rollback

El workflow diario de Supabase produce dump PostgreSQL, restaura en PostgreSQL
17 aislado, valida checksum y respalda buckets. La existencia del workflow no
sustituye comprobar que sus secretos, ejecuciones y retención estén activos.

Rollback:

1. detener despliegues;
2. restaurar release anterior de Firebase;
3. revertir/desplegar el commit Render anterior;
4. restaurar backup en base aislada si el esquema no es compatible;
5. validar antes de redirigir producción;
6. ejecutar smoke integral.

No ejecutar `migrate:rollback` automáticamente en producción.

## 23. Calidad, CI y comandos de verificación

Después de cambios funcionales:

```powershell
cd C:\laragon\www\daemon\frontend-angular
npm run check:architecture
npm test -- --runInBand
npm run build

cd C:\laragon\www\daemon\backend-laravel
php artisan test

cd C:\laragon\www\daemon
git diff --check
git status --short --branch
```

Después de despliegue:

```powershell
cd C:\laragon\www\daemon
.\scripts\smoke-produccion.ps1
```

La evidencia del release publicado del 19 de julio fue:

- Laravel: 134 tests, 475 assertions;
- frontend: 11 suites, 39 tests;
- arquitectura Angular: OK;
- build inicial: 912,08 kB;
- E2E público, CI PostgreSQL, Firebase deploy y smoke: OK.

Es una línea base histórica, no permiso para omitir pruebas actuales. Toda
advertencia nueva de bundle debe investigarse. Las advertencias Sass de
`@import` ya existían en ciertas ramas, pero siguen siendo deuda, no un estándar
aceptado para código nuevo.

## 24. Orden recomendado de integración

Antes de fusionar, volver a consultar PR, checks y conflictos. Orden sugerido:

1. **PR 22**: integrar la base académica/Gradebook porque está ready y sus
   cambios son principalmente de dominio.
2. Rebasar **PR 21**, **PR 23** y **PR 24** sobre el nuevo `main`.
3. **PR 21**: completar revisión visual, funcional, responsive y accesible del
   frontend seleccionado de Antigravity; preservar funciones y sidebar.
4. **PR 23**: resolver en conjunto sus solapes de `angular.json`, scripts y
   entornos; repetir login local y LAN desde un teléfono real.
5. **PR 24**: ejecutar matriz manual de enlace Google/legacy y auditoría de
   seguridad antes de marcarlo ready.
6. Después de cada merge: esperar deploy, comprobar commit efectivo, smoke y
   registrar evidencia. No apilar varios deploys sin saber cuál falló.

Si un rebase revela conflictos semánticos, detener la integración automática y
resolver según el contrato de cada PR. El orden puede cambiar por urgencia, pero
la decisión debe documentarse.

## 25. Riesgos y deuda conocidos

- El árbol local de Antigravity mezcla trabajo comprometido y no comprometido;
  requiere selección, no merge ciego.
- PR 21/23 comparten superficie frontend y pueden tener conflictos semánticos.
- El enlace legacy de PR 24 altera identidad y necesita QA humano antes de
  producción.
- Los empty states externos deberían migrar a assets versionados después de
  aprobación visual.
- Render gratuito mantiene riesgo de cold start y carece de SLA.
- OneRoster/LTI aún no tiene certificación ni validación con un socio real.
- AGS/NRPS dependen de claims, endpoints y scopes externos.
- Resend no sirve como correo general mientras no exista dominio verificado.
- Los PR Dependabot atrasados no representan una ruta de upgrade segura.
- La restauración del 18 de julio puede haber perdido escrituras posteriores al
  backup de las 08:57 UTC; revisar el informe de incidente.
- Falta confirmar periódicamente que backups, monitor, alertas y secretos CI no
  solo existen en código sino que ejecutan correctamente.
- La documentación especializada anterior contiene algunos caracteres
  históricos mal codificados; no copiar ese mojibake a código o UI.

## 26. Reglas no negociables para otra IA

- No reemplazar DAEMON por archivos estáticos o un mock visual.
- No mover la base de negocio a Firebase.
- No crear una autoridad paralela a Laravel para roles, XP, DAEMONS o notas.
- No restar XP en compras.
- No ordenar ranking por tokens ni ocultarlo del portal alumno.
- No exponer login, nombre completo, saldo o PII en ranking.
- No convertir roles a tutor de forma silenciosa.
- No almacenar tarjetas, CVC, chats familiares ni telemetría de vigilancia.
- No guardar texto libre, URLs, teclas o contenido en analítica.
- No hacer autoenlace inseguro de cuentas Firebase/legacy.
- No inventar datos para ocultar estados vacíos.
- No quitar funciones para “resolver” un problema de layout o rendimiento.
- No romper los IDs del sidebar/tour ni reintroducir el perfil eliminado del
  sidebar sin una decisión del propietario.
- No introducir gradientes/Outfit en módulos principales del alumno.
- No borrar las ilustraciones de vacío aprobadas.
- No comprometer `.env`, dumps privados, service accounts ni claves.
- No ejecutar comandos destructivos de base sin autorización, backup verificado
  y simulación.
- No revertir trabajo ajeno ni usar `reset --hard`/checkout destructivo.
- No afirmar que un PR está en producción o que una integración está certificada
  sin evidencia externa.

## 27. Índice de documentación por tarea

| Necesidad | Documento |
| --- | --- |
| Contexto integral | `docs/ai-project-context.md` |
| Guía rápida para agentes | `AGENTS.md` |
| Arquitectura de módulos Angular | `docs/frontend-architecture.md` |
| Estándar Angular/NG-ZORRO | `docs/frontend-ui-standard.md` |
| Portal y UX del alumno | `docs/portal-alumno.md` |
| Sistema visual alumno | `docs/sistema-visual-portal-alumno.md` |
| Evolución visual | `docs/plan-evolucion-visual-portal-alumno.md` |
| Auth y Firebase | `docs/firebase-auth.md` |
| PostgreSQL/Storage | `docs/supabase-postgres.md` |
| XP, DAEMONS y ranking | `docs/gamificacion-xp-daemons.md` |
| Criaturas y cosméticos | `docs/sistema-mascotas-cosmeticos.md` |
| OneRoster y LTI | `docs/interoperabilidad-oneroster-lti.md` |
| Implementación estándar del 19/07 | `docs/implementacion-plataforma-estandar-2026-07-19.md` |
| Familias | `docs/portal-familias.md` |
| Privacidad infantil | `docs/privacidad-kids-teens.md` |
| Infraestructura, backup y rollback | `docs/infraestructura-operativa.md` |
| Estado cloud/GitHub | `docs/estado-nube-github-produccion.md` |
| QA y smoke | `docs/qa-produccion.md` |
| Evidencia release actual | `docs/release-2026-07-19-plataforma-estandar.md` |
| Incidente y restauración | `docs/incidentes/2026-07-18-restauracion-supabase.md` |
| Datos de prueba sin claves | `docs/datos-prueba.txt` |

Documentación que solo exista dentro de un PR debe citarse como tal hasta que
se fusione. No agregar enlaces rotos a `main` para describir una propuesta.

## 28. Plantilla de handoff para futuros cambios

Toda entrega importante debería registrar:

```text
Objetivo:
Estado: LOCAL | PR | MAIN | PRODUCCIÓN
Rama y commit:
Archivos/dominios afectados:
Migraciones:
Variables externas requeridas:
Pruebas ejecutadas y resultado:
QA visual y resoluciones:
Riesgos/limitaciones:
Plan de rollback:
Deploy y smoke:
Pendientes:
```

Con esa disciplina, otra IA puede continuar DAEMON sin confundir intención,
código validado y realidad operativa.
