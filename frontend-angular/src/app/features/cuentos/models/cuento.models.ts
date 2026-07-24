export interface CuentoRegistro {
  id: string | number;
  id_alumno: number;
  titulo?: string | null;
  /** Sinopsis / brief que el estudiante escribe para guiar a la IA. */
  descripcion?: string | null;
  autor?: string | null;
  avatar?: string | null;
  fecha_creacion?: string | null;
  /** Portada explícita del cuento (puede ser la misma que `img_1`). */
  portada?: string | null;
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
  contenido?: string | null;
  categoria?: string | null;
  rango_edad?: string | null;
  visibilidad?: 'privado' | 'publico' | null;
  estado?: 'borrador' | 'publicado' | null;
  palabras?: number | null;
  tiempo_lectura?: number | null;
  paginas?: Array<Record<string, unknown>> | null;
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

export interface CuentoComentario {
  id?: string;
  contenido: string;
  autor_id: string | number;
  autor_nombre: string;
  avatar?: string | null;
  fecha_creacion: string;
}

export interface CuentoReaccion {
  id?: string;
  tipo: string;
  fecha_creacion: string;
}

export interface CuentoDetallePayload {
  cuento: CuentoRegistro;
  autor: { nombre_completo?: string | null; avatar?: string | null; };
}
