export interface ProyectoMetrica {
  valor: number | null;
  etiqueta: string;
}

export interface CategoriaProyecto {
  slug: string;
  nombre: string;
  etiqueta: string;
  descripcion: string;
  ruta: string;
  accion: string;
  metricas: ProyectoMetrica[];
  tiene_actividad: boolean;
}

export interface ResumenProyectos {
  areas_disponibles: number;
  areas_exploradas: number;
  proyectos_personales: number;
}

export interface ProyectosResponse {
  resumen: ResumenProyectos;
  categorias: CategoriaProyecto[];
}
