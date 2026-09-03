/**
 * DAEMON ARC — Contratos reales de la API del Alumno.
 *
 * Fuente de verdad: la respuesta JSON del backend, no interfaces heredadas.
 *
 * - `ArcStudentContextService` sirve `/alumno/home-context`, `/alumno/learning-context`
 *   y `/alumno/agenda`.
 * - `LearningProgressionService` sirve `/alumno/aprender/mapa`, `/alumno/aprender/siguiente`
 *   y `/alumno/rutas`.
 *
 * El backend ya expone un contrato canónico en inglés/camelCase. Estos tipos lo
 * reflejan tal cual: no se mantienen alias en español ni campos duales.
 */

/**
 * `student` de home-context y learning-context.
 *
 * El backend expone deliberadamente solo identidad mínima: no envía email,
 * usuario, rol ni avatar en este contrato (ver `ArcCohortLearningSpineTest`).
 * El perfil completo vive en la sesión y en `/alumno/perfil`.
 */
export interface AlumnoResumenDto {
  id: number;
  name: string;
}

export interface PeriodoAcademicoResumenDto {
  id: number;
  title: string;
  startsOn: string | null;
  endsOn: string | null;
}

export interface DocenteResumenDto {
  id: number;
  name: string;
}

/** `cohort` de home-context y `currentEnrollment.cohort` de learning-context. */
export interface AulaResumenDto {
  id: number;
  name: string;
  code: string | null;
  teacher: DocenteResumenDto | null;
  period: PeriodoAcademicoResumenDto | null;
}

/**
 * `course` en todo el árbol del Alumno: `currentCourse`, `currentEnrollment.course`,
 * `nextAction.course` y `nextLiveSession.course`.
 */
export interface CursoResumenDto {
  id: number;
  title: string;
  code: string | null;
  version: number | null;
}

/** `currentEnrollment.curriculumVersion` de home-context y learning-context. */
export interface VersionCurriculumDto {
  id: number;
  number: number;
  audience: string;
  difficulty: string;
  status: string;
}

/**
 * `courseVersion` de `/alumno/aprender/mapa`.
 *
 * Learning Core añade `courseId` a su proyección de versión; el resto de campos
 * coincide con `VersionCurriculumDto`.
 */
export interface VersionCursoMapaDto extends VersionCurriculumDto {
  courseId: number | null;
}

/**
 * `currentEnrollment.progress` de learning-context.
 *
 * home-context no incluye `progress`: solo learning-context lo calcula.
 */
export interface ProgresoContextoDto {
  lessonCount: number;
  completedLessonCount: number;
  lessonProgressPercent: number;
}

/**
 * `currentEnrollment` y cada elemento de `activeEnrollments`.
 *
 * `id` es `null` en el fallback legacy de un alumno con `id_aula` pero sin
 * matrícula registrada; en ese caso el aula sí es real.
 */
export interface MatriculaRespuestaDto {
  id: number | null;
  /** Columna abierta en base de datos; este contrato emite `active`. */
  status: string;
  isPrimary: boolean;
  startsOn: string | null;
  endsOn: string | null;
  course: CursoResumenDto | null;
  curriculumVersion: VersionCurriculumDto | null;
  cohort: AulaResumenDto;
  /** Solo presente en learning-context. */
  progress?: ProgresoContextoDto | null;
}

/** `enrollment` de `/alumno/aprender/mapa`: proyección mínima de Learning Core. */
export interface MatriculaMapaResumenDto {
  id: number;
  cohortId: number;
  status: string;
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
export interface SesionAprendizajeDto {
  id: number;
  type: 'live_session' | string;
  title: string;
  course: CursoResumenDto | null;
  cohort: { id: number; name: string; code: string | null } | null;
  startsAt: string;
  endsAt: string | null;
  durationMinutes: number | null;
  status: EstadoSesionAprendizaje | string;
  access: { joinUrl: string } | null;
}

/**
 * Valores reales del enum backend `TipoExperienciaAprendizaje`.
 *
 * `/alumno/aprender/mapa` los emite sin traducir.
 */
export type TipoExperiencia =
  | 'leccion'
  | 'practica'
  | 'mision'
  | 'laboratorio'
  | 'evaluacion'
  | 'proyecto'
  | 'desafio';

export type TipoExperienciaCanonico =
  | 'lesson'
  | 'practice'
  | 'mission'
  | 'lab'
  | 'assessment'
  | 'project'
  | 'challenge';

/**
 * `nextAction.type`.
 *
 * El backend solo canoniza `leccion` → `lesson` al construir la siguiente
 * acción; el resto de tipos viaja con el valor del enum en español. Usa
 * `canonizarTipoExperiencia` antes de ramificar por tipo.
 */
export type TipoSiguienteAccion = TipoExperiencia | 'lesson' | 'live_session';

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
  experiences: ExperienciaAprendizajeDto[];
}

/** `nextAction.lesson`. `durationMinutes` solo llega por la rama legacy sin ruta. */
export interface LeccionSiguienteAccionDto {
  id: number;
  progressState: string;
  durationMinutes?: number | null;
}

/**
 * `nextAction` de home-context.
 *
 * El backend arma tres formas: experiencia de la ruta (`experience` + `lesson`),
 * lección legacy sin ruta (`lesson` + `course` + `cohort`) y sesión en vivo
 * (`session`). Por eso todo salvo `type` y `title` es opcional.
 */
export interface SiguienteAccionDto {
  type: TipoSiguienteAccion;
  title: string;
  experience?: ExperienciaAprendizajeDto | null;
  lesson?: LeccionSiguienteAccionDto | null;
  course?: CursoResumenDto | null;
  cohort?: AulaResumenDto | null;
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
  requiredExperienceCount: number;
  completedRequiredExperienceCount: number;
  percent: number;
}

export interface LearningMapResponse {
  enrollment: MatriculaMapaResumenDto | null;
  courseVersion: VersionCursoMapaDto | null;
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
  legacyFallback: boolean;
}

export interface RutaDisponibleDto {
  id: number;
  title: string;
  description: string | null;
  audience: string;
  difficulty: string;
  courseVersionId: number | null;
  milestoneCount: number;
}

export interface RutasAlumnoResponse {
  paths: RutaDisponibleDto[];
}

export interface SiguienteItemResponse {
  nextItem: ExperienciaAprendizajeDto | null;
}
