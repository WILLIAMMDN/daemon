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
  /**
   * Almacenamiento de imágenes. Las portadas e ilustraciones de los
   * cuentos se suben al bucket público `daemon-assets` y la URL relativa
   * resultante (prefijo `uploads/`) se persiste en Firestore.
   */
  supabase: {
    url: 'https://lbxdcvsrmkkynttgwblc.supabase.co',
    bucket: 'daemon-assets',
    /** Prefijo dentro del bucket. Coincide con la convención del backend Laravel. */
    uploadsPath: 'uploads',
    /** Anon key (Project API keys → `anon` `public`). NUNCA la `service_role`. */
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxieGRjdnNybWtreW50dGd3YmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTQ0MTQsImV4cCI6MjA5ODE3MDQxNH0.457VHljBnyK-0sUXFni7fG_y_BczZUBgOL7Dtu3NVZU',
  },
};
