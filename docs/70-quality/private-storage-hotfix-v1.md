---
title: Production student content and private storage hotfix V1
status: active
owner: security
last_reviewed: 2026-09-03
applies_to: production hotfix review
---

# Production student content and private storage hotfix V1

Base verified after fetching origin: `4af07fca2fd8e14c17c0458a22f5babdceebe7d7`.
This report records verification and the proposed change; it does not authorize a merge.

## Render configuration and storage

The authenticated Render dashboard identifies the live backend commit as the same base.
The key, secret and endpoint were checked individually for nonempty values and immediately
hidden again. No credential values were printed or saved in this report.

| Check | Result |
| --- | --- |
| Private storage key | PRESENT |
| Private storage secret | PRESENT |
| Private storage endpoint | PRESENT |
| APP_ENV / DAEMON_ENVIRONMENT | production / production |
| Private disk/bucket overrides, secret files, linked environment groups | None |
| Resolved disk / bucket | supabase_private / daemon-private |
| Bucket visibility, queried read-only from storage.buckets | private (`public=false`) |
| Silent local fallback | Removed in this PR |
| Production missing/invalid storage config | Controlled HTTP 503, no file or artifact metadata write |
| Provider write false/exception | Controlled HTTP 503, no local fallback, no provider exception in logs |
| Explicit local/test disk | Preserved outside production/Render |

The resolved disk is established from the dashboard configuration and deployed source
defaults, not a running PHP shell probe: Render Free explicitly denies Shell/SSH.
The production artifact table was empty during the read-only audit; there are no existing
artifact rows with which to independently corroborate a runtime disk selection.

A synthetic PDF was written to a unique `acceptance/private-storage-hotfix-v1/` key,
read back with SHA-256 equality and checked against its object metadata. Anonymous
access through the public-object API returned HTTP 400. The synthetic object was then
deleted and its absence verified. This proves provider persistence/privacy, not a live
application upload or business-metadata acceptance. The latter remains a post-review gate.

## Inventory and preservation

The [per-file inventory](public-content-hotfix-v1.json) lists all 174 removed paths,
sizes, hashes, reference fields and dispositions. No uploaded file bytes remain as test
fixtures. The initial targets contained 152 uploads and 21 gallery files; a hash scan
found one additional copy under `img/premios`.

Reference inspection covered frontend source, backend source, legacy code and the two
SQL dumps, followed by a production PostgreSQL transaction explicitly set READ ONLY
(291 text/JSON columns). A read-only Firestore scan covered all 41 `cuentos`, 29
`versiones` and 46 `paginas` documents returned by the bounded collection queries.
Only matching known filenames and counts were retained; no document bodies or user
profiles were exported. No business rows, schema, roles or permissions were changed.

| Category | Files | User supplied/imported | Academic content | Live references | Public before | Preserve bytes | Safe to remove from Angular |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| uploads/tareas | 1 | Yes, obsolete upload fixture | Homework path; commercial image, no visible student data | No | Yes, confirmed on both hosts | No homework record; prize copy preserved | Yes |
| uploads/avatars | 48 | Yes | No | 20 PostgreSQL; 12 also Firestore | Yes | 20 canonical copies | Yes, after verification |
| uploads/fondos | 38 | Yes | No | 4 PostgreSQL | Yes | 4 canonical copies | Yes, after verification |
| uploads/heroes | 15 | Yes | No | 2 PostgreSQL | Yes | 2 canonical copies | Yes, after verification |
| uploads/assets | 14 | Historical uploads | No identified homework | No | Yes | No | Yes |
| uploads/cuentos | 4 | Historical creative uploads | Creative sources, no current reference | No | Yes | No | Yes |
| uploads root | 32 | Historical imported/uploaded images | 10 legacy story source images | 10 PostgreSQL; none Firestore | Yes | 10 private recovery copies | Yes, after preservation |
| galeria | 21 | Historical stock/generated imagery | No identified student work | No | Yes | No | Yes |
| img/premios duplicate | 1 | Product prize imagery | Same bytes as obsolete homework fixture | Canonical prize in Supabase | Yes | Canonical prize copy | Yes, after verification |

The homework file is `uploads/tareas/tarea_7_24_1769779763.png`. Its hash is identical
to the commercial candy assortment image `img/premios/premio_697cad1bea665.png`.
It must not be described as confirmed sensitive student work merely because of its name.
Both Angular copies were removed. The current prize points to
`uploads/tienda/premios/2/premio_697cad1bea665.png` in `daemon-assets`; that existing,
intentional product image remains available and was verified byte-for-byte.

All 26 referenced profile images already use canonical `uploads/perfiles/...` paths in
PostgreSQL. Their existing `daemon-assets` objects were downloaded for checksum verification
in memory and matched the removed copies. No avatar publication policy was changed.

The ten legacy story images were still referenced by PostgreSQL through obsolete LAN
URLs and had no matching Storage objects. Their publication/visibility state cannot be
established from that legacy table, so no replacement public URLs were created. Before
removal, the ten originals were copied to private `daemon-private/recovery/firebase-hosting/4af07fca/`
keys and read back with identical SHA-256 hashes. A private `manifest.json` in that prefix
preserves story IDs, owner IDs, source fields and old URLs. PostgreSQL remains the ownership
authority. All ten objects and the manifest rejected anonymous public access (HTTP 400).
These are operator recovery copies, not newly attached Learning Core evidence; old story
URLs were not rewritten and no fictitious attempts/enrollments were introduced. Restoring
those obsolete legacy links to application use needs a separate, authorized decision.

Gallery filenames indicate downloaded stock and generated images, including
`_102469653_gettyimages-962792890.jpg.JPG`. Inspection established no product reference
or licensing record; the Getty-named image did not show a clearly visible watermark in
the reviewed rendering. The 21 unused files were removed without asserting a full
copyright determination or adding replacement art.

### Hash-duplicate classification

Nineteen files remaining in the production build shared SHA-256 hashes with removed uploads/gallery content. Comprehensive database and repository reference scans classified all 19:
- 1 file (`img/insignias/insignia.png`) is a canonical product asset (the "Arquitecto/Arquitecta" course badge) actively referenced in the database (`usuarios.insignia` for student 41) and Playwright auth fixtures; it is intentionally public and kept.
- 18 files were historical test artifacts, bot/avatar duplicates whose canonical versions already reside in Supabase Storage (`daemon-assets`), or unused prototype graphics (`img/hombre.gif`, `img/mujer.gif`, etc.). All 18 were removed from public assets, reducing static build size by 7.6 MB.

## Application and build changes

`ArtefactoAprendizajeService` now requires a complete S3 private-disk configuration;
production also requires `daemon-private` and HTTPS. It emits only a fixed operational
error and a fixed reason code. Local storage requires an explicit local/testing choice.
File streams close on failed writes and metadata is created only after a successful write.

Artifact downloads also deny teachers with no assigned classroom, which previously
allowed the absence of scope to become broader access. Existing owner, classroom and
institution checks remain. Teacher review semantics, Course Studio, Learning Core,
sessions, Arena, Mastery, Portfolio and UI source were not changed.

The public-asset guard runs before and after the production build and in frontend CI.
It rejects files under `uploads`/`galeria`, symlinks and any renamed copy of the identified
homework fixture by hash. Its negative tests use synthetic bytes only. This is a packaging
guard, not a general image-content classifier.

| Measurement | Before | After |
| --- | ---: | ---: |
| Production browser directory | 297,485,188 bytes (297.5 MB / 283.7 MiB) | 118,761,524 bytes (118.8 MB / 113.3 MiB) |
| Production browser files | 668 | 476 |
| Initial JS/CSS bundle | 1.49 MB | 1.49 MB |
| Identified homework bytes in public source/build | Present | None |
| Unintentional user duplicates in public build | Present | 18 removed; 1 canonical kept (`img/insignias/insignia.png`) |

The baseline build was measured in this checkout before removing assets. Existing
warnings (initial budget, panel stylesheet budget, Sass imports and Angular template
diagnostics) remain; no initial-bundle growth was introduced.

## Verification

| Area | Result |
| --- | --- |
| Full backend suite | 252 passed; targeted final artifact suite 9 passed / 139 assertions |
| Production config failure, local/test, failed provider write | PASS |
| Owner Student / authorized Teacher | PASS for PNG and PDF |
| Other Student / unrelated Teacher / anonymous | DENIED |
| Same-institution different-classroom Teacher / Teacher without classroom | DENIED |
| Learning Core / student revisions / Teacher Feedback | PASS in full backend suite |
| Full frontend suite | 187 tests, 32 suites passed |
| Public-asset regressions | 3 passed, including renamed-copy detection |
| Environment regressions | 9 passed |
| Architecture / style tokens / student visual | PASS |
| Production build and final asset-tree scan | PASS |
| Real provider write/read/metadata and anonymous denial | PASS; synthetic object cleaned up |
| Live application upload/business metadata | NOT RUN, pending reviewed deployment |
| Public URL retirement in production | Pending deployment; baseline is HTTP 200 image/png on both sites |
| Remote CI | See PR checks; local results above are not a substitute for remote CI |

A later pre-merge probe returned HTTP 404 for both retired paths on `daemonestudiante`,
while both paths on `daemonarc` still returned HTTP 200 image/png. Ordinary and explicitly
revalidated requests agreed. No deployment was performed by this task between probes,
and `origin/main` was rechecked at the same canonical commit. The initial exposure and
later remote responses are separate observations, not evidence of a completed rollout.

## Deployment and owner review

**Do not merge automatically.** The observed Render dashboard setting is **On Commit**,
not the `checksPass` value declared in `render.yaml`. No Render setting was changed.
A merge can therefore deploy the backend immediately. Firebase's main workflow also
deploys automatically. This PR updates that workflow to deploy both `arc` and `estudiante`:
updating only `arc` would leave the old student's public artifact URL exposed.

No PR merge or application deployment was performed. The only production writes made
for this hotfix were the ten private preservation objects, their private manifest and
the short-lived synthetic provider probe; no migration or business-data mutation ran.

After owner review and the resulting deployment:

1. Confirm Render serves the reviewed commit and its effective private configuration.
2. Confirm Firebase deployed **both** hosting targets from the scanned artifact.
3. Run `node scripts/verify-retired-public-assets.mjs`. The merge workflow runs it too.
   It checks ordinary and cache-revalidated requests, rejects image/PDF responses and accepts denied/missing responses or a 200 HTML SPA
   rewrite. Check both the homework URL and its retired Angular prize duplicate.
4. With an approved synthetic Student enrollment, upload a synthetic PNG/PDF through the
   real artifact API. Confirm the business row has `disk=supabase_private`, owner and
   attempt IDs; inspect the matching `daemon-private` object. Verify owner/authorized
   Teacher access and denial for another Student, unrelated Teacher and anonymous access.
   Do not use real student data or silently treat the provider probe as this acceptance.
5. If anything fails, keep the release marked incomplete and investigate before reopening
   artifact uploads. Preserve private recovery objects and their manifest.

Rollback must not restore the old public uploads or the silent local fallback. Prefer a
scoped forward fix; if reverting unrelated frontend behavior is necessary, rebuild the
older code with the retired paths removed and this privacy gate applied. The verified
private recovery copies remain available to an authorized operator independently of a
frontend rollback.
