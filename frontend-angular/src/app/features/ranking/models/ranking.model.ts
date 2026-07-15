export interface AlumnoRanking {
  id: number;
  nombre_mostrado: string;
  nivel: string;
  experiencia: number;
  nivel_gamificacion: number;
  progreso_nivel?: { progreso_porcentaje: number };
  rango?: string | null;
  avatar?: string | null;
  posicion: number;
  es_actual: boolean;
}

export interface RankingDto {
  scope: 'aula' | 'institucion_nivel' | 'nivel';
  scope_label: string;
  participantes: number;
  alumnos: AlumnoRanking[];
}
