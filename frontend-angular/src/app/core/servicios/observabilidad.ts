import { environment } from '../../../environments/environment';

/**
 * Contexto mínimo sin PII para reportar errores. Nunca incluir cuerpos de
 * cuentos, comentarios, mensajes IA, correos, tokens ni URLs firmadas.
 */
export interface ContextoError {
  readonly area: string;
  readonly operacion?: string;
  readonly codigo?: string;
  readonly recuperable?: boolean;
}

type ManejadorError = (error: unknown, contexto: ContextoError) => void;

/**
 * Este módulo NO importa Sentry a propósito: evita duplicar el SDK en el
 * bundle. `main.ts` (que ya importa Sentry estáticamente) registra aquí el
 * manejador real cuando la telemetría está habilitada.
 */
let manejador: ManejadorError | null = null;

export function registrarManejadorError(manejadorError: ManejadorError): void {
  manejador = manejadorError;
}

/**
 * Reporta un error a la telemetría solo si está habilitada en el entorno.
 * Fuera de producción es un no-op silencioso; no se registran console.log.
 */
export function reportarError(error: unknown, contexto: ContextoError): void {
  if (!environment.observability.sentryEnabled) return;
  manejador?.(error, contexto);
}
