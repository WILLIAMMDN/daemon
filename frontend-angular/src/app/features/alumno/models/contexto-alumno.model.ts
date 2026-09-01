/**
 * DAEMON ARC — Modelos fuertemente tipados para los contratos reales de la API.
 * 
 * Basado en ArcStudentContextController, LearningCoreStudentController y sus servicios.
 */

export interface AlumnoResumenDto {
  id: number;
  nombre_completo: string;
  usuario: string;
  email: string;
  rol: string;
  nivel: string;
  avatar?: string | null;
}

export interface AulaResumenDto {
  id: number;
  nombre: string;
  codigo?: string | null;
  grado?: string | null;
  seccion?: string | null;
  periodo?: {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
  } | null;
}

export interface CursoResumenDto {
  id: number;
  titulo: string;
  slug?: string | null;
  descripcion?: string | null;
  nivel?: string | null;
  audiencia?: 'kids' | 'teens' | 'todos' | string | null;
}

export interface VersionCursoResumenDto {
  id: number;
  version: string;
  estado: string;
}

export interface ProgresoContextoDto {
  totalLessons: number;
  completedLessons: number;
  percent: number;
}

export interface MatriculaRespuestaDto {
  id: number | null;
  role: string;
  status: string;
  isPrimary: boolean;
  startDate?: string | null;
  endDate?: string | null;
  aula: AulaResumenDto;
  course: CursoResumenDto | null;
  courseVersion?: VersionCursoResumenDto | null;
  progress?: ProgresoContextoDto | null;
}

export interface SesionAprendizajeDto {
  id: number;
  titulo: string;
  descripcion?: string | null;
  tipo: 'live' | 'taller' | 'asesoria' | string;
  estado: 'programada' | 'en_vivo' | 'finalizada' | 'cancelada' | string;
  fecha_inicio: string;
  fecha_fin: string;
  enlace_sesion?: string | null;
  reunion_id?: string | null;
  sala_id?: string | null;
  grabacion_url?: string | null;
  aula_id: number;
}

export type TipoExperiencia =
  | 'lesson'
  | 'practice'
  | 'mission'
  | 'lab'
  | 'assessment'
  | 'project'
  | 'challenge'
  | 'live_session';

export type EstadoProgresoExperiencia = 'completed' | 'current' | 'unlocked' | 'locked';

export interface ObjetivoAprendizajeCoreDto {
  id: number;
  code?: string | null;
  description: string;
}

export interface ExperienciaAprendizajeDto {
  id: number;
  type: TipoExperiencia;
  variant?: string | null;
  title: string;
  order: number;
  required: boolean;
  attemptable?: boolean;
  maxAttempts?: number | null;
  sourceType?: string | null;
  sourceId?: number | null;
  state: EstadoProgresoExperiencia;
  progressPercent: number;
  objectives: ObjetivoAprendizajeCoreDto[];
}

export interface HitoAprendizajeDto {
  id: number;
  title: string;
  order: number;
  unlocked: boolean;
  completed: boolean;
  experiences: ExperienciaAprendizajeDto[];
}

export interface SiguienteAccionDto {
  type: TipoExperiencia | 'live_session';
  title: string;
  experience?: ExperienciaAprendizajeDto | null;
  lesson?: {
    id: number;
    progressState: string;
    courseId?: number;
    unitId?: number;
  } | null;
  session?: SesionAprendizajeDto | null;
}

export interface HomeContextResponse {
  student: AlumnoResumenDto;
  currentEnrollment: MatriculaRespuestaDto | null;
  currentCourse: CursoResumenDto | null;
  cohort: AulaResumenDto | null;
  nextLiveSession: SesionAprendizajeDto | null;
  nextAction: SiguienteAccionDto | null;
  nextLearningItem: ExperienciaAprendizajeDto | null;
  upcomingAgendaSummary: {
    total: number;
    items: SesionAprendizajeDto[];
  };
  generatedAt: string;
}

export interface LearningContextResponse {
  student: AlumnoResumenDto;
  currentEnrollment: MatriculaRespuestaDto | null;
  activeEnrollments: MatriculaRespuestaDto[];
  generatedAt: string;
}

export interface AgendaResponse {
  range: {
    start: string;
    end: string;
  };
  events: SesionAprendizajeDto[];
}

export interface LearningMapResponse {
  path: {
    id: number;
    title: string;
    audience: string;
    difficulty: string;
  } | null;
  milestones: HitoAprendizajeDto[];
  nextItem: ExperienciaAprendizajeDto | null;
  progress: {
    requiredTotal: number;
    completedTotal: number;
    percent: number;
  };
  enrollment?: MatriculaRespuestaDto | null;
  courseVersion?: VersionCursoResumenDto | null;
  legacyFallback?: boolean;
}

export interface RutaAprendizajeItemDto {
  id: number;
  titulo: string;
  slug: string;
  audiencia: string;
  dificultad: string;
  hitos_count?: number;
  experiencias_count?: number;
}
