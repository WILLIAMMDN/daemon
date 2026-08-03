import { Injectable, inject } from '@angular/core';
import { CUENTO_REPOSITORIO } from '../acceso-datos/cuento.repositorio';
import { AudienciaCuento, CuentoDetalle, DatosBorradorCuento } from '../dominio/cuento.modelo';

@Injectable()
export class CrearBorradorCasoUso {
  private readonly repositorio = inject(CUENTO_REPOSITORIO);

  ejecutar(datos: DatosBorradorCuento, audiencia: AudienciaCuento): Promise<CuentoDetalle> {
    return this.repositorio.crearBorrador(datos, audiencia);
  }
}
