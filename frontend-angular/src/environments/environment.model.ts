export type DaemonEnvironmentName = 'development' | 'staging' | 'production';

export interface DaemonEnvironment {
  environmentName: DaemonEnvironmentName;
  environmentIndicator: {
    visible: boolean;
    label: 'LOCAL' | 'STAGING' | 'PRODUCTION';
  };
  production: boolean;
  apiUrl: string;
  assetBaseUrl: string;
  storage: {
    provider: 'supabase';
    environment: DaemonEnvironmentName;
  };
  observability: {
    sentryEnabled: boolean;
    sentryDsn: string;
    tracesSampleRate: number;
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  firebaseEmulators: {
    enabled: boolean;
    authHost: string;
    authPort: number;
    firestoreHost: string;
    firestorePort: number;
  };
  pusher: {
    enabled: boolean;
    key: string;
    cluster: string;
  };
  supabase: {
    url: string;
    bucket: string;
    uploadsPath: string;
    anonKey: string;
  };
}
