import { writeFile } from 'node:fs/promises';

const required = [
  'STAGING_API_URL',
  'STAGING_ASSET_BASE_URL',
  'STAGING_FIREBASE_CONFIG_JSON',
  'STAGING_PUSHER_KEY',
  'STAGING_PUSHER_CLUSTER',
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  throw new Error(`Faltan variables de staging: ${missing.join(', ')}`);
}

let firebase;
try {
  firebase = JSON.parse(process.env.STAGING_FIREBASE_CONFIG_JSON);
} catch {
  throw new Error('STAGING_FIREBASE_CONFIG_JSON no contiene JSON valido.');
}

const firebaseFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFirebase = firebaseFields.filter((name) => !String(firebase[name] ?? '').trim());
if (missingFirebase.length) {
  throw new Error(`Firebase staging incompleto: ${missingFirebase.join(', ')}`);
}

const candidate = JSON.stringify({
  apiUrl: process.env.STAGING_API_URL,
  assetBaseUrl: process.env.STAGING_ASSET_BASE_URL,
  pusherKey: process.env.STAGING_PUSHER_KEY,
  firebase,
});
const productionMarkers = [
  'daemon-5vo1.onrender.com',
  'daemon-a41f8',
  'lbxdcvsrmkkynttgwblc',
  '921d28612ceab3864425',
];
const mixedProduction = productionMarkers.find((marker) => candidate.includes(marker));
if (mixedProduction) {
  throw new Error(`Staging intenta reutilizar un recurso de produccion (${mixedProduction}).`);
}

for (const variable of ['STAGING_API_URL', 'STAGING_ASSET_BASE_URL']) {
  const url = new URL(process.env[variable]);
  if (url.protocol !== 'https:') {
    throw new Error(`${variable} debe usar HTTPS.`);
  }
}

const environment = {
  production: false,
  apiUrl: process.env.STAGING_API_URL.replace(/\/$/, ''),
  assetBaseUrl: process.env.STAGING_ASSET_BASE_URL.replace(/\/$/, ''),
  observability: {
    sentryEnabled: Boolean(process.env.STAGING_SENTRY_DSN),
    sentryDsn: process.env.STAGING_SENTRY_DSN ?? '',
    tracesSampleRate: process.env.STAGING_SENTRY_DSN ? 0.05 : 0,
  },
  firebase,
  pusher: {
    key: process.env.STAGING_PUSHER_KEY,
    cluster: process.env.STAGING_PUSHER_CLUSTER,
  },
};

await writeFile(
  new URL('../src/environments/environment.staging.ts', import.meta.url),
  `// Generado por scripts/generate-staging-environment.mjs\nexport const environment = ${JSON.stringify(environment, null, 2)};\n`,
  'utf8',
);
