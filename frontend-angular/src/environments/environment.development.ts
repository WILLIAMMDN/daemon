import type { DaemonEnvironment } from './environment.model';

// ============================================================
// ENTORNO DE DESARROLLO — CONECTADO A PRODUCCIÓN
// ------------------------------------------------------------
// Decisión del propietario (2026-08-06): el frontend de desarrollo
// (ng serve) se conecta directamente a los servicios productivos:
//   - API:      https://daemon-5vo1.onrender.com/api/v1
//   - Firebase: proyecto real daemon-a41f8 (Auth)
//   - Storage:  Supabase real (bucket daemon-assets)
// Esto permite probar credenciales y flujos reales sin levantar
// backend local ni Firebase Emulator Suite.
//
// NOTA DE SEGURIDAD: las operaciones de escritura desde este entorno
// se ejecutan contra la base de datos de PRODUCCIÓN. No uses este
// entorno para pruebas destructivas ni para crear datos de prueba.
// ============================================================
export const environment = {
  environmentName: 'development',
  environmentIndicator: {
    visible: true,
    label: 'LOCAL',
  },
  production: false,
  apiUrl: 'https://daemon-5vo1.onrender.com/api/v1',
  assetBaseUrl: 'https://lbxdcvsrmkkynttgwblc.supabase.co/storage/v1/object/public/daemon-assets',
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
    apiKey: 'AIzaSyCarHu8PP3LR7mcNHLk_FTN2rhfnUf4FD4',
    authDomain: 'daemon-a41f8.firebaseapp.com',
    projectId: 'daemon-a41f8',
    storageBucket: 'daemon-a41f8.firebasestorage.app',
    messagingSenderId: '516236234992',
    appId: '1:516236234992:web:7811801e0441ee2d46f235',
  },
  firebaseEmulators: {
    enabled: false,
    authHost: '',
    authPort: 0,
    firestoreHost: '',
    firestorePort: 0,
  },
  pusher: {
    // Desactivado: igual que en producción (el auth del canal requiere
    // sesión web de Laravel). Las notificaciones en tiempo real se
    // reactivarán cuando exista un canal autorizado para el frontend.
    enabled: false,
    key: '921d28612ceab3864425',
    cluster: 'sa1',
  },
  supabase: {
    url: 'https://lbxdcvsrmkkynttgwblc.supabase.co',
    bucket: 'daemon-assets',
    uploadsPath: 'uploads',
    // Clave anon publica del cliente web. Nunca usar `service_role` aqui.
    anonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxieGRjdnNybWtreW50dGd3YmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTQ0MTQsImV4cCI6MjA5ODE3MDQxNH0.457VHljBnyK-0sUXFni7fG_y_BczZUBgOL7Dtu3NVZU',
  },
} satisfies DaemonEnvironment;
