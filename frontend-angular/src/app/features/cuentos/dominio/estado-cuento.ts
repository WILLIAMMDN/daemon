export const ESTADOS_CUENTO = [
  'borrador',
  'en_revision',
  'publicado',
  'rechazado',
  'archivado',
  'eliminado',
] as const;

export type EstadoCuento = (typeof ESTADOS_CUENTO)[number];

export const ESTADOS_EDITABLES: ReadonlySet<EstadoCuento> = new Set(['borrador', 'rechazado']);

export function esEstadoCuento(valor: unknown): valor is EstadoCuento {
  return typeof valor === 'string' && ESTADOS_CUENTO.includes(valor as EstadoCuento);
}
