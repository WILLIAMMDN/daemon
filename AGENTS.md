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

Known frontend warnings:

- Initial Angular bundle exceeds the 700 kB budget.
- `@rive-app/canvas` is CommonJS and causes an optimization warning.

These warnings are known and not blockers unless the user asks to optimize
bundle size.

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

## Docs to read by task

- Overall project state: `docs/ai-project-context.md`
- Firebase/auth details: `docs/firebase-auth.md`
- Supabase DB/storage: `docs/supabase-postgres.md`
- Cloud/GitHub/deploy state: `docs/estado-nube-github-produccion.md`
- Test data: `docs/datos-prueba.txt`
- Student portal behavior: `docs/portal-alumno.md`
- Student visual system: `docs/sistema-visual-portal-alumno.md`
- XP and DAEMONS architecture: `docs/gamificacion-xp-daemons.md`
- Production QA: `docs/qa-produccion.md`
- July 2026 release evidence: `docs/release-2026-07-14-portal-alumno.md`
