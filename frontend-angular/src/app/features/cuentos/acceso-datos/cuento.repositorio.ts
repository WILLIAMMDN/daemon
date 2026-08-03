import { InjectionToken } from '@angular/core';
import { ComentarioCuento } from '../dominio/comentario-cuento.modelo';
import {
  AudienciaCuento,
  Cuento,
  CuentoDetalle,
  DatosBorradorCuento,
  IdentidadBorradorCuento,
} from '../dominio/cuento.modelo';

export interface CursorCuentos {
  readonly valor: unknown;
}

export interface PaginaResultados<T> {
  readonly elementos: readonly T[];
  readonly siguienteCursor: CursorCuentos | null;
}

export abstract class CuentoRepositorio {
  abstract reservarIdentidad(): IdentidadBorradorCuento;
  abstract crearBorrador(datos: DatosBorradorCuento, audiencia: AudienciaCuento): Promise<CuentoDetalle>;
  abstract actualizarBorrador(datos: DatosBorradorCuento): Promise<CuentoDetalle>;
  abstract obtenerDetalle(cuentoId: string): Promise<CuentoDetalle>;
  abstract listarGaleria(cursor?: CursorCuentos, limite?: number): Promise<PaginaResultados<Cuento>>;
  abstract listarPropios(limite?: number): Promise<readonly Cuento[]>;
  abstract listarComentarios(cuentoId: string, cursor?: CursorCuentos, limite?: number): Promise<PaginaResultados<ComentarioCuento>>;
}

export const CUENTO_REPOSITORIO = new InjectionToken<CuentoRepositorio>('CUENTO_REPOSITORIO');
