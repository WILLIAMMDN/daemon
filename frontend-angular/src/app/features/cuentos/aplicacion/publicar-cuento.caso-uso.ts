import { Injectable, inject } from '@angular/core';
import { COMANDOS_CUENTO_GATEWAY, ResultadoComandoCuento } from '../acceso-datos/comandos-cuento.gateway';
import { crearClaveIdempotencia } from './identificadores-cuento';

@Injectable()
export class PublicarCuentoCasoUso {
  private readonly gateway = inject(COMANDOS_CUENTO_GATEWAY);
  private readonly claves = new Map<string, string>();

  async ejecutar(cuentoId: string): Promise<ResultadoComandoCuento> {
    const clave = this.claves.get(cuentoId) ?? crearClaveIdempotencia(`publicar:${cuentoId}`);
    this.claves.set(cuentoId, clave);
    const resultado = await this.gateway.solicitarPublicacion(cuentoId, clave);
    this.claves.delete(cuentoId);
    return resultado;
  }
}
