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

export type EstadoSesionAprendizaje = 'scheduled' | 'cancelled' | 'completed';

/**
 * Contrato canónico de sesión en vivo del Alumno.
 *
 * Es exactamente lo que devuelven `/alumno/agenda`, `/alumno/home-context`
 * (`nextLiveSession`, `upcomingAgendaSummary.items`) y `nextAction.session`.
 * El backend nunca expone aquí la descripción/instrucciones internas del
 * docente: si hace falta añadir contenido para el Alumno, se amplía el
 * contrato del backend, no este modelo.
 */
export interface SesionCursoResumenDto {
  id: number;
  title: string;
  code?: string | null;
  version?: number | null;
}

export interface SesionAprendizajeDto {
  id: number;
  type: 'live_session' | string;
  title: string;
  course: SesionCursoResumenDto | null;
  cohort: { id: number; name: string; code?: string | null } | null;
  startsAt: string;
  endsAt: string | null;
  durationMinutes: number | null;
  status: EstadoSesionAprendizaje | string;
  access: { joinUrl: string } | null;
}

export type TipoExperiencia =
  | 'lesson'
  | 'leccion'
  | 'practice'
  | 'practica'
  | 'mission'
  | 'mision'
  | 'lab'
  | 'laboratorio'
  | 'assessment'
  | 'evaluacion'
  | 'project'
  | 'proyecto'
  | 'challenge'
  | 'desafio'
  | 'live_session';

export type TipoExperienciaCanonico =
  | 'lesson'
  | 'practice'
  | 'mission'
  | 'lab'
  | 'assessment'
  | 'project'
  | 'challenge';

export function canonizarTipoExperiencia(tipo: string): TipoExperienciaCanonico {
  switch (tipo) {
    case 'leccion':
    case 'lesson':
      return 'lesson';
    case 'practica':
    case 'practice':
      return 'practice';
    case 'mision':
    case 'mission':
      return 'mission';
    case 'laboratorio':
    case 'lab':
      return 'lab';
    case 'evaluacion':
    case 'assessment':
      return 'assessment';
    case 'proyecto':
    case 'project':
      return 'project';
    case 'desafio':
    case 'challenge':
      return 'challenge';
    default:
      return 'lesson';
  }
}

export const ETIQUETA_TIPO_EXPERIENCIA: Record<TipoExperienciaCanonico, string> = {
  lesson: 'Lección',
  practice: 'Práctica',
  mission: 'Misión',
  lab: 'Laboratorio',
  assessment: 'Evaluación',
  project: 'Proyecto',
  challenge: 'Desafío',
};

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
  summary?: string | null;
  content?: unknown;
  instructions?: unknown;
  order: number;
  required: boolean;
  attemptable?: boolean;
  maxAttempts?: number | null;
  sourceType?: string | null;
  sourceId?: number | null;
  state: EstadoProgresoExperiencia;
  progressPercent: number;
  objectives: ObjetivoAprendizajeCoreDto[];
  latestFeedback?: {
    comment?: string | null;
    criteria?: unknown;
    registeredAt?: string | null;
  } | null;
}

export interface HitoAprendizajeDto {
  id: number;
  title: string;
  description?: string | null;
  order: number;
  required?: boolean;
  state: 'completed' | 'unlocked' | 'locked';
  prerequisiteIds?: number[];
  unlocked?: boolean;
  completed?: boolean;
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

export interface LearningMapProgressDto {
  requiredExperienceCount?: number;
  completedRequiredExperienceCount?: number;
  requiredTotal?: number;
  completedTotal?: number;
  percent: number;
}

export interface LearningMapResponse {
  path: {
    id: number;
    title: string;
    description?: string | null;
    audience: string;
    difficulty: string;
    state?: string;
  } | null;
  milestones: HitoAprendizajeDto[];
  nextItem: ExperienciaAprendizajeDto | null;
  progress: LearningMapProgressDto;
  enrollment?: MatriculaRespuestaDto | null;
  courseVersion?: VersionCursoResumenDto | null;
  legacyFallback?: boolean;
}

export interface RutaDisponibleDto {
  id: number;
  title: string;
  description?: string | null;
  audience: string;
  difficulty: string;
  courseVersionId?: number | null;
  milestoneCount?: number;
}

export interface RutasAlumnoResponse {
  paths: RutaDisponibleDto[];
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
