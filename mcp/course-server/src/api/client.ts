import { DaemonApiError, mapHttpError, mapTransportError } from '../errors.js';
import type { ServerConfig } from '../config.js';
import type {
  ActorIdentity,
  AuthoringCatalog,
  CourseEnvelope,
  CourseListing,
  CourseVersionDetail,
  ValidationReport,
} from './types.js';

/**
 * The one place in this server that speaks HTTP to DAEMON.
 *
 * Every tool goes through here: base URL handling, bearer authentication, JSON
 * serialisation and canonical error mapping live once. No tool builds a request
 * of its own, and nothing here reaches PostgreSQL or re-implements a domain
 * rule — the Laravel API remains the sole authority.
 *
 * Request bodies use the Spanish field names the canonical API validates today;
 * the read contracts it returns are already English/camelCase and pass through
 * untouched. This adapter normalises naming, never domain semantics.
 */

export interface CreateDraftVersionInput {
  titulo?: string;
  descripcion?: string;
  audiencia?: string;
  etapa?: string;
}

export interface VersionMetadataInput {
  titulo?: string;
  descripcion?: string;
  audiencia: string;
  etapa: string;
}

export interface CourseInput {
  id_institucion: number;
  titulo: string;
  codigo?: string;
  descripcion?: string;
  nivel?: string;
}

export interface UnitInput {
  titulo: string;
  descripcion?: string;
  orden: number;
}

export interface LessonInput {
  titulo: string;
  resumen?: string;
  contenido?: Record<string, unknown>;
  duracion_minutos?: number;
  orden: number;
  objetivos?: number[];
}

export interface PathInput {
  titulo: string;
  descripcion?: string;
  audiencia: string;
  etapa: string;
}

export interface MilestoneInput {
  titulo?: string;
  descripcion?: string | null;
  orden?: number;
  obligatorio?: boolean;
}

export interface ObjectiveInput {
  id_institucion?: number;
  codigo?: string;
  descripcion: string;
  marco?: string;
  nivel?: string;
}

export interface ExperienceInput {
  id_unidad?: number | null;
  tipo?: string;
  variante?: string | null;
  titulo?: string;
  descripcion?: string | null;
  origen_tipo?: string | null;
  origen_id?: number | null;
  orden?: number;
  obligatoria?: boolean;
  permite_intentos?: boolean;
  max_intentos?: number | null;
  regla_completitud?: Record<string, unknown> | null;
  guia_entrega?: Record<string, unknown> | null;
  contenido?: Record<string, unknown> | null;
  objetivos?: number[];
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class DaemonAuthoringClient {
  constructor(
    private readonly config: ServerConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  /* ------------------------------------------------------------------ */
  /* Identity                                                            */
  /* ------------------------------------------------------------------ */

  async whoami(): Promise<ActorIdentity> {
    const body = await this.request<Record<string, unknown>>('GET', '/auth/yo');
    const usuario = (body.data ?? body) as Record<string, unknown>;

    return {
      id: Number(usuario.id ?? 0),
      role: String(usuario.rol ?? 'unknown'),
      institutionId: usuario.id_institucion == null ? null : Number(usuario.id_institucion),
      reference: String(usuario.usuario ?? usuario.email ?? `usuario:${usuario.id ?? '?'}`),
    };
  }

  /* ------------------------------------------------------------------ */
  /* Reads                                                               */
  /* ------------------------------------------------------------------ */

  catalog(): Promise<AuthoringCatalog> {
    return this.request('GET', '/academico/studio/catalogo');
  }

  listCourses(): Promise<CourseListing> {
    return this.request('GET', '/academico/studio/cursos');
  }

  course(courseId: number): Promise<CourseEnvelope> {
    return this.request('GET', `/academico/studio/cursos/${courseId}`);
  }

  courseVersion(versionId: number): Promise<CourseVersionDetail> {
    return this.request('GET', `/academico/studio/versiones/${versionId}`);
  }

  validateVersion(versionId: number): Promise<ValidationReport> {
    return this.request('GET', `/academico/studio/versiones/${versionId}/validacion`);
  }

  /* ------------------------------------------------------------------ */
  /* Course shell and versions                                           */
  /* ------------------------------------------------------------------ */

  createCourse(input: CourseInput): Promise<Record<string, unknown>> {
    return this.request('POST', '/academico/cursos', input);
  }

  createVersion(courseId: number, input: VersionMetadataInput): Promise<Record<string, unknown>> {
    return this.request('POST', `/academico/cursos/${courseId}/versiones`, input);
  }

  createDraftFromVersion(versionId: number, input: CreateDraftVersionInput): Promise<CourseVersionDetail> {
    return this.request('POST', `/academico/studio/versiones/${versionId}/borrador`, input);
  }

  updateVersionMetadata(versionId: number, input: VersionMetadataInput): Promise<Record<string, unknown>> {
    return this.request('PUT', `/academico/versiones/${versionId}`, input);
  }

  createUnit(versionId: number, input: UnitInput): Promise<Record<string, unknown>> {
    return this.request('POST', `/academico/versiones/${versionId}/unidades`, input);
  }

  createLesson(unitId: number, input: LessonInput): Promise<Record<string, unknown>> {
    return this.request('POST', `/academico/unidades/${unitId}/lecciones`, input);
  }

  createPath(versionId: number, input: PathInput): Promise<Record<string, unknown>> {
    return this.request('POST', `/academico/versiones/${versionId}/rutas`, input);
  }

  /* ------------------------------------------------------------------ */
  /* Objectives                                                          */
  /* ------------------------------------------------------------------ */

  createObjective(input: ObjectiveInput): Promise<Record<string, unknown>> {
    return this.request('POST', '/academico/objetivos', input);
  }

  updateObjective(objectiveId: number, input: ObjectiveInput): Promise<Record<string, unknown>> {
    return this.request('PUT', `/academico/objetivos/${objectiveId}`, input);
  }

  /* ------------------------------------------------------------------ */
  /* Milestones                                                          */
  /* ------------------------------------------------------------------ */

  createMilestone(pathId: number, input: MilestoneInput): Promise<Record<string, unknown>> {
    return this.request('POST', `/academico/rutas/${pathId}/hitos`, input);
  }

  updateMilestone(milestoneId: number, input: MilestoneInput): Promise<Record<string, unknown>> {
    return this.request('PUT', `/academico/hitos/${milestoneId}`, input);
  }

  deleteMilestone(milestoneId: number): Promise<Record<string, unknown>> {
    return this.request('DELETE', `/academico/hitos/${milestoneId}`);
  }

  setMilestonePrerequisites(milestoneId: number, prerequisiteIds: number[]): Promise<Record<string, unknown>> {
    return this.request('PUT', `/academico/hitos/${milestoneId}/prerrequisitos`, {
      prerrequisitos: prerequisiteIds,
    });
  }

  /* ------------------------------------------------------------------ */
  /* Experiences                                                         */
  /* ------------------------------------------------------------------ */

  createExperience(milestoneId: number, input: ExperienceInput): Promise<Record<string, unknown>> {
    return this.request('POST', `/academico/hitos/${milestoneId}/experiencias`, input);
  }

  updateExperience(experienceId: number, input: ExperienceInput): Promise<Record<string, unknown>> {
    return this.request('PUT', `/academico/experiencias/${experienceId}`, input);
  }

  deleteExperience(experienceId: number): Promise<Record<string, unknown>> {
    return this.request('DELETE', `/academico/experiencias/${experienceId}`);
  }

  linkExperienceObjectives(experienceId: number, objectiveIds: number[]): Promise<Record<string, unknown>> {
    return this.request('PUT', `/academico/experiencias/${experienceId}/objetivos`, { objetivos: objectiveIds });
  }

  /* ------------------------------------------------------------------ */
  /* Transport                                                           */
  /* ------------------------------------------------------------------ */

  private async request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.config.token}`,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch (cause) {
      throw mapTransportError(cause, url, this.config.timeoutMs);
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let parsed: unknown = null;
    if (text !== '') {
      try {
        parsed = JSON.parse(text);
      } catch {
        // A non-JSON body from this API means an upstream failure, never a
        // domain answer. Raw HTML is deliberately not propagated to the client.
        parsed = null;
      }
    }

    if (!response.ok) {
      throw mapHttpError(response.status, parsed, url);
    }

    if (parsed === null && text !== '') {
      throw new DaemonApiError({
        code: 'UPSTREAM_ERROR',
        status: response.status,
        message: 'The DAEMON Authoring API returned a non-JSON body.',
      });
    }

    return (parsed ?? {}) as T;
  }
}
