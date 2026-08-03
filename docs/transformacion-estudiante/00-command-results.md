# Package 0 — Resultados de comandos

Fecha de ejecución: 2026-08-02 (`America/Lima`). El timestamp del build se imprimió en UTC como 2026-08-03.

## Reglas de ejecución

- Ningún comando desplegó, hizo push, ejecutó migraciones, seeds, tinker o escritura sobre PostgreSQL/Supabase/Firebase productivos.
- Las pruebas Laravel escribieron exclusivamente en SQLite `:memory:` por `phpunit.xml`.
- Playwright y las capturas se omitieron porque su servidor por defecto es `start:cloud`, conectado a producción.
- No se usó `--force`.
- Los valores secretos no se imprimen en este documento.

## Inventario inicial

| Comando | Resultado | Evidencia |
|---|---|---|
| `git status --short --branch` | Árbol sucio preexistente | Dos archivos modificados y varios no versionados; inventario en `00-baseline.md`. |
| `git log -1` | Correcto | Commit `871fe8a2d4b9b6521e229748b937a47292b3ff11`. |
| `git switch -c refactor/student-production-hardening` | Correcto | Rama exacta solicitada creada sin perder cambios. |
| Verificación de archivos obligatorios | Parcial | `docs/DAEMON-CURRENT-STATE.md`, `firestore.indexes.json` y `storage.rules` ausentes; `firestore.rules` existe sin versionar. |

## Versiones

| Comando | Resultado | Evidencia |
|---|---|---|
| `node --version` | Correcto | `v24.15.0`. |
| `npm --version` | Correcto | `11.17.0`. |
| `frontend-angular/node_modules/.bin/ng version` | Correcto | Angular CLI/Core `21.2.19`, TypeScript `5.9.3`; package manager declarado `npm 11.16.0`. |
| `php --version` | Correcto | PHP `8.2.12` desde XAMPP. |
| `composer --version` | Correcto | Composer `2.8.4`. |

## Instalación reproducible

| Comando | Resultado | Evidencia |
|---|---|---|
| Comprobación de lockfiles | Correcto | `frontend-angular/package-lock.json` y `backend-laravel/composer.lock` presentes. |
| `composer install --no-interaction --prefer-dist --no-progress` | Correcto | 137 instalaciones, 0 updates, 0 removals; autoload y package discovery generados. |
| Instalación npm | No necesaria | `node_modules` y CLI del proyecto ya estaban disponibles; no se modificó el lockfile. |

Observación: `backend-laravel/vendor` es un junction hacia `C:\Users\MEDINA\AppData\Local\Temp\daemon-local-network\backend-laravel\vendor`. Composer instaló en ese destino. No se eliminó ni reemplazó el junction.

## Checks frontend

| Comando | Resultado | Evidencia |
|---|---|---|
| `npm run check:architecture` | Pasa | “Arquitectura frontend válida”. |
| `npm run check:style-tokens` | Pasa | Cero violaciones. |
| `npm run check:student-visual` | Pasa | Contrato visual válido; 52 archivos. |
| `npm run test:ci` | Pasa | 20 suites, 72 tests, 0 fallos, 0 snapshots. |

Cobertura global Jest:

| Métrica | Resultado |
|---|---:|
| Statements | 72.91% |
| Branches | 49.91% |
| Functions | 56.60% |
| Lines | 73.99% |

Cobertura relevante de Cuentos:

- `features/cuentos/services/cuento.ts`: 7.84% statements, 0% branches, 0% functions.
- `galeria-proyectos.ts`: 73.50% statements, 49.52% branches, 54.71% functions.
- No hay cobertura útil del nuevo servicio IA no versionado en este baseline.

Warning no bloqueante de Jest: `ts-jest` recomienda evaluar `esModuleInterop: true`. No se cambió configuración durante Package 0.

## Build de producción

Comando: `npm run build`.

Resultado: falla después de la compilación Angular; `dist/frontend-angular/browser` contiene 0 archivos, por lo que no existe un bundle actual medible.

Errores bloqueantes observados:

- `CrearCuento` referencia `this.chatbot` en tres puntos, pero la inyección fue reemplazada parcialmente.
- `CrearCuento` referencia `TIPOS_IMAGEN` y `MAX_IMAGEN_BYTES`, propiedades retiradas por el cambio preexistente.
- `cuentos-ia.service.ts` importa una ruta inexistente de `Chatbot`.
- El tipo resultante del servicio queda como `unknown` en tres usos.

Warnings existentes observados:

- Imports Angular no usados en Layout Alumno, Crear Cuento, Galería y Ver Cuento.
- Optional chaining/nullish coalescing redundantes en componentes de lectura.
- Cinco usos de Sass `@import` deprecados en estilos globales.
- El release stamp no encontró placeholder en `index.html`; el prebuild se ejecutó dos veces porque el script `build` y el hook `prebuild` invocan la misma tarea.

No se modificaron esos archivos porque pertenecen al trabajo sin commit detectado antes de Package 0.

## Pruebas Laravel

### Intento 1

Comando: `php artisan test`.

Resultado: no válido como prueba de lógica. Laravel infirió el base path desde el junction temporal de Composer e intentó cargar un `bootstrap/app.php` inexistente bajo el directorio temporal. Se registraron 133 fallos y 1 paso, todos dominados por el fallo de bootstrap.

### Intento 2 aislado

Comando:

```powershell
$env:APP_BASE_PATH='C:\laragon\www\daemon\backend-laravel'
php artisan test
```

Resultado válido: 133 tests pasan, 1 falla, 474 assertions, 7.25 s.

Único fallo funcional:

- `Tests\Unit\RemainingRequestRulesTest::story request supports six scenes` espera las claves `data_6` y `pos_6` en `GuardarCuentoRequest`; la implementación actual no contiene `data_6`. La corrección depende del contrato canónico de Cuentos y no se improvisó en Package 0.

La configuración efectiva de pruebas fija:

- `APP_ENV=testing`;
- `DB_CONNECTION=sqlite`;
- `DB_DATABASE=:memory:`;
- mailer `array`;
- cache `array`;
- queue `sync`.

Los tests de Firebase usan certificados de fixture y `Http::fake()` donde hacen llamadas administrativas. No se observaron escrituras a producción durante la suite.

## Auditorías de dependencias

| Comando | Resultado | Evidencia |
|---|---|---|
| `npm audit --omit=dev --audit-level=high` | Exit 0 | 1 advisory low en Quill 2.0.3; la solución sugerida es breaking y requiere `--force`, no ejecutado. |
| `composer audit --locked` | Exit 1 | 4 advisories medium sobre `guzzlehttp/guzzle` anterior a versiones corregidas. |

Advisories Composer registrados:

- Referer con fragmentos durante redirects.
- Alcance host-only de cookies no preservado.
- Cookies de respuesta sin cota con riesgo de denegación de servicio.
- `Proxy-Authorization` potencialmente enviado al origin.

No se actualizó ninguna dependencia.

## E2E y capturas

| Comando/actividad | Resultado | Motivo |
|---|---|---|
| `npm run e2e:public` | No ejecutado | `playwright.config.ts` arranca `npm run start:cloud`; `auth.spec.ts` envía un POST de login inválido al backend productivo. |
| Playwright `authenticated` | No ejecutado | Exige credenciales y navega sobre servicios productivos. |
| Captura 360 × 800 | No ejecutada | Portal alumno autenticado sin entorno aislado. |
| Captura 390 × 844 | No ejecutada | Portal alumno autenticado sin entorno aislado. |
| Captura 768 × 1024 | No ejecutada | Portal alumno autenticado sin entorno aislado. |
| Captura 1024 × 768 | No ejecutada | Portal alumno autenticado sin entorno aislado. |
| Captura 1440 × 900 | No ejecutada | Portal alumno autenticado sin entorno aislado. |
| Consola/red/a11y/Web Vitals | No medido | No se abrió una sesión autenticada segura. |

## Comandos deliberadamente no ejecutados

- `php artisan migrate`, `migrate --pretend`, seeds y tinker: `.env` apunta a PostgreSQL productivo y Package 0 no necesita consultar ni escribir esa base.
- Cualquier `firebase deploy`, comando Render, `git push` o workflow manual.
- Scripts smoke de producción.
- `npm audit fix`, `npm audit fix --force`, `composer update` o `npm update`.
- Cargas de archivos o pruebas de Storage.

## Archivos de Package 0

### Creados

- `docs/transformacion-estudiante/00-baseline.md`.
- `docs/transformacion-estudiante/00-command-results.md`.

### Modificados

- Ninguno de código/configuración por Package 0.

### Eliminados

- Un archivo compilado no versionado bajo `backend-laravel/storage/framework/views/`, creado por la ejecución local de PHPUnit, se eliminó al cerrar el paquete.

## Estado del gate

Package 1 no se ejecuta. Para abrirlo se requiere, como mínimo:

1. rotar/revocar la credencial incrustada y eliminar el fallback sin exponer el valor;
2. disponer de Firebase/Firestore/Storage y API no productivos o emulados con guards fail-closed;
3. recuperar un build reproducible sin sobrescribir el refactor preexistente;
4. obtener decisión explícita del propietario sobre la autoridad canónica y migración de Cuentos.
