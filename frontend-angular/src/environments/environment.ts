export const environment = {
  production: true,
  apiUrl: 'https://daemon-5vo1.onrender.com/api/v1',
  assetBaseUrl: 'https://lbxdcvsrmkkynttgwblc.supabase.co/storage/v1/object/public/daemon-assets',
  observability: {
    sentryEnabled: true,
    sentryDsn: 'https://c45a6c36565ea37cf1f0835bb077093a@o4511730124062720.ingest.us.sentry.io/4511730143461376',
    tracesSampleRate: 0.05,
  },
  firebase: {
    apiKey: 'AIzaSyCarHu8PP3LR7mcNHLk_FTN2rhfnUf4FD4',
    authDomain: 'daemon-a41f8.firebaseapp.com',
    projectId: 'daemon-a41f8',
    storageBucket: 'daemon-a41f8.firebasestorage.app',
    messagingSenderId: '516236234992',
    appId: '1:516236234992:web:7811801e0441ee2d46f235',
  },
  pusher: {
    key: '921d28612ceab3864425',
    cluster: 'sa1',
  },
};
