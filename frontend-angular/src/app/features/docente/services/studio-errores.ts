import { ApiError } from '../../../core/servicios/api';

export interface ErrorStudio {
  readonly tipo: 'autorizacion' | 'conflicto' | 'validacion' | 'api';
  readonly mensaje: string;
}

/**
 * Traduce un fallo HTTP al estado de página correspondiente.
 *
 * No decide nada del dominio: sólo da un mensaje honesto para cada respuesta
 * que el backend ya emitió. 409 es la inmutabilidad de una versión publicada y
 * 422 es el resultado de una validación de servidor.
 */
export function clasificarError(fallo: unknown, porDefecto: string): ErrorStudio {
  const estado = (fallo as { status?: number })?.status;

  if (estado === 401 || estado === 403) {
    return {
      tipo: 'autorizacion',
      mensaje: 'No tienes permisos para operar la autoría de este curso.',
    };
  }

  if (estado === 409) {
    return {
      tipo: 'conflicto',
      mensaje: mensajeDeError(fallo, 'Una versión publicada es inmutable. Crea un borrador nuevo para cambiarla.'),
    };
  }

  if (estado === 422) {
    return { tipo: 'validacion', mensaje: mensajeDeError(fallo, 'El servidor rechazó los datos enviados.') };
  }

  return { tipo: 'api', mensaje: mensajeDeError(fallo, porDefecto) };
}

export function mensajeDeError(fallo: unknown, porDefecto: string): string {
  if (fallo instanceof ApiError) {
    return fallo.kind === 'offline'
      ? 'Sin conexión con el servidor.'
      : 'El servidor tardó demasiado en responder.';
  }

  const cuerpo = (fallo as { error?: { message?: string; errors?: Record<string, string[]> } })?.error;
  const primerCampo = cuerpo?.errors ? Object.values(cuerpo.errors)[0]?.[0] : undefined;

  return primerCampo ?? cuerpo?.message ?? porDefecto;
}
