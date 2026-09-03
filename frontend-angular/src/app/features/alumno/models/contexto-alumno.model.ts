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

export type EstadoIntentoAprendizaje = 'started' | 'submitted' | 'evaluated';
export type EstadoCicloIntentos =
  | 'notStarted'
  | 'inProgress'
  | 'awaitingFeedback'
  | 'feedbackReceived'
  | 'revisionAvailable'
  | 'revisionInProgress'
  | 'resubmitted'
  | 'reviewedAgain'
  | 'completed';
export type AccionCicloIntentos = 'start' | 'resume' | 'wait' | 'improve' | 'continue' | 'none';

export interface FeedbackAprendizajeDto {
  comment?: string | null;
  criteria?: Record<string, unknown> | unknown[] | null;
  registeredAt?: string | null;
}

export interface ArtefactoAprendizajeDto {
  id: number;
  uuid: string;
  category: 'image' | 'document' | 'file' | 'external_link';
  originalName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  downloadUrl?: string | null;
  externalUrl?: string | null;
  checksumSha256?: string | null;
  registeredAt?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface EvidenciaAprendizajeDto {
  id: number;
  type: string;
  reference?: string | null;
  metadata?: Record<string, unknown> | null;
  registeredAt?: string | null;
  artifacts?: ArtefactoAprendizajeDto[];
}

export interface IntentoAprendizajeDto {
  id: number;
  number: number;
  state: EstadoIntentoAprendizaje;
  score?: number | null;
  approved?: boolean | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  evaluatedAt?: string | null;
  metadata?: Record<string, unknown> | null;
  evidence: EvidenciaAprendizajeDto[];
  artifacts?: ArtefactoAprendizajeDto[];
  feedback: FeedbackAprendizajeDto[];
}

export interface CicloIntentosDto {
  state: EstadoCicloIntentos;
  action: AccionCicloIntentos;
  canStartAttempt: boolean;
  canRevise: boolean;
  revisionAvailable?: boolean;
  revisionExplanationRequired: boolean;
  activeAttemptId?: number | null;
  activeAttemptNumber?: number | null;
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
    criteria?: Record<string, unknown> | unknown[] | null;
    registeredAt?: string | null;
    attemptId?: number | null;
    attemptNumber?: number | null;
  } | null;
  attemptLifecycle?: CicloIntentosDto;
  attempts?: IntentoAprendizajeDto[];
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
