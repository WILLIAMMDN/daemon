/**
 * DAEMON ARC — Fixtures del contrato REAL del Alumno.
 *
 * Cada objeto de este archivo reproduce, campo a campo, lo que serializan
 * `ArcStudentContextService` y `LearningProgressionService` en el backend
 * Laravel. Son la referencia contra la que se verifica que el frontend no
 * vuelva a esperar nombres heredados.
 *
 * Reglas de este archivo:
 *
 * - Solo campos canónicos del backend. Nunca duplicar un campo en español
 *   "por compatibilidad": eso volvería invisible la deriva que estos fixtures
 *   existen para detectar.
 * - Están tipados con los DTO de producción, así que un renombrado del backend
 *   que no se refleje aquí rompe la compilación de los tests.
 */

import {
  AulaResumenDto,
  CursoResumenDto,
  HomeContextResponse,
  LearningContextResponse,
  LearningMapResponse,
  MatriculaRespuestaDto,
  ProgresoContextoDto,
  SesionAprendizajeDto,
  VersionCurriculumDto,
} from './contexto-alumno.model';

/** `cursoResumen()` de `ArcStudentContextService`. */
export const CURSO_CONTRATO: CursoResumenDto = {
  id: 20,
  title: 'IA: Origen',
  code: 'IA-ORIGEN-TEENS',
  version: 1,
};

/** `aulaResumen()` de `ArcStudentContextService`. */
export const AULA_CONTRATO: AulaResumenDto = {
  id: 10,
  name: 'Cohorte IA Teens 2026',
  code: 'IA-TEENS-2026-A',
  teacher: { id: 7, name: 'Lucía Ramírez' },
  period: {
    id: 3,
    title: 'Periodo 2026-I',
    startsOn: '2026-03-01',
    endsOn: '2026-07-31',
  },
};

/** `versionResumen()` de `ArcStudentContextService`. */
export const VERSION_CURRICULUM_CONTRATO: VersionCurriculumDto = {
  id: 5,
  number: 1,
  audience: 'TEENS',
  difficulty: 'inicial',
  status: 'published',
};

/** `progresoPorContexto()` de `ArcStudentContextService`. */
export const PROGRESO_CONTRATO: ProgresoContextoDto = {
  lessonCount: 18,
  completedLessonCount: 9,
  lessonProgressPercent: 50,
};

/** `matriculaRespuesta()` tal como sale en home-context (sin `progress`). */
export const MATRICULA_CONTRATO: MatriculaRespuestaDto = {
  id: 1,
  status: 'active',
  isPrimary: true,
  startsOn: '2026-03-01',
  endsOn: null,
  course: CURSO_CONTRATO,
  curriculumVersion: VERSION_CURRICULUM_CONTRATO,
  cohort: AULA_CONTRATO,
};

/** `sesionRespuesta()`: contrato canónico de sesión en vivo. */
export const SESION_CONTRATO: SesionAprendizajeDto = {
  id: 55,
  type: 'live_session',
  title: 'Variables en vivo',
  course: CURSO_CONTRATO,
  cohort: { id: 10, name: 'Cohorte IA Teens 2026', code: 'IA-TEENS-2026-A' },
  startsAt: '2026-08-31T17:00:00Z',
  endsAt: '2026-08-31T18:30:00Z',
  durationMinutes: 90,
  status: 'scheduled',
  access: { joinUrl: 'https://meet.example.test/variables' },
};

/** `GET /api/v1/alumno/home-context` con matrícula activa y ruta publicada. */
export const HOME_CONTEXT_CONTRATO: HomeContextResponse = {
  student: { id: 42, name: 'Mateo Salas' },
  currentEnrollment: MATRICULA_CONTRATO,
  currentCourse: CURSO_CONTRATO,
  cohort: AULA_CONTRATO,
  nextLiveSession: SESION_CONTRATO,
  nextAction: {
    type: 'mision',
    title: 'Diseña tu primer prompt verificable',
    experience: {
      id: 303,
      type: 'mision',
      variant: null,
      title: 'Diseña tu primer prompt verificable',
      summary: 'Aplica el ciclo dirigir → verificar.',
      content: null,
      instructions: null,
      order: 2,
      required: true,
      attemptable: true,
      maxAttempts: 3,
      sourceType: null,
      sourceId: null,
      state: 'current',
      progressPercent: 0,
      objectives: [{ id: 4, code: 'AI-04', description: 'Verificar salidas de IA' }],
      latestFeedback: null,
      attemptLifecycle: {
        state: 'notStarted',
        action: 'start',
        canStartAttempt: true,
        canRevise: false,
        revisionExplanationRequired: false,
        activeAttemptId: null,
        activeAttemptNumber: null,
      },
      attempts: [],
    },
    lesson: null,
  },
  nextLearningItem: null,
  upcomingAgendaSummary: { total: 1, items: [SESION_CONTRATO] },
  generatedAt: '2026-08-31T12:00:00Z',
};

/**
 * Rama legacy de `siguienteAccion()`: el alumno no tiene ruta publicada, así
 * que el backend devuelve la lección con `course` y `cohort` propios.
 */
export const HOME_CONTEXT_LECCION_LEGACY_CONTRATO: HomeContextResponse = {
  ...HOME_CONTEXT_CONTRATO,
  nextAction: {
    type: 'lesson',
    title: 'Condicionales',
    lesson: { id: 102, durationMinutes: 25, progressState: 'notStarted' },
    course: CURSO_CONTRATO,
    cohort: AULA_CONTRATO,
  },
};

/** `GET /api/v1/alumno/learning-context`: aquí sí llega `progress`. */
export const LEARNING_CONTEXT_CONTRATO: LearningContextResponse = {
  student: { id: 42, name: 'Mateo Salas' },
  currentEnrollment: { ...MATRICULA_CONTRATO, progress: PROGRESO_CONTRATO },
  activeEnrollments: [{ ...MATRICULA_CONTRATO, progress: PROGRESO_CONTRATO }],
  generatedAt: '2026-08-31T12:00:00Z',
};

/**
 * Fallback legacy: alumno con `id_aula` pero sin matrícula registrada.
 * El backend devuelve `id: null` y aula real, sin curso publicado.
 */
export const LEARNING_CONTEXT_SIN_MATRICULA_CONTRATO: LearningContextResponse = {
  student: { id: 43, name: 'Ana Torres' },
  currentEnrollment: {
    id: null,
    status: 'active',
    isPrimary: true,
    startsOn: null,
    endsOn: null,
    course: null,
    curriculumVersion: null,
    cohort: { id: 11, name: 'Aula Legacy', code: null, teacher: null, period: null },
    progress: null,
  },
  activeEnrollments: [],
  generatedAt: '2026-08-31T12:00:00Z',
};

/** `GET /api/v1/alumno/aprender/mapa` de `LearningProgressionService::mapa()`. */
export const LEARNING_MAP_CONTRATO: LearningMapResponse = {
  enrollment: { id: 1, cohortId: 10, status: 'active' },
  courseVersion: {
    id: 5,
    courseId: 20,
    number: 1,
    audience: 'TEENS',
    difficulty: 'inicial',
    status: 'published',
  },
  path: {
    id: 1,
    title: 'IA: Origen',
    description: 'Entiende, dirige, verifica y crea con inteligencia artificial.',
    audience: 'TEENS',
    difficulty: 'inicial',
    state: 'inProgress',
  },
  progress: {
    requiredExperienceCount: 18,
    completedRequiredExperienceCount: 9,
    percent: 50,
  },
  milestones: [
    {
      id: 1,
      title: '¿La IA piensa?',
      description: 'Fundamentos y desmitificación.',
      order: 1,
      required: true,
      state: 'unlocked',
      prerequisiteIds: [],
      experiences: [
        {
          id: 101,
          type: 'leccion',
          variant: null,
          title: 'IA no es magia',
          summary: 'Reglas fijas vs. patrones aprendidos.',
          content: null,
          instructions: null,
          order: 1,
          required: true,
          attemptable: false,
          maxAttempts: null,
          sourceType: 'leccion',
          sourceId: 101,
          state: 'current',
          progressPercent: 0,
          objectives: [{ id: 1, code: 'AI-01', description: 'Comprender mecanismos de la IA' }],
          latestFeedback: null,
          attemptLifecycle: {
            state: 'notStarted',
            action: 'start',
            canStartAttempt: false,
            canRevise: false,
            revisionExplanationRequired: false,
            activeAttemptId: null,
            activeAttemptNumber: null,
          },
          attempts: [],
        },
      ],
    },
  ],
  nextItem: null,
  legacyFallback: false,
};
