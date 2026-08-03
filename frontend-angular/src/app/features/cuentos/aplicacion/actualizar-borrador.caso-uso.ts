import { Injectable, inject } from '@angular/core';
import { CUENTO_REPOSITORIO } from '../acceso-datos/cuento.repositorio';
import { CuentoDetalle, DatosBorradorCuento } from '../dominio/cuento.modelo';

@Injectable()
export class ActualizarBorradorCasoUso {
  private readonly repositorio = inject(CUENTO_REPOSITORIO);

  ejecutar(datos: DatosBorradorCuento): Promise<CuentoDetalle> {
    return this.repositorio.actualizarBorrador(datos);
  }
}
