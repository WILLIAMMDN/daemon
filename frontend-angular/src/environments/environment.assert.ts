import type { DaemonEnvironment } from './environment.model';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const PRODUCCION_API_HOST = 'daemon-5vo1.onrender.com';
const PRODUCCION_FIREBASE_PROJECT = 'daemon-a41f8';

export function assertEnvironmentContract(environment: DaemonEnvironment): void {
  const api = new URL(environment.apiUrl);
  const storage = new URL(environment.supabase.url);

  if (environment.production !== (environment.environmentName === 'production')) {
    throw new Error('Configuracion bloqueada: environmentName y production no coinciden.');
  }

  if (environment.storage.environment !== environment.environmentName) {
    throw new Error('Configuracion bloqueada: Storage pertenece a otro entorno.');
  }

  if (environment.environmentName === 'development') {
    const apiEsLoopback = LOOPBACK_HOSTS.has(api.hostname);
    const storageEsLoopback = LOOPBACK_HOSTS.has(storage.hostname);
    const apiEsProduccion = api.hostname === PRODUCCION_API_HOST;
    const firebaseEsProduccion =
      environment.firebase.projectId === PRODUCCION_FIREBASE_PROJECT;

    if (apiEsLoopback || storageEsLoopback) {
      // Modo local: ambos deben ser loopback y Firebase demo con emulador.
      if (!apiEsLoopback || !storageEsLoopback) {
        throw new Error(
          'Configuracion bloqueada: desarrollo local no puede mezclar API y Storage locales con remotos.',
        );
      }
      if (
        !environment.firebase.projectId.startsWith('demo-') ||
        !environment.firebaseEmulators.enabled
      ) {
        throw new Error(
          'Configuracion bloqueada: desarrollo local debe usar Firebase Emulator Suite.',
        );
      }
      return;
    }

    // Modo conectado a produccion (decision del propietario, 2026-08-06):
    // API, Storage, assets y Firebase deben apuntar todos a produccion.
    if (!apiEsProduccion) {
      throw new Error(
        'Configuracion bloqueada: desarrollo remoto solo puede usar la API de produccion.',
      );
    }
    if (!storage.hostname.endsWith('supabase.co')) {
      throw new Error(
        'Configuracion bloqueada: desarrollo remoto debe usar Supabase de produccion.',
      );
    }
    if (!firebaseEsProduccion || environment.firebaseEmulators.enabled) {
      throw new Error(
        'Configuracion bloqueada: development conectado a produccion debe usar Firebase real y sin emuladores.',
      );
    }
    return;
  }

  if (environment.environmentName === 'staging') {
    const serialized = JSON.stringify(environment);
    if (serialized.includes('not-configured') || serialized.includes('staging.invalid')) {
      throw new Error('Configuracion bloqueada: staging no fue generado con variables aisladas.');
    }

    if (api.protocol !== 'https:' || storage.protocol !== 'https:') {
      throw new Error('Configuracion bloqueada: staging debe usar HTTPS.');
    }
  }

  if (environment.production && environment.firebaseEmulators.enabled) {
    throw new Error('Configuracion bloqueada: produccion no puede usar emuladores Firebase.');
  }
}
