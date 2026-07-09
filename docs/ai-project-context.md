# DAEMON AI project context

This document is written for future AI agents and developers. It summarizes the
current DAEMON system, the cloud decisions already made, the important files,
and the traps that caused confusion during the migration.

Last updated: 2026-06-29.

## 1. What DAEMON is

DAEMON is an academic platform for an AI/technology academy. It has public
pages, student portal, teacher portal, authentication, tokens, missions,
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
frontend-angular/src/app/shared/componentes/email-verification-banner/
frontend-angular/src/app/features/autenticacion/pages/login/
frontend-angular/src/app/features/autenticacion/pages/login-docente/
frontend-angular/src/app/features/autenticacion/pages/registro/
frontend-angular/src/app/features/autenticacion/pages/recuperar-clave/
frontend-angular/src/app/features/autenticacion/pages/restablecer-clave/
frontend-angular/src/app/features/autenticacion/pages/bienvenida/
```

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
backend-laravel/app/Http/Controllers/Api/V1/AutenticacionController.php
backend-laravel/app/Http/Middleware/EnsureRole.php
backend-laravel/app/Http/Middleware/AuthCookieToken.php
backend-laravel/app/Services/Archivo/ArchivoUrlService.php
backend-laravel/config/filesystems.php
backend-laravel/config/services.php
backend-laravel/config/mail.php
```

The canonical user table is `usuarios`. Do not introduce Laravel's default
`users` table as the app authority.

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
- Laravel stores roles, progress, tokens, academic data, and
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
frontend-angular/src/app/shared/componentes/email-verification-banner/
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

## 14. Known warnings and non-blockers

`npm run build` currently warns:

- Angular initial bundle exceeds 700 kB.
- `@rive-app/canvas` is CommonJS.

These are known. Do not treat them as failed build unless the build exits
non-zero.

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
