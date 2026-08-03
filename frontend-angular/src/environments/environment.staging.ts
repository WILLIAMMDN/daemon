// Plantilla segura. El workflow la reemplaza con valores del entorno aislado.
import type { DaemonEnvironment } from './environment.model';

export const environment = {
  environmentName: 'staging',
  environmentIndicator: {
    visible: true,
    label: 'STAGING',
  },
  production: false,
  apiUrl: 'https://staging.invalid/api/v1',
  assetBaseUrl: 'https://staging.invalid/assets',
  storage: {
    provider: 'supabase',
    environment: 'staging',
  },
  observability: {
    sentryEnabled: false,
    sentryDsn: '',
    tracesSampleRate: 0,
  },
  firebase: {
    apiKey: 'staging-not-configured',
    authDomain: 'staging.invalid',
    projectId: 'staging-not-configured',
    storageBucket: 'staging-not-configured',
    messagingSenderId: 'staging-not-configured',
    appId: 'staging-not-configured',
  },
  firebaseEmulators: {
    enabled: false,
    authHost: '',
    authPort: 0,
    firestoreHost: '',
    firestorePort: 0,
  },
  pusher: {
    enabled: true,
    key: 'staging-not-configured',
    cluster: 'staging-not-configured',
  },
  supabase: {
    url: 'https://staging.invalid',
    bucket: 'daemon-assets-staging',
    uploadsPath: 'uploads',
    anonKey: 'staging-not-configured',
  },
} satisfies DaemonEnvironment;
