#!/usr/bin/env node
/**
 * Dry-run de migración de cuentos legacy -> v2.
 *
 * SOLO EMULADOR: se niega a ejecutarse si no detecta Firestore Emulator.
 * NO ESCRIBE NADA: lista y clasifica documentos para dimensionar la migración.
 *
 * Uso:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/migrar-cuentos-dry-run.mjs
 *   node scripts/migrar-cuentos-dry-run.mjs --emulator
 */
import process from 'node:process';

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const PROYECTO = process.env.FIREBASE_PROJECT_ID || 'demo-daemon-rules';
const BASE = `http://${EMULATOR_HOST}/v1/projects/${PROYECTO}/databases/(default)/documents/cuentos`;

async function leerPagina(pageToken = '') {
  const url = `${BASE}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`Emulador no respondió correctamente (${respuesta.status}).`);
  }
  return respuesta.json();
}

function clasificar(documento) {
  const campos = documento.fields ?? {};
  const schema = campos.schema_version?.integerValue;
  if (schema === 2) return 'v2';
  if (schema === 1) return 'legacy_v1';
  if (campos.data_1) return 'legacy_sin_schema';
  return 'no_convertible';
}

async function main() {
  const esEmulador = Boolean(process.env.FIRESTORE_EMULATOR_HOST) || process.argv.includes('--emulator');
  if (!esEmulador) {
    console.error('[bloqueado] Este script solo opera contra el emulador Firestore.');
    console.error('Uso: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/migrar-cuentos-dry-run.mjs');
    process.exit(2);
  }

  console.log(`Proyecto: ${PROYECTO} | Emulador: ${EMULATOR_HOST}`);
  const conteo = { v2: 0, legacy_v1: 0, legacy_sin_schema: 0, no_convertible: 0, total: 0 };
  const afectados = [];

  let pageToken = '';
  do {
    const datos = await leerPagina(pageToken);
    for (const documento of datos.documents ?? []) {
      conteo.total += 1;
      const clase = clasificar(documento);
      conteo[clase] += 1;
      if (clase !== 'v2') {
        const id = documento.name.split('/').pop();
        afectados.push({ id, clase });
      }
    }
    pageToken = datos.nextPageToken ?? '';
  } while (pageToken);

  console.log('=== Conteo ===');
  console.log(JSON.stringify(conteo, null, 2));
  console.log('=== Documentos legacy a migrar (dry-run, sin escribir) ===');
  console.log(JSON.stringify(afectados, null, 2));
  console.log(afectados.length === 0
    ? 'Sin documentos legacy: la migración no haría nada.'
    : 'Ejecutar la migración real solo con autorización explícita y backup previo.');
}

main().catch((error) => {
  console.error('[error]', error.message);
  process.exit(1);
});
