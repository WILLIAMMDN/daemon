import { InjectionToken } from '@angular/core';

export abstract class ActivosCuentoRepositorio {
  abstract subirPortada(cuentoId: string, archivo: File | Blob): Promise<string>;
  abstract subirIlustracion(cuentoId: string, paginaId: string, archivo: File | Blob): Promise<string>;
  abstract eliminarActivo(cuentoId: string, referencia: string | null): Promise<void>;
  abstract obtenerUrlLectura(cuentoId: string, referencia: string | null): Promise<string>;
  abstract validarArchivo(archivo: File): Promise<string | null>;
  abstract limpiarActivosHuerfanos(cuentoId: string, referencias: readonly string[]): Promise<void>;
  abstract resolverUrl(referencia: string | null): string;
}

export const ACTIVOS_CUENTO_REPOSITORIO = new InjectionToken<ActivosCuentoRepositorio>(
  'ACTIVOS_CUENTO_REPOSITORIO',
);
