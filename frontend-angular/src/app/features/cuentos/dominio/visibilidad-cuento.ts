export const VISIBILIDADES_CUENTO = ['privado', 'aula', 'comunidad'] as const;

export type VisibilidadCuento = (typeof VISIBILIDADES_CUENTO)[number];

export function esVisibilidadCuento(valor: unknown): valor is VisibilidadCuento {
  return typeof valor === 'string' && VISIBILIDADES_CUENTO.includes(valor as VisibilidadCuento);
}
