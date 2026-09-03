/**
 * Contrato canónico de Course Operations / Studio.
 *
 * Espejo exacto de `/api/v1/academico/studio` y de los endpoints de autoría
 * de `/api/v1/academico`. El frontend no deriva ni reinterpreta reglas de
 * negocio: la validación, la inmutabilidad y la publicación son autoridad del
 * backend, y estos tipos sólo describen lo que devuelve.
 */

export type EstadoVersion = 'draft' | 'published' | 'archived';

export type TipoExperiencia =
  | 'leccion'
  | 'practica'
  | 'mision'
  | 'laboratorio'
  | 'evaluacion'
  | 'proyecto'
  | 'desafio';

export type ModalidadEvidencia = 'text' | 'structured' | 'image' | 'pdf' | 'external_link';

export type ModoCompletitud = 'manual_review' | 'passing_score' | 'submission' | 'lesson_completion';

export interface ActorResumen {
  readonly id: number;
  readonly name: string;
}

export interface VersionResumen {
  readonly id: number;
  readonly uuid: string;
  readonly courseId: number;
  readonly number: number;
  readonly title: string | null;
  readonly description: string | null;
  readonly audience: string | null;
  readonly difficulty: string | null;
  readonly status: EstadoVersion;
  readonly editable: boolean;
  readonly publishedAt: string | null;
  readonly archivedAt: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly clonedFromVersionId: number | null;
  readonly author: ActorResumen | null;
  readonly publisher: ActorResumen | null;
  readonly pathCount: number | null;
}

export interface CursoResumen {
  readonly id: number;
  readonly title: string;
  readonly code: string | null;
  readonly description: string | null;
  readonly audience: string | null;
  readonly status: string;
  readonly versionCount: number;
  readonly cohortCount: number;
  readonly publishedVersion: VersionResumen | null;
  readonly draftVersion: VersionResumen | null;
  readonly versions: readonly VersionResumen[];
}

export interface CursosResponse {
  readonly courses: readonly CursoResumen[];
  readonly generatedAt: string;
}

export interface CursoResponse {
  readonly course: CursoResumen;
  readonly generatedAt: string;
}

export interface ObjetivoResumen {
  readonly id: number;
  readonly code: string | null;
  readonly description: string;
  readonly framework: string | null;
  readonly level: string | null;
}

export interface ConfiguracionEvidencia {
  readonly modalities: readonly ModalidadEvidencia[];
  readonly required: boolean;
  readonly minimumArtifacts: number;
  readonly notes: string | null;
  readonly configured: boolean;
}

export interface CriterioRubrica {
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
}

export interface Rubrica {
  readonly title: string | null;
  readonly criteria: readonly CriterioRubrica[];
  /** La rúbrica proviene de la forma heredada `rubrica_referencia`. */
  readonly legacy: boolean;
}

export interface BloqueContenido {
  readonly type: string;
  readonly title: string | null;
  readonly text: string | null;
  readonly items: readonly string[];
  /** Clave de lista original en el almacenamiento; se respeta al reescribir. */
  readonly itemsKey: string | null;
  readonly extras: Record<string, unknown> | null;
}

export interface ContenidoExperiencia {
  readonly format: 'empty' | 'plain' | 'structured';
  readonly summary: string | null;
  readonly blocks: readonly BloqueContenido[];
  readonly raw: Record<string, unknown> | null;
}

export interface ExperienciaDetalle {
  readonly id: number;
  readonly uuid: string;
  readonly milestoneId: number;
  readonly unitId: number | null;
  readonly type: TipoExperiencia;
  readonly variant: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly order: number;
  readonly required: boolean;
  readonly attemptable: boolean;
  readonly maxAttempts: number | null;
  readonly sourceType: string | null;
  readonly sourceId: number | null;
  readonly status: string;
  readonly completion: { readonly mode: ModoCompletitud | null; readonly passingScore: number | null };
  readonly review: { readonly required: boolean; readonly source: 'explicit' | 'derivedFromType' };
  readonly evidence: ConfiguracionEvidencia;
  readonly rubric: Rubrica | null;
  readonly deliveryGuide: Record<string, unknown> | null;
  readonly content: ContenidoExperiencia;
  readonly objectiveIds: readonly number[];
  readonly objectives: readonly ObjetivoResumen[];
}

export interface HitoDetalle {
  readonly id: number;
  readonly title: string;
  readonly description: string | null;
  readonly order: number;
  readonly required: boolean;
  readonly prerequisiteIds: readonly number[];
  readonly experiences: readonly ExperienciaDetalle[];
}

export interface RutaDetalle {
  readonly id: number;
  readonly title: string;
  readonly description: string | null;
  readonly audience: string | null;
  readonly difficulty: string | null;
  readonly status: EstadoVersion;
  readonly editable: boolean;
  readonly milestones: readonly HitoDetalle[];
}

export interface LeccionResumen {
  readonly id: number;
  readonly title: string;
  readonly order: number;
  readonly status: string;
}

export interface UnidadResumen {
  readonly id: number;
  readonly title: string;
  readonly description: string | null;
  readonly order: number;
  readonly status: string;
  readonly lessons: readonly LeccionResumen[];
}

export interface HallazgoValidacion {
  readonly code: string;
  readonly scope: 'version' | 'path' | 'milestone' | 'experience';
  readonly message: string;
  readonly targetId: number | null;
}

export interface ValidacionVersion {
  readonly versionId: number;
  readonly ready: boolean;
  readonly errors: readonly HallazgoValidacion[];
  readonly warnings: readonly HallazgoValidacion[];
  readonly checkedAt: string;
}

export interface VersionDetalle {
  readonly course: {
    readonly id: number;
    readonly title: string;
    readonly code: string | null;
    readonly level: string | null;
    readonly status: string;
  };
  readonly version: VersionResumen;
  readonly editable: boolean;
  readonly units: readonly UnidadResumen[];
  readonly paths: readonly RutaDetalle[];
  readonly objectives: readonly ObjetivoResumen[];
  readonly validation: ValidacionVersion;
  readonly generatedAt: string;
}

export interface CatalogoStudio {
  readonly experienceTypes: readonly TipoExperiencia[];
  readonly audiences: readonly string[];
  readonly difficulties: readonly string[];
  readonly evidenceModalities: readonly ModalidadEvidencia[];
  readonly artifactModalities: readonly ModalidadEvidencia[];
  readonly completionModes: readonly ModoCompletitud[];
  readonly contentBlockTypes: readonly string[];
  readonly objectives: readonly ObjetivoResumen[];
}

/* ------------------------------------------------------------------ */
/* Payloads de escritura — forma exacta que acepta la API canónica      */
/* ------------------------------------------------------------------ */

export interface MetadatosVersionPayload {
  readonly titulo: string | null;
  readonly descripcion: string | null;
  readonly audiencia: string;
  readonly etapa: string;
}

export interface HitoPayload {
  readonly titulo?: string;
  readonly descripcion?: string | null;
  readonly orden?: number;
  readonly obligatorio?: boolean;
}

export interface BloqueContenidoPayload {
  readonly type: string;
  readonly title?: string | null;
  readonly text?: string | null;
  readonly items?: readonly string[];
  readonly itemsKey?: string | null;
  readonly extras?: Record<string, unknown> | null;
}

export interface ContenidoPayload {
  readonly summary?: string | null;
  readonly blocks?: readonly BloqueContenidoPayload[];
  readonly raw?: Record<string, unknown> | null;
}

export interface ExperienciaPayload {
  readonly tipo?: TipoExperiencia;
  readonly titulo?: string;
  readonly descripcion?: string | null;
  readonly orden?: number;
  readonly obligatoria?: boolean;
  readonly permite_intentos?: boolean;
  readonly max_intentos?: number | null;
  readonly id_unidad?: number | null;
  readonly regla_completitud?: {
    readonly modo?: ModoCompletitud | null;
    readonly puntaje_minimo?: number | null;
    readonly revision_humana?: boolean | null;
  } | null;
  readonly guia_entrega?: Record<string, unknown> | null;
  readonly contenido?: ContenidoPayload | null;
  readonly objetivos?: readonly number[];
}

export interface BorradorPayload {
  readonly titulo?: string;
  readonly descripcion?: string;
  readonly audiencia?: string;
  readonly etapa?: string;
}
