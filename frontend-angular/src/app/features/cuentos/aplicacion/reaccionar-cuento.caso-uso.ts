import { Injectable, inject } from '@angular/core';
import { COMANDOS_CUENTO_GATEWAY } from '../acceso-datos/comandos-cuento.gateway';
import { TipoReaccionCuento } from '../dominio/reaccion-cuento.modelo';
import { crearClaveIdempotencia } from './identificadores-cuento';

@Injectable()
export class ReaccionarCuentoCasoUso {
  private readonly comandos = inject(COMANDOS_CUENTO_GATEWAY);

  ejecutar(cuentoId: string, tipo: TipoReaccionCuento | null): Promise<void> {
    return this.comandos.reaccionar(cuentoId, tipo, crearClaveIdempotencia('reaccion'));
  }
}
