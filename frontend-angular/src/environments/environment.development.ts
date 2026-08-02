export const environment = {
  production: false,
  // Mantener el mismo hostname que usa Angular en desarrollo. Mezclar
  // localhost con 127.0.0.1 convierte la cookie HttpOnly en cross-site y el
  // navegador descarta la sesión justo después de un login exitoso.
  apiUrl: 'http://localhost:8000/api/v1',
  assetBaseUrl: 'https://lbxdcvsrmkkynttgwblc.supabase.co/storage/v1/object/public/daemon-assets',
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
  supabase: {
    url: 'https://lbxdcvsrmkkynttgwblc.supabase.co',
    bucket: 'daemon-assets',
    uploadsPath: 'uploads',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxieGRjdnNybWtreW50dGd3YmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTQ0MTQsImV4cCI6MjA5ODE3MDQxNH0.457VHljBnyK-0sUXFni7fG_y_BczZUBgOL7Dtu3NVZU',
  },
};
