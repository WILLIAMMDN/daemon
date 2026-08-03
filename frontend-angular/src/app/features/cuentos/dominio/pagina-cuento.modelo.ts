import { InstanteCuento, VERSION_ESQUEMA_CUENTO } from './cuento.modelo';

export type ModoSugerenciaCuento = 'ideas' | 'continuar';

export interface SugerenciaPaginaCuento {
  readonly texto: string;
  readonly conImagen: boolean;
  readonly generadaEn: number;
  readonly modo: ModoSugerenciaCuento;
}

export interface PaginaCuento {
  readonly id: string;
  readonly cuentoId: string;
  readonly versionId: string;
  readonly orden: number;
  readonly contenido: string;
  readonly ilustracionRef: string | null;
  readonly textoAlternativo: string;
  readonly fondoToken: string;
  readonly sugerencia: SugerenciaPaginaCuento | null;
  readonly creadoEn: InstanteCuento | null;
  readonly actualizadoEn: InstanteCuento | null;
  readonly schemaVersion: typeof VERSION_ESQUEMA_CUENTO;
}

export function crearPaginaCuento(
  id: string,
  orden: number,
  contenido = '<p></p>',
): PaginaCuento {
  return {
    id,
    cuentoId: '',
    versionId: '',
    orden,
    contenido,
    ilustracionRef: null,
    textoAlternativo: '',
    fondoToken: 'var(--daemon-on-primary)',
    sugerencia: null,
    creadoEn: null,
    actualizadoEn: null,
    schemaVersion: VERSION_ESQUEMA_CUENTO,
  };
}
