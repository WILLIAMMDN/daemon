# DAEMON AI project context

This document is written for future AI agents and developers. It summarizes the
current DAEMON system, the cloud decisions already made, the important files,
and the traps that caused confusion during the migration.

Last updated: 2026-07-15.

## 1. What DAEMON is

DAEMON is an academic platform for an AI/technology academy. It has public
pages, student portal, teacher portal, family portal, authentication, XP, DAEMONS, missions,
badges, store/rewards, evaluations, stories, rankings, certificates, chat,
file uploads, and legacy interactive learning resources.

It is not a static website. The frontend must talk to the Laravel API and the
API must persist real data in PostgreSQL/Supabase.

## 2. Current production shape

```text
User browser
  -> Firebase Hosting: https://daemonestudiante.web.app
  -> Angular 21 SPA
  -> Render Laravel API: https://daemon-5vo1.onrender.com/api/v1
  -> Supabase PostgreSQL: business data
  -> Supabase Storage: uploaded business files
  -> Firebase Auth: Google, email/password, verification emails, reset emails
```

The app uses the Firebase project `daemon-a41f8` and Firebase Hosting site
`daemonestudiante`. Supabase project id in current URLs is
`lbxdcvsrmkkynttgwblc`.

## 3. Important project roots

```text
C:\laragon\www\daemon
C:\laragon\www\daemon\frontend-angular
C:\laragon\www\daemon\backend-laravel
```

Older workspace references under `C:\Users\MEDINA\Documents\DAEMON` are not the
active app root for this Laravel/Angular system.

## 4. Frontend

Main frontend stack:

- Angular 21
- Firebase JS SDK
- NG-ZORRO as the preferred open-source Angular UI library for new professional
  components; see `docs/frontend-ui-standard.md`
- Rive canvas mascot
- Tailwind/DaisyUI utilities

Important files:

```text
frontend-angular/src/environments/environment.ts
frontend-angular/src/environments/environment.development.ts
frontend-angular/src/app/core/servicios/api.ts
frontend-angular/src/app/core/servicios/autenticacion.ts
frontend-angular/src/app/core/servicios/firebase-auth.ts
frontend-angular/src/app/core/servicios/sesion.ts
frontend-angular/src/app/core/servicios/activos.ts
frontend-angular/src/app/core/componentes/email-verification-banner/
frontend-angular/src/app/features/autenticacion/pages/login/
frontend-angular/src/app/features/autenticacion/pages/login-docente/
frontend-angular/src/app/features/autenticacion/pages/registro/
frontend-angular/src/app/features/autenticacion/pages/recuperar-clave/
frontend-angular/src/app/features/autenticacion/pages/restablecer-clave/
frontend-angular/src/app/features/autenticacion/pages/bienvenida/
frontend-angular/src/app/core/dominio/nivel-alumno.ts
frontend-angular/src/app/core/dominio/tema-portal-alumno.ts
```

Student audiences are `KIDS` and `TEENS` only. Roles remain independent in
`usuarios.rol`. Angular centralizes selectable levels in `nivel-alumno.ts`, and
Laravel centralizes validation values in `App\Enums\NivelAlumno`. Legacy `PRO`
and level-like `DOCENTE` values are normalized to `TEENS` by migration; teacher
permissions continue to come exclusively from `rol`.

Student portal documentation:

```text
docs/sistema-visual-portal-alumno.md
docs/portal-alumno.md
docs/gamificacion-xp-daemons.md
docs/plan-evolucion-visual-portal-alumno.md
docs/release-2026-07-14-portal-alumno.md
```

Current student visual direction:

- Future portal work starts from `origin/main`; the Antigravity branches are
  explicitly excluded from integration. See `docs/plan-evolucion-visual-portal-alumno.md`.

- Inter only.
- Solid colors; no gradients in the main student modules.
- Canvas `#f4f7fb`, white surfaces, light borders and restrained shadows.
- Blue `#1677ff` for primary actions and XP progress.
- Amber for DAEMONS balance.
- Existing purple sidebar preserved.
- Compact header that displays XP level and DAEMONS separately.
- Dashboard, profile, missions, ranking and store share one visual language.

The earlier experimental Bento/glass implementation was corrected. Do not use
that first iteration as the target for new student screens.

Family portal direction:

- Dedicated Firebase-backed `tutor` role and `/familias` route.
- A verified guardian email and explicit invitation acceptance are required
  before any minor progress is returned.
- The weekly report includes XP, missions, evaluations, activity and the
  student's contextual ranking position. Ranking remains visible to students.
- Screen-time telemetry is limited to daily aggregate seconds; no browsing or
  interaction history is collected.
- DAEMON never receives payment-card data. A configured HTTPS provider portal
  may be exposed later for checkout and subscription management.

Production frontend env currently points to:

```text
apiUrl: https://daemon-5vo1.onrender.com/api/v1
assetBaseUrl: https://lbxdcvsrmkkynttgwblc.supabase.co/storage/v1/object/public/daemon-assets
firebase.projectId: daemon-a41f8
```

## 5. Backend

Main backend stack:

- Laravel 12
- PHP 8.2+
- Sanctum
- PostgreSQL through Supabase
- Firebase token verification
- Resend Laravel package remains installed, but is not the current production
  path for student verification/reset emails

Important files:

```text
backend-laravel/routes/api.php
backend-laravel/app/Models/Usuario.php
backend-laravel/app/Services/Auth/AutenticacionService.php
backend-laravel/app/Services/Auth/FirebaseTokenVerifier.php
backend-laravel/app/Services/Gamificacion/GamificacionService.php
backend-laravel/app/Services/Familias/TutorPortalService.php
backend-laravel/app/Services/Familias/BienestarDigitalService.php
backend-laravel/app/Http/Controllers/Api/V1/AutenticacionController.php
backend-laravel/app/Http/Controllers/Api/V1/RankingController.php
backend-laravel/app/Http/Middleware/EnsureRole.php
backend-laravel/app/Http/Middleware/AuthCookieToken.php
backend-laravel/app/Services/Archivo/ArchivoUrlService.php
backend-laravel/config/filesystems.php
backend-laravel/config/services.php
backend-laravel/config/mail.php
```

The canonical user table is `usuarios`. Do not introduce Laravel's default
`users` table as the app authority.

Gamification uses two independent fields:

- `experiencia`: permanent XP for level and ranking;
- `tokens`: spendable DAEMONS balance.

Do not order ranking by tokens or subtract experience during store redemptions.
Read `docs/gamificacion-xp-daemons.md` before changing rewards.

The student companion system lives at `/alumno/mascota`. Laravel owns species,
cosmetic compatibility, permanent inventory and equipped slots; cosmetic store
redemptions grant inventory inside the same locked transaction that spends
DAEMONS. New art is supplied as aligned transparent layers rather than coded
into Angular. Read `docs/sistema-mascotas-cosmeticos.md` before changing this
domain or publishing new creature assets.

## 6. Authentication decisions

Current working decision:

- Firebase Auth sends verification and password reset emails.
- Angular calls Firebase SDK directly for:
  - `createUserWithEmailAndPassword`
  - `signInWithEmailAndPassword`
  - `signInWithPopup` with Google
  - `sendEmailVerification`
  - `sendPasswordResetEmail`
- Angular then sends Firebase ID tokens to Laravel.
- Laravel validates the Firebase token and issues a Sanctum session/token.
- Laravel stores roles, permanent experience, spendable tokens, academic data, and
  `email_verified_at`.

Why this changed:

- Custom DAEMON emails through Laravel/Resend worked only for the Resend owner
  address while Resend was in testing mode.
- Logs showed Resend rejecting student emails with:

```text
You can only send testing emails to your own email address (...).
To send emails to other recipients, please verify a domain at resend.com/domains.
```

So Firebase emails are preferred now because they work with real student
addresses without buying/verifying a domain.

## 7. Email verification flow now

1. Student registers with email/password in Angular.
2. Angular creates or logs into Firebase.
3. Firebase sends its verification email.
4. Angular sends Firebase ID token to `POST /api/v1/auth/firebase`.
5. Laravel creates/links `usuarios.firebase_uid`.
6. If Firebase claim `email_verified=false`, DAEMON keeps
   `email_verified_at=null`.
7. Student portal shows `EmailVerificationBanner`.
8. Banner button calls Firebase `sendEmailVerification`, not Laravel Resend.
9. Firebase email returns to `/alumno?verificacion=firebase`.
10. Banner silently calls `sincronizarVerificacionFirebase()`.
11. Angular reloads current Firebase user, gets a fresh ID token, sends it to
    Laravel, and Laravel marks `email_verified_at` if Firebase says verified.
12. Banner disappears after `/auth/yo` reflects verified state.

Files:

```text
frontend-angular/src/app/core/servicios/firebase-auth.ts
frontend-angular/src/app/core/servicios/autenticacion.ts
frontend-angular/src/app/core/componentes/email-verification-banner/
backend-laravel/app/Services/Auth/AutenticacionService.php
```

Legacy/custom endpoints still exist:

```text
POST /api/v1/auth/enviar-verificacion
POST /api/v1/auth/confirmar-verificar
```

These are for custom-domain future use or backend compatibility. The current
frontend does not call `/auth/enviar-verificacion`.

## 8. Password recovery flow now

1. User enters email on `/recuperar-clave`.
2. Angular calls Firebase `sendPasswordResetEmail`.
3. Firebase sends the reset email.
4. The reset URL is configured to return to `/login?reset=firebase`.
5. Firebase handles the actual password reset in its official action handler.
6. The user signs in with the new Firebase password.
7. Laravel accepts the fresh Firebase ID token and issues the DAEMON session.

The Angular `/restablecer-clave` page remains compatible with:

- old DAEMON backend tokens: `?token=...`
- Firebase `oobCode`: `?oobCode=...`

But the active free/working path is Firebase reset delivery.

Files:

```text
frontend-angular/src/app/features/autenticacion/pages/recuperar-clave/
frontend-angular/src/app/features/autenticacion/pages/restablecer-clave/
frontend-angular/src/app/core/servicios/firebase-auth.ts
frontend-angular/src/app/core/servicios/autenticacion.ts
```

## 9. Google login

- Student Google registration uses `loginGoogleFirebase(true)`.
- Teacher Google login uses `loginGoogleFirebase()` and then checks teacher role.
- Google accounts are treated as verified because Google is the identity
  provider.
- Profile completion is separate and goes through `/bienvenida` with
  `PATCH /api/v1/auth/me/perfil`.

## 10. Supabase PostgreSQL

The database was moved to Supabase PostgreSQL to avoid needing a local DB
server during development and to support cloud/mobile app access later.

Important state:

- PostgreSQL is canonical for business data.
- `usuarios` stores DAEMON users and links to Firebase through `firebase_uid`.
- Schema was hardened with indices and foreign keys.
- Legacy invalid ids were handled with `legacy_*` preservation where needed.
- `tutores_alumnos` stores verified guardian/student links.
- `limites_pantalla` stores guardian-configured daily limits and quiet hours.
- `uso_pantalla_diario` stores only per-day aggregate usage and is retained for
  45 days by default.
- `membresias_familiares` stores provider-neutral membership state without card
  numbers, CVCs or bank credentials.

Read `docs/supabase-postgres.md` before changing DB migration/import/storage
logic.

## 11. Supabase Storage and assets

Storage decision:

- Business uploads go to Supabase Storage bucket `daemon-assets`.
- Static frontend assets stay in Firebase Hosting.

Business upload examples:

```text
uploads/perfiles
uploads/bots
uploads/tienda/premios
uploads/insignias
uploads/entregas
uploads/cuentos
```

Frontend/static examples:

```text
img/
galeria/
audio/
rive/
legacy/
docs/
```

Do not upload source code or static app assets to Supabase Storage.

The `Activos` Angular service normalizes asset URLs. `img/bot_default.png` is
mapped to `img/bot_default.svg`.

## 12. Cloud/deploy state

Firebase Hosting:

```text
Project: daemon-a41f8
Target: estudiante
Site: daemonestudiante
Public dir: frontend-angular/dist/frontend-angular/browser
```

`firebase.json` intentionally sets no-store cache headers so old Angular
bundles do not stick during rapid iteration.

Firebase Hosting release retention was reduced to `5`; it had been effectively
infinite and blocked deploys with storage quota errors.

GitHub:

```text
Remote: WILLIAMMDN/daemon
Branch: main
```

The student redesign was merged through PR 2 at commit `c611bc8` and deployed
by the Firebase merge workflow. The verified production main bundle for that
release was `main-COHOQPBW.js`.

Render:

```text
Backend health: https://daemon-5vo1.onrender.com/api/v1/salud
```

## 13. Important fixes already done

- Migrated Laravel DB target to Supabase PostgreSQL.
- Added Supabase Storage organization for uploads.
- Fixed asset URL resolution so images/badges/avatars load from correct places.
- Connected Firebase Auth for Google and email/password.
- Added two-step registration with `/bienvenida` for incomplete profiles.
- Hardened auth, request validation, file upload allowlists, security headers,
  cookie token middleware, and role middleware.
- Added Firebase Hosting and GitHub Actions deployment setup.
- Set Firebase Hosting cache headers to no-store.
- Reduced Firebase Hosting retained releases to avoid quota blockage.
- Removed the pink teddy fallback image from login and replaced it with a
  DAEMON `D` medallion.
- Tried custom DAEMON email verification/recovery through Laravel/Resend.
- Found Resend testing restriction and changed active frontend flow back to
  Firebase email delivery for real students.
- Added permanent `experiencia` and kept `tokens` as spendable DAEMONS.
- Centralized dual academic rewards and level calculation in
  `GamificacionService`.
- Changed public, student and teacher rankings to use XP.
- Added feature tests proving that a redemption preserves XP.
- Rebuilt student header, dashboard, profile, missions, ranking, store and
  redemptions with a solid, consistent visual system.
- Preserved the existing sidebar and its onboarding IDs.
- Added responsive visual QA at desktop and mobile breakpoints.
- Added a safe fallback for missing reward images.
- Made Firebase merge deploy run Jest, Angular build and production smoke.

## 14. Known warnings and non-blockers

`npm run build` keeps the initial bundle below the configured 1 MB warning
budget. Heavy NG-ZORRO table, upload and modal styles are loaded with the lazy
student or teacher layout instead of the public shell. Global Sass partials use
`@use`, so a clean build should not emit the former deprecation warning.

## 15. Verification checklist

Run before finalizing code changes:

```powershell
cd C:\laragon\www\daemon\frontend-angular
npm run build

cd C:\laragon\www\daemon\backend-laravel
php artisan test

cd C:\laragon\www\daemon
git status --short --branch
```

Useful production checks:

```powershell
cd C:\laragon\www\daemon
.\scripts\smoke-produccion.ps1
```

For visual QA and deployed-bundle parity, follow `docs/qa-produccion.md`.

Expected current production frontend state:

- Deployed bundles contain `verificacion=firebase` and `reset=firebase`.
- Does not call `/auth/recuperar` from the recovery page.
- Does not call `/auth/enviar-verificacion` from the verification banner.

## 16. Things not to do

- Do not move the business DB to Firebase.
- Do not re-enable Resend as active student email delivery unless the user has
  verified a sending domain and configured `MAIL_FROM_ADDRESS` from that domain.
- Do not store service account JSON or `.env` files in git.
- Do not upload frontend assets or source code to Supabase Storage.
- Do not overwrite user data or run destructive DB migrations without explicit
  approval and a backup/dry-run.

## 17. If asked to make the system more professional

Prioritize:

1. Keeping Laravel as API and data authority.
2. Keeping Firebase as identity/email provider while the project has no custom
   email domain.
3. Improving validation, tests, observability, and deployment safety.
4. Reducing bundle size only after functional flows are stable.
5. Buying/verifying a domain later if branded transactional emails become a
   product requirement.
6. Following the solid student visual system instead of adding a new theme per
   module.
