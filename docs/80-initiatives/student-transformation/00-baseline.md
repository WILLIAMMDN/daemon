---
title: Package 0 — Baseline y protección
status: active
owner: -
last_reviewed: 2026-08-06
applies_to: DAEMON
supersedes: 
related: 
---

# Package 0 — Baseline y protección

Fecha de corte: 2026-08-02, zona horaria `America/Lima`.

## Resultado ejecutivo

Package 0 queda documentado, pero el gate para Package 1 permanece cerrado. El baseline reveló riesgos críticos que impiden tomar decisiones de arquitectura o ejecutar pruebas de navegador contra el portal alumno sin ampliar primero el aislamiento operativo:

1. Hay una credencial de un proveedor IA incrustada y ofuscada como fallback en código versionado. El valor no se reproduce aquí. Debe considerarse comprometida, revocarse/rotarse fuera del repositorio y eliminarse el fallback.
2. Los entornos locales y E2E no están aislados: `start:cloud` usa recursos productivos; `environment.development.ts` combina API local con Firebase y Supabase productivos; el backend local apunta a PostgreSQL productivo.
3. Cuentos tiene dos autoridades mutables activas: Firestore desde Angular y PostgreSQL desde Laravel. El riesgo afecta autorización, integridad y migración de datos.
4. La rama no produce un build de producción por un refactor de Cuentos preexistente y sin commit.

Por las reglas del encargo, no se crearon ADR-001 a ADR-006 ni se inició Package 1.

## Alcance inspeccionado

Se leyó por completo el conjunto obligatorio indicado por el encargo:

- `AGENTS.md` y `README.md`.
- Todos los archivos de `docs/30-design-system/`.
- Configuración Angular/NPM real en `frontend-angular/`, Firebase y reglas locales existentes.
- Tokens, rutas, dominio de nivel/tema, layout y sidebar del alumno.
- Todo `frontend-angular/src/app/features/cuentos/` y todos los entornos Angular.
- Rutas API, todos los Services, Models, migrations y tests del backend.
- Todos los workflows de GitHub Actions.
- Configuración y casos E2E para clasificar sus escrituras.

### Documento obligatorio ausente

`docs/DAEMON-CURRENT-STATE.md` no existe en el repositorio. Por tanto, no fue posible verificar sus afirmaciones una por una. Se usaron `AGENTS.md`, `docs/ai-project-context.md`, los documentos del sistema de diseño y el código como fuentes disponibles. Esta ausencia es una discrepancia documental, no evidencia de que el estado descrito por otros documentos sea falso.

### Discrepancias documentales verificadas

- `AGENTS.md` indicaba que Phase 1 estaba pendiente; el código muestra tokens, linter y parte de Phase 1 ya implementados.
- El documento obligatorio `docs/DAEMON-CURRENT-STATE.md` está ausente.
- La configuración de staging contiene placeholders y el workflow impide reutilizar producción, pero el repositorio no demuestra que los recursos aislados requeridos estén aprovisionados.
- La arquitectura declarada asigna Cuentos a Firestore, pero Laravel conserva rutas, modelo, migraciones y escrituras mutables sobre `cuentos` en PostgreSQL.
- `firestore.rules` existe localmente como archivo no versionado, pero no hay evidencia local de su despliegue. No se infiere el estado de las reglas productivas.

## Estado Git protegido

- Rama inicial: `fix/style-tokens-cleanup`.
- Rama creada: `refactor/student-production-hardening`.
- Commit de partida: `871fe8a2d4b9b6521e229748b937a47292b3ff11` (`871fe8a`).
- Fecha del commit: `2026-08-02T21:50:53-05:00`.
- No se hizo commit, push, deploy, rebase ni reescritura de historial.

Cambios preexistentes preservados al crear la rama:

- Modificados: `firebase.json`, `frontend-angular/src/app/features/cuentos/pages/crear-cuento/crear-cuento.ts`.
- No versionados: `c7200_i0_log.txt`, `docs/monitoring/`, `firestore.rules`, `frontend-angular/scripts/apply-token-fixes-2.mjs`, `frontend-angular/src/app/features/cuentos/services/cuentos-ia.service.ts`, `frontend-angular/src/app/features/cuentos/services/cuentos-imagen.service.ts`, dos borradores bajo `scratch/` y `scripts/listen_com.ps1`.

Estos archivos se trataron como trabajo del propietario. Package 0 no los revirtió ni completó.

## Herramientas y dependencias

| Herramienta | Versión observada | Nota |
|---|---:|---|
| Node.js | 24.15.0 | Coincide con el major usado por CI. |
| npm ejecutable | 11.17.0 | `packageManager`/Angular reportan npm 11.16.0; existe deriva menor. |
| Angular CLI del proyecto | 21.2.19 | Se invocó desde `frontend-angular/node_modules`. |
| Angular core | 21.2.19 | Instalado desde el lockfile existente. |
| TypeScript | 5.9.3 | Reportado por Angular CLI. |
| PHP CLI | 8.2.12 | Ejecutable de `C:\xampp\php\php.exe`; CI usa PHP 8.3. |
| Composer | 2.8.4 | `composer.lock` presente. |

`frontend-angular/node_modules` ya contenía la instalación requerida. `backend-laravel/vendor` era un junction hacia un directorio temporal y no contenía inicialmente un autoload utilizable; se ejecutó `composer install` contra `composer.lock`, sin actualizar dependencias. No se ejecutó `npm install`, `npm update`, `composer update` ni ningún `--force`.

## Matriz de entornos

| Contexto | API | Firebase | Storage/datos | Evaluación |
|---|---|---|---|---|
| Angular producción (`environment.ts`) | Render productivo | Proyecto `daemon-a41f8` | Supabase productivo, bucket `daemon-assets` | Producción. |
| Angular cloud (`environment.cloud.ts`) | Render productivo | Proyecto `daemon-a41f8` | Supabase productivo | Marcado `production: false`, pero usa producción. |
| Angular development (`environment.development.ts`) | `localhost:8000` | Proyecto `daemon-a41f8` | Supabase productivo | Mezcla insegura: API local con Firebase/Storage productivos. |
| Angular staging (`environment.staging.ts`) | Placeholder | Placeholder | Placeholder | No ejecutable hasta generar configuración aislada. |
| Backend `.env` local | `APP_ENV=local` | Proyecto `daemon-a41f8` | PostgreSQL `aws-1-sa-east-1.pooler.supabase.com`, DB `postgres` | La base es producción aunque la app diga local. |
| PHPUnit | Aplicación local | HTTP/Mail simulados donde corresponde | SQLite `:memory:` por `phpunit.xml` | Seguro para escritura efímera. |
| Playwright por defecto | `npm run start:cloud` | Productivo | Productivo | Inseguro para baseline; no ejecutado. |

`.firebaserc` solo declara como default el proyecto productivo. No existe una configuración local/emulada lista para ejecutar el portal alumno autenticado. El workflow `staging-deploy.yml` contiene controles correctos para rechazar identificadores productivos, pero depende de variables externas no verificables desde el repositorio.

## Autoridad de datos verificada preliminarmente

Esta trazabilidad no reemplaza ADR-001; explica por qué el ADR quedó bloqueado.

| Dominio | Lectores observados | Escritores observados | Riesgo |
|---|---|---|---|
| Identidad | Firebase Auth en Angular; verificador Firebase en Laravel | Firebase Auth; sincronización Laravel | La identidad está clara, pero desarrollo usa el proyecto productivo. |
| Usuario, rol y sesión de aplicación | Angular vía API; Laravel/Sanctum | Laravel/PostgreSQL | Autoridad coherente en Laravel. |
| Cuentos | Angular lee Firestore; API pública y servicios Laravel leen PostgreSQL | Angular escribe/elimina Firestore; Laravel crea/elimina PostgreSQL | Dos fuentes mutables activas. |
| Comentarios y reacciones de cuentos | Angular/Firestore | Angular/Firestore | Reglas locales candidatas demasiado amplias; despliegue desconocido. |
| Imágenes de cuentos | Angular resuelve/sube a Supabase Storage | Cliente Angular y servicios Laravel según flujo | No hay aislamiento local y falta una abstracción única. |

Hallazgos concretos:

- `frontend-angular/src/app/features/cuentos/services/cuento.ts` ejecuta `getDocs`, `setDoc`, `addDoc`, `updateDoc` y `deleteDoc` directamente.
- `backend-laravel/routes/api.php`, `App\Services\Cuento\CuentoService` y el modelo `Cuento` mantienen CRUD sobre PostgreSQL.
- `galeria-proyectos.ts` conserva un método de migración que lee el endpoint Laravel y escribe directamente a Firestore desde la UI.
- El archivo local no versionado `firestore.rules` exige autenticación en varios caminos, pero permite escrituras de comentarios y reacciones a cualquier usuario autenticado y no implementa un contrato versionado completo. No se desplegó ni se probó.

## Baseline de calidad

| Área | Estado | Evidencia resumida |
|---|---|---|
| Arquitectura frontend | Pasa | `shared` y `core` respetan límites. |
| Tokens de estilo | Pasa | Cero violaciones detectadas. |
| Contrato visual alumno | Pasa | 52 archivos revisados. |
| Pruebas frontend | Pasa | 20 suites, 72 pruebas. |
| Cobertura frontend | Parcial | 72.91% statements; 49.91% branches; servicio Firestore de Cuentos prácticamente sin cobertura. |
| Build producción | Falla | Errores TypeScript del refactor preexistente de Crear Cuento/servicios IA. |
| Pruebas Laravel | Falla mínima | 133 pasan, 1 falla: el request de cuento ya no ofrece `data_6`/`pos_6` que el test exige. |
| E2E | No ejecutado | La configuración por defecto usa producción y el smoke público envía un login inválido al backend productivo. |
| Lint | No disponible | No existe script `lint` en `package.json`. |
| Bundle | No medible | Build fallido; `dist/frontend-angular/browser` quedó sin archivos. |
| Auditoría npm | Pasa el umbral high | Un aviso low en Quill; solo se ofrece una corrección breaking con `--force`, que no se ejecutó. |
| Auditoría Composer | Falla | Cuatro avisos medium en Guzzle fijado por el lockfile. |

El primer intento de PHPUnit falló porque Laravel infirió la base desde el junction temporal de `vendor`. La repetición con `APP_BASE_PATH=C:\laragon\www\daemon\backend-laravel` ejecutó la suite aislada en SQLite y produjo el resultado válido anterior. El junction no se eliminó ni reemplazó.

## Capturas responsive y auditoría de navegador

No se tomaron capturas del portal alumno. Hacerlo con la configuración actual habría requerido una de estas opciones no autorizadas:

- arrancar `start:cloud`, que usa API, Firebase y Storage productivos;
- arrancar `start:local`, que todavía usa Firebase y Supabase productivos;
- usar credenciales reales/de prueba contra producción;
- modificar primero la arquitectura de entornos antes de cerrar el baseline.

| Viewport requerido | Resultado |
|---|---|
| 360 × 800 | Bloqueado por falta de entorno aislado/autenticación segura. |
| 390 × 844 | Bloqueado por falta de entorno aislado/autenticación segura. |
| 768 × 1024 | Bloqueado por falta de entorno aislado/autenticación segura. |
| 1024 × 768 | Bloqueado por falta de entorno aislado/autenticación segura. |
| 1440 × 900 | Bloqueado por falta de entorno aislado/autenticación segura. |

Por la misma razón no existe evidencia reproducible de consola, red, accesibilidad, Core Web Vitals ni responsive del portal autenticado. Los checks estáticos visuales sí se ejecutaron, pero no sustituyen pruebas de navegador.

## Clasificación de pruebas que escriben datos

| Suite/comando | Escritura | Destino | Decisión |
|---|---|---|---|
| Jest / `npm run test:ci` | Estado simulado, DOM y mocks | Proceso local | Ejecutado. |
| Laravel Unit/Feature | Crea, actualiza y elimina filas; finge HTTP y correo en casos correspondientes | SQLite `:memory:` | Ejecutado. |
| `npm run e2e:public` | Envía un intento de login inválido | Backend productivo por `start:cloud` | No ejecutado. |
| Playwright `authenticated` | Login y navegación con credenciales; consumidores apuntan a servicios productivos | Producción | No ejecutado. |
| `npm run build` | Solo artefactos locales | `dist/` | Ejecutado; falló. |

## Matriz de riesgos

| ID | Severidad | Riesgo | Estado | Acción necesaria |
|---|---|---|---|---|
| P0-01 | Crítica | Credencial de proveedor IA incrustada/obfuscada en código versionado. | Abierto | Revocar/rotar externamente, eliminar fallback, revisar historial y telemetría del proveedor. |
| P0-02 | Crítica | Desarrollo, cloud y E2E reutilizan recursos productivos. | Abierto | Aprovisionar emuladores o proyectos aislados y guards fail-closed antes de pruebas de navegador. |
| P0-03 | Crítica | Cuentos posee dos autoridades mutables activas. | Abierto | Decisión del propietario y ADR; congelar migraciones/dual writes hasta aprobar estrategia. |
| P0-04 | Alta | Reglas Firestore locales candidatas no están versionadas/probadas y el despliegue es desconocido. | Abierto | Diseñar rules v2, tests de Emulator Suite e índices; verificar despliegue por canal seguro. |
| P0-05 | Alta | Build de producción roto en trabajo preexistente de Cuentos. | Abierto | Completar o revertir selectivamente el refactor por su autor; no mezclarlo con ADRs. |
| P0-06 | Alta | No hay baseline visual autenticado reproducible. | Abierto | Desbloquear entorno local/emulado y fixtures sintéticos Kids/Teens. |
| P0-07 | Media | Suite Laravel exige contrato legacy de seis escenas que el request ya no expone. | Abierto | Resolver contrato canónico después del ADR de Cuentos; no cambiar a ciegas. |
| P0-08 | Media | Cuatro advisories Composer medium en Guzzle. | Abierto | Evaluar actualización compatible del lockfile en paquete separado y con regresión HTTP. |
| P0-09 | Baja | Advisory low de Quill con corrección propuesta breaking. | Abierto | Revisar uso de export HTML/sanitización; no ejecutar `npm audit fix --force`. |
| P0-10 | Media | `vendor` es junction a un directorio temporal y rompe inferencia de base de PHPUnit. | Mitigado localmente | Normalizar instalación local o fijar `APP_BASE_PATH` en tooling; no tocar junction sin acuerdo. |
| P0-11 | Media | Falta `docs/DAEMON-CURRENT-STATE.md` y hay contradicción sobre Phase 1. | Abierto | Restaurar/crear estado verificado y alinear documentos del sistema de diseño. |

## Decisiones adoptadas en Package 0

- Preservar todo cambio preexistente del propietario.
- No desplegar, no hacer push, no ejecutar migraciones, seeds, tinker, E2E ni capturas contra producción.
- Aceptar PHPUnit únicamente con SQLite en memoria y `APP_BASE_PATH` explícito.
- No medir bundle con artefactos históricos ni presentar capturas de login como capturas del portal alumno.
- No iniciar Package 1 mientras sigan abiertos P0-01, P0-02 y P0-03.
- No reproducir secretos en documentos o logs.

## Plan de paquetes

| Orden | Paquete | Resultado esperado | Gate de entrada |
|---:|---|---|---|
| 0 | Baseline y protección | Evidencia reproducible, matriz de entornos/riesgos y comandos | Completado con bloqueos. |
| 0A | Contención crítica | Rotación de credencial, eliminación segura del fallback, entorno aislado mínimo y build recuperado | Autorización del propietario para rotación/aprovisionamiento y resolución del trabajo preexistente. |
| 1 | Arquitectura y autoridad | ADR-001 a ADR-006 aprobados | P0-01/P0-02 contenidos y decisión explícita sobre autoridad de Cuentos. |
| 2 | Aislamiento de entornos | Local/emuladores/staging fail-closed, sin IDs productivos | ADR-006 aprobado y recursos no productivos disponibles. |
| 3 | Firestore versionado y seguro | Rules v2, índices, Emulator Suite y pruebas negativas/positivas | ADR-002/003 aprobados. |
| 4 | Reestructuración de Cuentos | Dominio, repositorios, migración compatible, Storage e IA desacoplados | Rules/tests verdes y estrategia de autoridad aprobada. |
| 5 | Experiencia Kids/Teens y sistema visual | Componentes, estados, accesibilidad y responsive sin alterar contratos críticos | Autoridad y entornos estables. |
| 6 | Calidad, rendimiento y observabilidad | Cobertura objetivo, E2E aislado, Web Vitals, seguridad y CI | Build verde y fixtures sintéticos. |
| 7 | Migración y preparación de release | Dry runs, rollback, matriz final y evidencia de producción | Todos los gates anteriores; despliegue requiere autorización separada. |

## Referencias oficiales consultadas

Se consultaron las versiones vigentes solicitadas antes de cerrar el gate:

- Angular: [style guide](https://angular.dev/style-guide), [signals](https://angular.dev/guide/signals), [zoneless](https://angular.dev/guide/zoneless), [performance](https://angular.dev/best-practices/performance), [accessibility](https://angular.dev/best-practices/a11y).
- Firebase: [modelo Firestore](https://firebase.google.com/docs/firestore/data-model), [prácticas](https://firebase.google.com/docs/firestore/best-practices), [Security Rules](https://firebase.google.com/docs/firestore/security/get-started), [pruebas con Emulator Suite](https://firebase.google.com/docs/firestore/security/test-rules-emulator), [transacciones](https://firebase.google.com/docs/firestore/manage-data/transactions), [índices](https://firebase.google.com/docs/firestore/query-data/indexing), [reglas](https://firebase.google.com/docs/rules), [emuladores](https://firebase.google.com/docs/emulator-suite), [Storage Rules](https://firebase.google.com/docs/storage/security), [condiciones de Storage](https://firebase.google.com/docs/storage/security/rules-conditions), [App Check web](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).
- Seguridad: [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/), [OWASP Top 10](https://owasp.org/www-project-top-ten/), [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/).
- Rendimiento: [Web Vitals](https://web.dev/articles/vitals), [Learn Performance](https://web.dev/learn/performance/).
- Accesibilidad: [WCAG 2](https://www.w3.org/WAI/standards-guidelines/wcag/), [ARIA APG](https://www.w3.org/WAI/ARIA/apg/).

La documentación oficial de Firebase respalda que autorización y validación de tamaño/tipo deben estar en reglas del servidor, y que las reglas deben probarse con emuladores. OWASP respalda tratar un secreto incrustado como fallo de gestión de credenciales. Web Vitals y WCAG/ARIA se registran como criterios de paquetes posteriores; no se inventaron mediciones sin un entorno ejecutable.
