import { NivelAlumno } from '../../../core/dominio/nivel-alumno';
import { UsuarioSesion } from '../../../core/servicios/sesion';

export interface ProgresoNivel {
  nivel: number;
  nivel_maximo: number;
  experiencia_total: number;
  experiencia_nivel: number;
  experiencia_meta: number;
  experiencia_restante: number;
  progreso_porcentaje: number;
}

export interface UsuarioPanel extends UsuarioSesion {
  nombre_completo: string;
  usuario: string;
  nivel: NivelAlumno;
  experiencia: number;
  nivel_gamificacion: number;
  progreso_nivel: ProgresoNivel;
}

export interface ProximaMision {
  id: number;
  titulo: string;
  descripcion?: string | null;
  recompensa: number;
  tipo_evidencia: string;
  nivel_requerido: string;
}

export interface ActividadDia {
  fecha: string;
  etiqueta: string;
  activo: boolean;
  tipo: 'mision' | null;
}

export interface PanelAlumnoDto {
  usuario: UsuarioPanel;
  posicion: number;
  posicion_scope: 'aula' | 'institucion_nivel' | 'nivel';
  posicion_scope_label: string;
  misiones_pendientes: number;
  misiones_completadas: number;
  insignias: number;
  canjes_pendientes: number;
  racha: number;
  actividad_semana: ActividadDia[];
  proxima_mision?: ProximaMision | null;
  progreso_nivel: ProgresoNivel;
}

export type MotivoErrorPanel = 'offline' | 'timeout' | 'unauthorized' | 'server';

export type EstadoPanelAlumno =
  | { kind: 'loading' }
  | { kind: 'ready'; data: PanelAlumnoDto; stale: boolean; message?: string }
  | { kind: 'error'; reason: MotivoErrorPanel; message: string };
