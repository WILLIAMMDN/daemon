export const environment = {
  production: false,
  // Mantener el mismo hostname que usa Angular en desarrollo. Mezclar
  // localhost con 127.0.0.1 convierte la cookie HttpOnly en cross-site y el
  // navegador descarta la sesión justo después de un login exitoso.
  apiUrl: 'http://localhost:8000/api/v1',
  assetBaseUrl: '',
  observability: {
    sentryEnabled: false,
    sentryDsn: '',
    tracesSampleRate: 0,
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
