#!/usr/bin/env node
/**
 * Escaneo ligero de secretos en archivos versionados (CI).
 * Bloquea solo patrones de credenciales reales. La API key de Firebase
 * (AIza...) es pública por diseño en el frontend y solo se informa.
 * Los PEM de tests/Fixtures son llaves de prueba intencionales del repo.
 */
import { execSync } from 'node:child_process';

const PATRONES_BLOQUEANTES = [
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /service_account\s*[:=]\s*['"][{]/, // JSON de service account inline
  /xox[baprs]-/, // Slack tokens
  /ghp_[0-9A-Za-z]{30,}/, // GitHub PAT
  /AKIA[0-9A-Z]{16}/, // AWS access key id
];

const PATRONES_INFORMATIVOS = [
  /AIza[0-9A-Za-z_-]{20,}/, // Firebase API key (pública por diseño en web)
];

// Fixtures intencionales: llaves PEM de prueba para los tests de verificación
// de tokens de Firebase. No son credenciales de producción.
const FIJO_FIXTURES = /^backend-laravel\/tests\/Fixtures\//;

const archivos = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
let bloqueantes = 0;
let informativos = 0;

for (const archivo of archivos) {
  if (/^(\\.freebuff|node_modules|vendor|dist|package-lock\\.json|composer\\.lock)/.test(archivo)) continue;
  let contenido;
  try {
    contenido = execSync(`git show :"${archivo}"`, { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
  } catch {
    continue;
  }
  for (const patron of PATRONES_BLOQUEANTES) {
    if (FIJO_FIXTURES.test(archivo)) continue;
    if (patron.test(contenido)) {
      console.error(`[secreto] posible credencial en ${archivo}: ${patron}`);
      bloqueantes += 1;
    }
  }
  for (const patron of PATRONES_INFORMATIVOS) {
    if (patron.test(contenido)) {
      informativos += 1;
    }
  }
}

if (informativos > 0) {
  console.log(`[info] ${informativos} referencia(s) a API keys de Firebase (públicas por diseño en el frontend).`);
}
if (bloqueantes > 0) {
  console.error(`\n[bloqueado] ${bloqueantes} hallazgo(s) de credenciales reales.`);
  process.exit(1);
}
console.log('[scan-secretos] sin credenciales reales en archivos versionados.');
