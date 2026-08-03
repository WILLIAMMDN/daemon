# DAEMON — Plan post-merge de monitoring y performance

Fecha: 2026-08-02
Contexto: tras arreglar el ciclo de CI roto y desplegar el keep-alive
workflow a main, este documento recoge lo que **aun falta** para llevar
DAEMON al estandar de la industria en monitoring, observability y
performance.

---

## Estado actual (FASE 1 cerrada)

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `keep-alive.yml` | ✅ Activo | ping cada 5 min al health endpoint. Render se mantiene despierto. |
| `production-monitor.yml` | ✅ Pasa | smoke completo contra produccion cada 10 min. |
| `frontend-ci.yml` | ✅ Configurado | test:ci + build + e2e. Ya no bloquea deploys. |
| `firebase-hosting-merge.yml` | ✅ Configurado | deploy limpio con `--legacy-peer-deps`. |
| `firebase-hosting-pull-request.yml` | ✅ Configurado | preview de PRs. |
| Build-time SHA injection | ✅ Funcionando | el bundle firmado aparece en `daemon-release`. |
| `npm ci` peer-deps loop | ✅ Resuelto | `--legacy-peer-deps` en los 4 workflows. |
| TypeScript / ngx-quill matrix | ✅ Compatible | ngx-quill@29, TypeScript@5.9, Angular 21, zone.js@0.16. |

---

## FASE 2 — Monitoring real (esta semana)

### 2.1 Sentry para Angular + Laravel
Ya tienes `@sentry/angular@^10.65.0` instalado. Falta:

1. Crear cuenta en https://sentry.io (free tier: 5K events/mes).
2. Crear dos proyectos: `daemon-frontend` y `daemon-backend`.
3. Crear dos secrets en GitHub:
   - `SENTRY_DSN_FRONTEND` (angular)
   - `SENTRY_DSN_BACKEND` (laravel)
4. Instalar `sentry/sentry-laravel` en `backend-laravel/`.
5. Inicializar en `app.config.ts` (Angular) y en `bootstrap/app.php` (Laravel).
6. Configurar `tracesSampleRate: 0.1` (10% en prod) y `replaysSessionSampleRate: 0.0` (no grabar sesiones por default por KIDs/TEENs privacy).
7. Configurar source maps upload en build (Angular CLI + Sentry CLI).

### 2.2 UptimeRobot externo
- Crear cuenta en https://uptimerobot.com (free: 50 monitores, 5 min).
- Configurar 3 monitores:
  1. `https://daemonestudiante.web.app` (frontend)
  2. `https://daemon-5vo1.onrender.com/api/v1/salud` (backend)
  3. `https://daemon-5vo1.onrender.com/api/v1/salud` con keyword check de `"ok":true`
- Configurar alertas por email al mantenedor.
- Ventaja sobre keep-alive: UptimeRobot monitora desde fuera, te avisa si Render
  se cae incluso si GitHub Actions no corre.

### 2.3 Bundle analyzer + performance budget
- Agregar `@angular/build`'s `statsJson: true` a `angular.json`.
- En CI (`frontend-ci.yml`), comparar tamaño de bundle contra baseline.
- Falla el CI si algun chunk lazy pasa de 1 MB.
- Herramientas: `webpack-bundle-analyzer` o `source-map-explorer`.

---

## FASE 3 — Performance (despues)

### 3.1 Cache de respuestas API
- Cachear `/api/v1/salud` por 30s (Redis o file cache en Render).
- Cachear queries pesadas de ranking y misiones.
- Laravel: middleware `Illuminate\Cache\RateLimiter` o `spatie/laravel-responsecache`.

### 3.2 CDN edge cache
- Cloudflare en frente de Firebase Hosting y Render.
- Cachear assets estaticos con `Cache-Control: public, max-age=31536000, immutable` (ya esta en parte).
- Cachear HTML del index con `stale-while-revalidate=300`.

### 3.3 DB optimization
- Connection pooling en backend (Render Postgres ya lo hace).
- Indices en `usuarios.experiencia` y `usuarios.tokens` (los queries de ranking).
- EXPLAIN ANALYZE en queries lentas (Laravel Telescope).

---

## FASE 4 — Infra robusta (cuando el proyecto crezca)

### 4.1 Migrar de Render free a Railway / Fly.io
- **Railway** ($5/mes): similar DX a Render, sin cold starts, Postgres incluido.
- **Fly.io** ($3-5/mes): edge global, sin cold starts.
- **Coolify** (self-hosted): VPS + Docker, maximo control.

### 4.2 SLO/SLI definidos
- Uptime SLO: 99.5% mensual (3.6 horas de downtime toleradas).
- Latency SLO: p95 < 500ms en `/api/v1/salud`.
- Error rate SLO: < 0.5% de 5xx en API.
- Medir con Sentry + UptimeRobot dashboards.

### 4.3 Status page publico
- https://statuspage.io (free para open source) o self-hosted (Cachet, Statusfy).
- Publicar uptime, incidents programados, mantenimiento.

### 4.4 OpenTelemetry
- Instrumentar Laravel con `open-telemetry/opentelemetry-auto-laravel`.
- Exportar a un backend (Jaeger, Tempo, Honeycomb).
- Tracing end-to-end de requests del frontend al backend.

---

## Tareas pendientes (acumuladas)

Issues para abrir en `WILLIAMMDN/daemon`:

- [ ] **#T1** Arreglar 196 violaciones nuevas de style-tokens introducidas por el
      merge de `sustentacion/firestore-aula` (afecta `features/alumno/`,
      `features/cuentos/`).
- [ ] **#T2** Actualizar `guzzlehttp/guzzle` a >=7.15.1 (4 vulnerabilidades
      detectadas por composer audit). El PR de Dependabot #31 ya lo propone.
- [ ] **#T3** Reducir 1541 violaciones de style-tokens en baseline (refactor
      progresivo, no urgente).
- [ ] **#T4** Configurar Sentry (FASE 2.1).
- [ ] **#T5** Configurar UptimeRobot (FASE 2.2).
- [ ] **#T6** Evaluar migracion de Render free a plan pago o Railway (FASE 4.1).
