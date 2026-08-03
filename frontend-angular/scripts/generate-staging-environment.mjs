import { writeFile } from 'node:fs/promises';

const required = [
  'STAGING_API_URL',
  'STAGING_ASSET_BASE_URL',
  'STAGING_FIREBASE_PROJECT_ID',
  'STAGING_FIREBASE_CONFIG_JSON',
  'STAGING_PUSHER_KEY',
  'STAGING_PUSHER_CLUSTER',
  'STAGING_SUPABASE_URL',
  'STAGING_SUPABASE_BUCKET',
  'STAGING_SUPABASE_ANON_KEY',
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

const firebaseFields = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];
const missingFirebase = firebaseFields.filter((name) => !String(firebase[name] ?? '').trim());
if (missingFirebase.length) {
  throw new Error(`Firebase staging incompleto: ${missingFirebase.join(', ')}`);
}

if (firebase.projectId !== process.env.STAGING_FIREBASE_PROJECT_ID) {
  throw new Error('STAGING_FIREBASE_CONFIG_JSON no coincide con STAGING_FIREBASE_PROJECT_ID.');
}

const candidate = JSON.stringify({
  apiUrl: process.env.STAGING_API_URL,
  assetBaseUrl: process.env.STAGING_ASSET_BASE_URL,
  pusherKey: process.env.STAGING_PUSHER_KEY,
  supabaseUrl: process.env.STAGING_SUPABASE_URL,
  supabaseBucket: process.env.STAGING_SUPABASE_BUCKET,
  firebase,
});
const productionMarkers = [
  'daemon-5vo1.onrender.com',
  'daemon-a41f8',
  'daemonestudiante.web.app',
  'lbxdcvsrmkkynttgwblc',
  '921d28612ceab3864425',
];
const mixedProduction = productionMarkers.find((marker) => candidate.includes(marker));
if (mixedProduction) {
  throw new Error(`Staging intenta reutilizar un recurso de produccion (${mixedProduction}).`);
}

for (const variable of ['STAGING_API_URL', 'STAGING_ASSET_BASE_URL', 'STAGING_SUPABASE_URL']) {
  const url = new URL(process.env[variable]);
  if (url.protocol !== 'https:') {
    throw new Error(`${variable} debe usar HTTPS.`);
  }
}

if (!new URL(process.env.STAGING_API_URL).pathname.replace(/\/$/, '').endsWith('/api/v1')) {
  throw new Error('STAGING_API_URL debe terminar en /api/v1.');
}

if (!process.env.STAGING_SUPABASE_BUCKET.endsWith('-staging')) {
  throw new Error('STAGING_SUPABASE_BUCKET debe terminar en -staging.');
}

const environment = {
  environmentName: 'staging',
  environmentIndicator: { visible: true, label: 'STAGING' },
  production: false,
  apiUrl: process.env.STAGING_API_URL.replace(/\/$/, ''),
  assetBaseUrl: process.env.STAGING_ASSET_BASE_URL.replace(/\/$/, ''),
  storage: { provider: 'supabase', environment: 'staging' },
  observability: {
    sentryEnabled: Boolean(process.env.STAGING_SENTRY_DSN),
    sentryDsn: process.env.STAGING_SENTRY_DSN ?? '',
    tracesSampleRate: process.env.STAGING_SENTRY_DSN ? 0.05 : 0,
  },
  firebase,
  firebaseEmulators: {
    enabled: false,
    authHost: '',
    authPort: 0,
    firestoreHost: '',
    firestorePort: 0,
  },
  pusher: {
    enabled: true,
    key: process.env.STAGING_PUSHER_KEY,
    cluster: process.env.STAGING_PUSHER_CLUSTER,
  },
  supabase: {
    url: process.env.STAGING_SUPABASE_URL.replace(/\/$/, ''),
    bucket: process.env.STAGING_SUPABASE_BUCKET,
    uploadsPath: 'uploads',
    anonKey: process.env.STAGING_SUPABASE_ANON_KEY,
  },
};

await writeFile(
  new URL('../src/environments/environment.staging.ts', import.meta.url),
  `// Generado por scripts/generate-staging-environment.mjs\nimport type { DaemonEnvironment } from './environment.model';\n\nexport const environment = ${JSON.stringify(environment, null, 2)} satisfies DaemonEnvironment;\n`,
  'utf8',
);
