export interface CuentoRegistro {
  id: number;
  id_alumno: number;
  titulo?: string | null;
  autor?: string | null;
  avatar?: string | null;
  fecha_creacion?: string | null;
  img_1?: string | null;
  img_2?: string | null;
  img_3?: string | null;
  img_4?: string | null;
  img_5?: string | null;
  img_6?: string | null;
  data_1?: unknown;
  data_2?: unknown;
  data_3?: unknown;
  data_4?: unknown;
  data_5?: unknown;
  data_6?: unknown;
  categoria?: string | null;
  reacciones_count?: number;
}

export interface CuentoVista extends CuentoRegistro {
  tituloVista: string;
  autorVista: string;
  inicialAutor: string;
  portadaUrl: string | null;
  fechaVista: string;
  timestamp: number;
  esMio: boolean;
  escenasConContenido: number;
  textoBusqueda: string;
  colorAutor: string;
  tagNombre: string;
  tagClase: string;
}
