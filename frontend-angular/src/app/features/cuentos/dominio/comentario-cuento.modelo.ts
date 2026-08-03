import { InstanteCuento, VERSION_ESQUEMA_CUENTO } from './cuento.modelo';

export type EstadoComentarioCuento = 'visible' | 'oculto' | 'eliminado' | 'spam';

export interface ComentarioCuento {
  readonly id: string;
  readonly cuentoId: string;
  readonly autorUid: string;
  readonly cuerpo: string;
  readonly estado: EstadoComentarioCuento;
  readonly creadoEn: InstanteCuento;
  readonly actualizadoEn: InstanteCuento;
  readonly schemaVersion: typeof VERSION_ESQUEMA_CUENTO;
}
