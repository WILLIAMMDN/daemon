import type { DaemonEnvironment } from './environment.model';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

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
    if (!LOOPBACK_HOSTS.has(api.hostname) || !LOOPBACK_HOSTS.has(storage.hostname)) {
      throw new Error('Configuracion bloqueada: desarrollo solo puede usar API y Storage locales.');
    }

    if (
      !environment.firebase.projectId.startsWith('demo-') ||
      !environment.firebaseEmulators.enabled
    ) {
      throw new Error('Configuracion bloqueada: desarrollo debe usar Firebase Emulator Suite.');
    }
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
