export interface PaginaCuentoVista {
  readonly id: string;
  readonly contenido: string;
  readonly colorFondo: string;
  readonly ilustracion: string | null;
  readonly textoAlternativo: string;
}

export interface CuentoDetalleVista {
  readonly cuento: {
    readonly id: string;
    readonly titulo: string;
    readonly descripcion: string;
    readonly portada: string | null;
    readonly categoria: string;
    readonly rango_edad: string;
    readonly tiempo_lectura: number;
    readonly fecha_creacion: number;
    readonly paginas: readonly PaginaCuentoVista[];
    readonly contenido: string;
  };
  readonly autor: {
    readonly nombre_completo: string;
    readonly avatar: string | null;
  };
  readonly autorUid: string;
}

export interface ComentarioCuentoVista {
  readonly id: string;
  readonly contenido: string;
  readonly autor_id: string;
  readonly autor_nombre: string;
  readonly avatar: string | null;
  readonly fecha_creacion: number;
}
