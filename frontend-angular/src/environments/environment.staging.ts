// Este archivo seguro permite validar la configuracion de Angular. El workflow
// de staging lo reemplaza en el runner con valores de un entorno aislado.
export const environment = {
  production: false,
  apiUrl: 'https://staging.invalid/api/v1',
  assetBaseUrl: 'https://staging.invalid/assets',
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
  pusher: {
    key: 'staging-not-configured',
    cluster: 'staging-not-configured',
  },
};
