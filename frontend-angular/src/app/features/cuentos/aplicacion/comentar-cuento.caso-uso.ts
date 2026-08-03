import { Injectable, inject } from '@angular/core';
import { COMANDOS_CUENTO_GATEWAY } from '../acceso-datos/comandos-cuento.gateway';
import { ComentarioCuento } from '../dominio/comentario-cuento.modelo';
import { ErrorCuento } from '../dominio/errores-cuento';
import { crearClaveIdempotencia } from './identificadores-cuento';

@Injectable()
export class ComentarCuentoCasoUso {
  private readonly gateway = inject(COMANDOS_CUENTO_GATEWAY);

  ejecutar(cuentoId: string, cuerpo: string): Promise<ComentarioCuento> {
    const limpio = cuerpo.trim();
    if (!limpio || limpio.length > 1000) {
      throw new ErrorCuento('DATOS_INVALIDOS', 'El comentario debe tener entre 1 y 1000 caracteres.', false);
    }
    return this.gateway.comentar(cuentoId, limpio, crearClaveIdempotencia(`comentario:${cuentoId}`));
  }

  editar(cuentoId: string, comentarioId: string, cuerpo: string): Promise<ComentarioCuento> {
    const limpio = cuerpo.trim();
    if (!limpio || limpio.length > 1000) {
      throw new ErrorCuento('DATOS_INVALIDOS', 'El comentario debe tener entre 1 y 1000 caracteres.', false);
    }
    return this.gateway.editarComentario(cuentoId, comentarioId, limpio);
  }

  eliminar(cuentoId: string, comentarioId: string): Promise<void> {
    return this.gateway.eliminarComentario(cuentoId, comentarioId);
  }
}
