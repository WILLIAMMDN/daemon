import type { DaemonEnvironment } from './environment.model';

export const environment = {
  environmentName: 'development',
  environmentIndicator: {
    visible: true,
    label: 'LOCAL',
  },
  production: false,
  // Mantener el mismo hostname que usa Angular en desarrollo. Mezclar
  // localhost con 127.0.0.1 rompe la cookie HttpOnly del API local.
  apiUrl: 'http://localhost:8000/api/v1',
  assetBaseUrl: 'http://127.0.0.1:54321/storage/v1/object/public/daemon-assets-local',
  storage: {
    provider: 'supabase',
    environment: 'development',
  },
  observability: {
    sentryEnabled: false,
    sentryDsn: '',
    tracesSampleRate: 0,
  },
  firebase: {
    apiKey: 'demo-api-key',
    authDomain: 'localhost',
    projectId: 'demo-daemon-local',
    storageBucket: 'demo-daemon-local.appspot.com',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:daemon-local',
  },
  firebaseEmulators: {
    enabled: true,
    authHost: '127.0.0.1',
    authPort: 9099,
    firestoreHost: '127.0.0.1',
    firestorePort: 8080,
  },
  pusher: {
    enabled: false,
    key: '',
    cluster: '',
  },
  supabase: {
    url: 'http://127.0.0.1:54321',
    bucket: 'daemon-assets-local',
    uploadsPath: 'uploads',
    anonKey: 'local-not-configured',
  },
} satisfies DaemonEnvironment;
