import { InjectionToken } from '@angular/core';
import { ComentarioCuento } from '../dominio/comentario-cuento.modelo';
import { TipoReaccionCuento } from '../dominio/reaccion-cuento.modelo';

export interface ResultadoComandoCuento {
  readonly estado: 'en_revision' | 'publicado' | 'eliminado';
  readonly repetido: boolean;
}

export interface EstadisticasInteraccionCuento {
  readonly comentarios: number;
  readonly reacciones: {
    readonly total: number;
    readonly propia: TipoReaccionCuento | null;
    readonly porTipo: Readonly<Record<TipoReaccionCuento, number>>;
  };
}

export abstract class ComandosCuentoGateway {
  abstract solicitarPublicacion(cuentoId: string, idempotencia: string): Promise<ResultadoComandoCuento>;
  abstract eliminar(cuentoId: string, idempotencia: string): Promise<ResultadoComandoCuento>;
  abstract comentar(cuentoId: string, cuerpo: string, idempotencia: string): Promise<ComentarioCuento>;
  abstract editarComentario(cuentoId: string, comentarioId: string, cuerpo: string): Promise<ComentarioCuento>;
  abstract eliminarComentario(cuentoId: string, comentarioId: string): Promise<void>;
  abstract reaccionar(
    cuentoId: string,
    tipo: TipoReaccionCuento | null,
    idempotencia: string,
  ): Promise<void>;
  abstract obtenerEstadisticas(cuentoId: string): Promise<EstadisticasInteraccionCuento>;
}

export const COMANDOS_CUENTO_GATEWAY = new InjectionToken<ComandosCuentoGateway>(
  'COMANDOS_CUENTO_GATEWAY',
);
