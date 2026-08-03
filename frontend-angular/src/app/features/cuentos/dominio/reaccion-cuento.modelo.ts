import { InstanteCuento, VERSION_ESQUEMA_CUENTO } from './cuento.modelo';

export const TIPOS_REACCION_CUENTO = [
  'encanto',
  'increible',
  'gusto',
  'sorprendio',
  'interesante',
] as const;

export type TipoReaccionCuento = (typeof TIPOS_REACCION_CUENTO)[number];

export interface ReaccionCuento {
  readonly cuentoId: string;
  readonly usuarioUid: string;
  readonly tipo: TipoReaccionCuento;
  readonly creadoEn: InstanteCuento;
  readonly schemaVersion: typeof VERSION_ESQUEMA_CUENTO;
}

export function esTipoReaccionCuento(valor: unknown): valor is TipoReaccionCuento {
  return typeof valor === 'string' && TIPOS_REACCION_CUENTO.includes(valor as TipoReaccionCuento);
}
