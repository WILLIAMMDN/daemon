#!/usr/bin/env node
// inject-release-stamp.mjs
//
// Inyecta el SHA del commit actual en src/index.html y deja el bundle
// firmado con la misma fuente de verdad que el backend (commit en
// /api/v1/salud). Asi el smoke de produccion puede validar que Firebase
// sirve exactamente el bundle que se acaba de pushear.
//
// - Se ejecuta como prebuild antes de `ng build`.
// - Si git no esta disponible (CI sin repo, sandbox), usa 'development'
//   y deja una nota visible en consola. NUNCA falla el build.
// - Tambien inyecta el build time en formato ISO 8601 para auditoria.
//
// Uso:  node scripts/inject-release-stamp.mjs
// Salida: src/index.html reescrito en sitio con el SHA real.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(__dirname, '..', 'src', 'index.html');

const PLACEHOLDER_SHA = '__DAEMON_RELEASE_SHA__';
const PLACEHOLDER_TIME = '__DAEMON_BUILD_TIME__';

function detectSha() {
    try {
        const out = execFileSync('git', ['rev-parse', 'HEAD'], {
            cwd: resolve(__dirname, '..', '..'),
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        });
        return out.trim();
    } catch (err) {
        console.warn('[release-stamp] git rev-parse fallo, usando fallback:', err.message);
        return 'development';
    }
}

function detectShortSha(sha) {
    if (sha === 'development') return 'dev';
    return sha.slice(0, 7);
}

const sha = detectSha();
const shortSha = detectShortSha(sha);
const buildTime = new Date().toISOString();
const isDev = sha === 'development';

let html;
try {
    html = readFileSync(indexPath, 'utf8');
} catch (err) {
    console.error('[release-stamp] no se pudo leer', indexPath, '-', err.message);
    // No fallamos el build: si no hay index.html es un problema del
    // proyecto, no de este script.
    process.exit(0);
}

if (!html.includes(PLACEHOLDER_SHA) && !html.includes(PLACEHOLDER_TIME)) {
    console.warn(`[release-stamp] placeholder no encontrado en index.html; nada que inyectar.`);
    process.exit(0);
}

const next = html
    .replaceAll(PLACEHOLDER_SHA, sha)
    .replaceAll(PLACEHOLDER_TIME, buildTime);

if (next === html) {
    console.warn('[release-stamp] el archivo no cambio (placeholder ya resuelto?).');
    process.exit(0);
}

writeFileSync(indexPath, next, 'utf8');

const tag = isDev ? 'dev' : shortSha;
console.log(`[release-stamp] index.html firmado: ${tag} @ ${buildTime}`);
