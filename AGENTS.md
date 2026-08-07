# DAEMON agent guide

This file is the fastest onboarding point for AI agents working in this repo.
Read it before editing code. For a fuller snapshot, read
`docs/ai-project-context.md`.

## Project root

Use this root unless the user says otherwise:

```text
C:\laragon\www\daemon
```

The repo is a real production-oriented DAEMON app, not a static demo.

## Current architecture

```text
Firebase Hosting
  -> Angular frontend in frontend-angular/
  -> Laravel API on Render
  -> Supabase PostgreSQL for business data
  -> Supabase Storage for uploaded business files
  -> Firebase Auth for Google, email/password, verification and password reset emails
```

Firebase Auth is the identity provider. Laravel/Sanctum remains the app
authority for roles, session, academic data, tokens, missions, badges, store,
evaluations, files, and AI modules.

## Important current decisions

- Do not replace the app with static files.
- Do not move business database data to Firebase.
- Keep PostgreSQL/Supabase as the business database.
- Use Firebase Auth for email/password login, Google login, email verification
  email delivery, and password-reset email delivery.
- Keep Laravel as the API and data authority.
- Do not rely on Resend for student emails until a sending domain is verified.
- Resend can only send to the owning account while in testing mode.
- Firebase verification emails may show `firebaseapp.com`; this is accepted for
  the free/working stage.
- If a domain is purchased and verified later, custom DAEMON emails can be
  re-enabled through Laravel mail services.

## Key public URLs

```text
Frontend production: https://daemonestudiante.web.app
Backend production:  https://daemon-5vo1.onrender.com/api/v1
Health endpoint:     https://daemon-5vo1.onrender.com/api/v1/salud
GitHub repo:         https://github.com/WILLIAMMDN/daemon
Firebase project:    daemon-a41f8
Hosting site:        daemonestudiante
Supabase project:    lbxdcvsrmkkynttgwblc
Supabase bucket:     daemon-assets
```

## Main folders

```text
backend-laravel/      Laravel 12 API, Sanctum auth, models, services, tests
frontend-angular/     Angular 21 app for public, student and teacher portals
database/             SQL dumps/backups and database support files
docs/                 Project documentation and runbooks
legado/               Legacy system reference; do not edit unless asked
scripts/              Local automation helpers
```

## Frontend facts

- Angular app lives in `frontend-angular`.
- Production env points to Render API and Supabase asset base.
- Firebase web config is in `frontend-angular/src/environments/`.
- Login with email uses Firebase Auth when the username contains `@`.
- Login with local username still calls Laravel `/auth/login`.
- The login mascot uses Rive: `/rive/login-teddy.riv`.
- The pink teddy image fallback was removed; loading/failure fallback is a
  DAEMON `D` medallion.
- The verification banner uses Firebase email verification and then silently
  syncs DAEMON when returning with `?verificacion=firebase`.
- Password recovery page uses Firebase `sendPasswordResetEmail`, not the
  Laravel/Resend endpoint.
- The student portal uses Inter, solid colors, white cards and a compact header.
- Do not reintroduce gradients or Outfit in the main student modules.
- The existing purple sidebar is intentionally preserved; its IDs are also
  used by the onboarding tour.
- App-shell components live in `core`: the portal sidebar is under
  `core/layouts/sidebar-portal` and the verification banner is under
  `core/componentes/email-verification-banner`.
- `shared` must not import `core` or `features`; run
  `npm run check:architecture` to validate the boundary.
- The family portal lives at `/familias`, uses the dedicated `tutor` role and
  requires verified email plus explicit invitation acceptance before exposing
  a minor's progress.
- Family reports may show the student's contextual ranking position. Do not
  hide or remove the ranking from the student portal.
- Screen-time tracking stores daily aggregate seconds only. Do not introduce
  browsing, keystroke, chat or surveillance telemetry.
- Read `docs/sistema-visual-portal-alumno.md` and `docs/portal-alumno.md` before
  changing the student layout or modules.

## Backend facts

- API routes are in `backend-laravel/routes/api.php` under `/api/v1`.
- `usuarios` is the canonical user table, not Laravel's default `users`.
- Firebase tokens are validated in `FirebaseTokenVerifier`.
- `AutenticacionService` links Firebase users to DAEMON users by
  `firebase_uid`, email, or phone.
- Sanctum tokens are issued after Laravel accepts the Firebase or local login.
- `email_verified_at` is synchronized from Firebase claims after verified login.
- Backend email services still exist for custom future email flows, but current
  frontend verification/recovery does not depend on Resend.
- `usuarios.experiencia` is permanent XP for level and ranking.
- `usuarios.tokens` is the spendable DAEMONS balance.
- Academic rewards go through `GamificacionService`; store redemptions never
  subtract XP.
- Ranking queries order by `experiencia`, not tokens.
- Tutor accounts must authenticate through `/auth/tutor/firebase`; never
  silently convert an existing student, teacher or admin account into a tutor.
- DAEMON must not receive or store payment-card details. Family checkout links
  are provider-hosted HTTPS URLs configured outside source control.

## Storage and assets

- Frontend static assets stay in Firebase Hosting.
- Uploaded business files go to Supabase Storage bucket `daemon-assets`.
- `uploads/` paths should resolve from Supabase Storage in production.
- `img/`, `galeria/`, `audio/`, `rive/`, `legacy/`, and similar frontend assets
  belong to Angular/Firebase Hosting.
- Use the local `Activos` service for asset URL resolution on Angular.

## Verification commands

Run these after meaningful changes:

```powershell
cd C:\laragon\www\daemon\frontend-angular
npm run build

cd C:\laragon\www\daemon\backend-laravel
php artisan test

cd C:\laragon\www\daemon
git status --short --branch
```

The initial bundle currently stays around 1.28 MB, which exceeds the configured
1 MB warning budget. The build passes, but treat any new or larger warning as a
regression to review instead of accepting it by default.

## Deploy commands

Frontend deploy:

```powershell
cd C:\laragon\www\daemon
firebase deploy --only hosting:estudiante --project daemon-a41f8
```

Verify public bundle:

```powershell
cd C:\laragon\www\daemon
.\scripts\smoke-produccion.ps1
```

Backend deploy currently goes through Render/GitHub. If backend env vars change,
verify Render separately.

## Safety rules

- Never commit `.env`, service-account JSON files, Supabase keys, Resend keys,
  or Firebase private service-account secrets.
- Firebase web config in Angular is not private, but service account JSON is
  private.
- Do not run destructive DB commands unless the user explicitly asks and backups
  or dry-runs are clear.
- Do not revert user changes. Inspect `git status` first.
- Prefer scoped changes matching existing Angular/Laravel patterns.

## DB / migrations

`backend-laravel/.env` points **directly at the production Supabase Postgres**
(`aws-1-sa-east-1.pooler.supabase.com`, project `lbxdcvsrmkkynttgwblc`).
There is no local/staging DB. So:

- `php artisan migrate` from local = migration on production.
- `php artisan tinker` DB queries = live production data.
- Always run `php artisan migrate:status` first to see what would actually run.
  All migrations currently show as `[N] Ran` (last batch is 13) — there is
  nothing pending. If a new batch is added, confirm with the user before
  running it.
- Prefer `php artisan migrate --pretend` first to inspect the SQL.
- For ad-hoc read-only inspection of the prod schema, a small PHP script in
  `backend-laravel/` that uses the bootstrap (`__DIR__.'/../bootstrap/app.php'`)
  works fine. Clean it up after — don't commit it.

## Docs to read by task

- Overall project state: `docs/20-architecture/ai-project-context.md`
- Firebase/auth details: `docs/50-security/firebase-auth.md`
- Supabase DB/storage: `docs/40-data/supabase-postgres.md`
- Cloud/GitHub/deploy state: `docs/60-operations/estado-nube-github-produccion.md`
- Test data: `docs/99-archive/datos-prueba.txt`
- Student portal behavior: `docs/10-product/portal-alumno.md`
- Frontend module boundaries: `docs/20-architecture/frontend-architecture.md`
- XP and DAEMONS architecture: `docs/10-product/gamificacion-xp-daemons.md`
- Production QA: `docs/70-quality/qa-produccion.md`
- Runtime, staging, backups and rollback: `docs/60-operations/infraestructura-operativa.md`
- KIDS/TEENS privacy and retention: `docs/50-security/privacidad-kids-teens.md`
- Family/guardian portal: `docs/10-product/portal-familias.md`

**Orden obligatorio para cualquier agente:**
1. `AGENTS.md`
2. `docs/README.md`
3. `docs/00-governance/project-constitution.md` (autoridad global)
4. `docs/00-governance/source-of-truth.md`
5. `docs/00-governance/agent-reading-order.md`
6. documentación canónica del dominio asignado
7. ADR aplicables
8. documentación activa de la iniciativa

La Constitución General (`docs/00-governance/project-constitution.md`)
tiene precedencia global: los documentos de dominio deben respetarla y
ningún agente puede modificarla ni crear excepciones sin autorización
explícita del propietario. La Constitución Visual
(`docs/30-design-system/visual-constitution.md`) tiene autoridad
únicamente dentro del dominio visual. Ante una contradicción de autoridad
(una fuente inferior contra una superior, o dos del mismo nivel), el
agente se detiene y eleva el conflicto en lugar de resolverlo por cuenta
propia.

**Prohibido usar como especificación:**
- historial Git;
- `90-audits-history`;
- documentos eliminados;
- borradores no aprobados;
- conversaciones o memorias locales de otros agentes.

## Sistema de diseño (DAEMON)

**Para trabajo visual:**
1. `docs/30-design-system/visual-constitution.md`
2. `docs/30-design-system/token-map.md`
3. `docs/30-design-system/color-accessibility.md`
4. documentación de la iniciativa concreta

Reglas obligatorias al construir UI:

- Usar siempre tokens `--daemon-*` para colores, bordes y superficies. Prohibido
  hex literales, gradientes hardcodeados u `outline` sin token: el check
  `npm run check:style-tokens` (CI) los bloquea.
- El contrato visual del portal alumno se valida con `scripts/check-student-visual.mjs`.
- **Referencia canónica visual:** la galería de historias
  (`/alumno/proyectos/cuentos`) es el estándar de calidad de assets y
distribución de tarjetas.
- Herramientas base: Tailwind CSS y NG-ZORRO, aplicadas como sistemas de
  componentes, no como clases amontonadas.
- Si un módulo usa `style=` inline o un color fuera del token, se corrige antes
  de commitear (la capa `ui/` y `core/modelos/dto.ts` son los puntos de
  reutilización, ver `docs/20-architecture/frontend-architecture.md`).
