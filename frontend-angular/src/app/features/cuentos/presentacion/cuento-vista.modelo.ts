import { Cuento } from '../dominio/cuento.modelo';

export interface CuentoVista extends Cuento {
  readonly tituloVista: string;
  readonly autorVista: string;
  readonly inicialAutor: string;
  readonly avatar: string | null;
  readonly portadaUrl: string | null;
  readonly fechaVista: string;
  readonly timestamp: number;
  readonly esMio: boolean;
  readonly escenasConContenido: number;
  readonly textoBusqueda: string;
  readonly colorAutor: string;
  readonly tagNombre: string;
  readonly tagClase: string;
  readonly reaccionesCount: number;
}
