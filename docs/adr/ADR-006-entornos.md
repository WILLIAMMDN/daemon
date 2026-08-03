# ADR-006: Aislamiento verificable de entornos

- Estado: Aceptado
- Fecha: 2026-08-02
- Prioridad: crítica
- Implementación: Paquete 2 completado; staging remoto pendiente de aprovisionamiento

## Contexto

El repositorio no aísla hoy desarrollo de producción:

- `environment.development.ts` usa Firebase y Supabase productivos;
- `environment.cloud.ts` usa API, Firebase, Supabase y Pusher productivos aunque
  declara `production: false`;
- `npm start` sirve por defecto la configuración `cloud`;
- `.firebaserc` solo define el proyecto productivo como `default`;
- `.env.example` propone el host PostgreSQL y proyecto Firebase productivos;
- el `.env` local conocido apunta a PostgreSQL productivo;
- staging contiene placeholders y una plantilla, pero no hay evidencia de que
  todos los recursos aislados estén provisionados;
- E2E sobre `start:cloud` alcanzaría servicios reales.

Por ello un booleano `production` o el nombre de una rama no demuestra el
entorno. Hasta completar el Paquete 2, quedan bloqueados E2E con escritura,
emulaciones conectadas a configuración productiva, migraciones y scripts de
datos.

## Decisión

DAEMON tendrá cuatro perfiles explícitos y no intercambiables:

| Perfil     | Angular/API            | Firebase                           | PostgreSQL                                   | Storage/Pusher/Sentry                               | Datos permitidos                                 |
| ---------- | ---------------------- | ---------------------------------- | -------------------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| Local      | `localhost`            | Emulator Suite con project ID demo | DB local aislada, nunca el pooler productivo | fake/emulador/local; telemetría externa desactivada | Fixtures sintéticos                              |
| Test/CI    | proceso de test        | Emulator Suite/proyecto demo       | SQLite in-memory o contenedor efímero        | fakes; red externa denegada                         | Fixtures sintéticos deterministas                |
| Staging    | URL y Render distintos | proyecto/sitio Firebase distintos  | proyecto Supabase distinto                   | buckets/apps/proyecto Sentry distintos              | Datos sintéticos, nunca copias crudas de menores |
| Producción | URLs públicas vigentes | `daemon-a41f8`                     | Supabase productivo                          | buckets/Pusher/Sentry productivos                   | Datos reales bajo controles operativos           |

No se autoriza un modo “cloud development” que use producción para comodidad.
Los previews se consideran staging y no existen hasta provisionar recursos
aislados.

## Contrato de configuración frontend

El Paquete 2 crea y usa explícitamente:

- `environment.development.ts`;
- `environment.staging.ts`;
- `environment.production.ts`;
- un contrato tipado común con `environmentName`, API, Firebase, Storage,
  realtime, observabilidad y flags de emulador;
- file replacements inequívocos en `angular.json`.

`environment.ts` deja de contener silenciosamente producción: será el entry
seguro que Angular reemplaza o reexporta la configuración local según la
estrategia que conserve mejor el tooling. Solo el build `production` puede
incorporar identificadores productivos. La configuración muestra un indicador
no sensible en entornos no productivos.

Reglas:

- `npm start` inicia local/emuladores; un comando separado y explícito sirve
  staging;
- se elimina `start:cloud` o se convierte en alias seguro de staging cuando
  exista;
- `production` no se infiere de hostname; se valida un conjunto coherente de
  IDs/URLs;
- ninguna clave de servidor entra en Angular. Firebase web config y una
  publishable/anon key no se clasifican como secretos, pero sí se validan por
  proyecto y RLS;
- App Check usa sites/keys/debug tokens separados;
- Service Worker no contamina pruebas locales salvo suite PWA dedicada.

## Backend local, test y staging

- `.env.example` usa host y nombres locales no productivos y documenta variables
  sin valores de producción.
- `.env.testing` mantiene SQLite in-memory y desactiva correo, colas externas,
  broadcast, Sentry, Firebase/Storage reales e IA real.
- desarrollo usa una PostgreSQL local/contenedor aislado o un perfil explícito
  que no arranque si falta; nunca recurre al pooler productivo.
- staging usa un proyecto Supabase, Firebase, Storage, Pusher y URLs distintos.
- secretos se inyectan desde el gestor del entorno/CI, no desde archivos
  versionados.
- IA usa fake/Ollama local y E2E usa mocks estables.
- ningún bootstrap local ejecuta migraciones automáticamente contra un host no
  verificado.

## Guard de seguridad

`scripts/check-environment-safety.*` inspeccionará configuración versionada y
variables efectivas sin imprimir valores secretos. Debe fallar con exit code no
cero cuando:

- localhost usa API productiva sin una excepción explícita, temporal y de solo
  lectura aprobada;
- desarrollo/test usa `daemon-a41f8` o endpoints/buckets productivos;
- Laravel local resuelve el host/proyecto PostgreSQL productivo;
- staging comparte cualquier identificador crítico con producción;
- un comando destructivo o E2E podría usar producción;
- una combinación es inválida, incompleta o contiene placeholders al intentar
  desplegar.

El guard compara fingerprints/allowlists no sensibles, no muestra passwords,
tokens, DSN completos, service accounts ni anon keys. CI ejecuta el guard antes
de TypeScript, tests, scripts de datos o deploy.

Además se añade una barrera Laravel para comandos destructivos:

1. identifica `APP_ENV`, conexión, host y proyecto con valores redactados;
2. rechaza producción por defecto;
3. requiere un entorno local/staging reconocido;
4. ofrece dry-run antes de cualquier escritura;
5. no usa `--force` como escape en flujos de transformación.

## Firebase CLI y Emulator Suite

- `firebase.json` declara emuladores de Auth y Firestore con puertos estables y
  reglas/índices versionados.
- `.firebaserc` usa aliases explícitos `production` y `staging` solo cuando este
  último exista; scripts siempre reciben `--project`.
- para emulador se usa un project ID `demo-*`, que no puede alcanzar recursos
  reales.
- reglas se prueban con `@firebase/rules-unit-testing` y estado limpiado entre
  casos.
- no se ejecuta `firebase deploy` durante esta transformación.

## CI/CD y despliegue

- PR/refactor ejecuta checks, nunca deploy automático.
- staging exige environment protegido, recursos distintos y comprobación de
  safety antes de build/migración.
- producción exige rama/flujo autorizado, checks aprobados y configuración
  exacta; esta rama no lo ejecuta.
- Workload Identity Federation es preferido a JSON persistente; el fallback
  existente no se elimina hasta provisionar y probar WIF.
- ningún secreto ni dump de datos se publica como artifact.

## E2E y datos

- Playwright arranca Angular local, Laravel testing, Auth/Firestore Emulator y
  adaptadores fake de Storage/IA.
- usuarios son fixtures sintéticos KIDS/TEENS/docente/admin/tutor; nunca cuentas
  reales de menores.
- interceptar solo HTTP no basta si el SDK Firebase conserva configuración
  productiva: el test verifica project ID y hosts antes de comenzar.
- pruebas de PWA, offline y errores usan el mismo entorno aislado.

## Criterios de salida del Paquete 2

- ningún archivo development/test contiene IDs, URLs o buckets productivos;
- backend local no puede conectar accidentalmente al pooler productivo;
- `npm start` y E2E son locales por defecto;
- staging provisionado o marcado explícitamente no disponible sin fallback a
  producción;
- guard falla ante cada combinación peligrosa mediante pruebas automatizadas;
- build production sigue siendo reproducible sin exponer secretos;
- `docs/ENVIRONMENTS.md` documenta comandos, recursos y bloqueo;
- no se ejecutó deploy, migración ni escritura productiva.

## Consecuencias

La implementación elimina `environment.cloud.ts`/`start:cloud`, conecta
development a Auth y Firestore Emulator, hace local el proyecto Firebase por
defecto, incorpora guards Node/Laravel con pruebas negativas y retira el deploy
automático de PR. El contrato operativo completo vive en
[`docs/ENVIRONMENTS.md`](../ENVIRONMENTS.md).

### Positivas

- Los siguientes paquetes pueden probar reglas, migraciones, Storage e IA sin
  riesgo para usuarios reales.
- Una configuración incompleta falla visible en vez de usar producción.
- CI puede demostrar aislamiento antes de ejecutar pruebas con escritura.

### Costes y bloqueo

- Hace falta provisionar recursos reales de staging fuera del código.
- El desarrollo local necesita emuladores y una DB aislada.
- Hasta completar ese aprovisionamiento no se pueden ejecutar los E2E críticos
  ni probar adaptadores contra servicios remotos.

## Alternativas descartadas

- Usar producción con `production:false`: el flag no aísla datos.
- Confiar en disciplina manual o nombres de archivos: no es verificable en CI.
- Usar datos reales anonimizados de menores en staging: se usarán fixtures
  sintéticos.
- Continuar al Paquete 3 sin aislamiento: las reglas y migraciones necesitan un
  emulador seguro primero.

## Evidencia y referencias

- `frontend-angular/angular.json`
- `frontend-angular/package.json`
- `frontend-angular/src/environments/`
- `backend-laravel/.env.example`
- `backend-laravel/.env.testing`
- `.firebaserc`
- `render.staging.yaml`
- `docs/infraestructura-operativa.md`
- [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Conectar una aplicación a los emuladores](https://firebase.google.com/docs/emulator-suite/connect_and_prototype)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
