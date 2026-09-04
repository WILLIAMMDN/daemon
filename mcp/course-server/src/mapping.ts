import type { ExperienceInput, MilestoneInput } from './api/client.js';

/**
 * Naming normalisation between the MCP tool surface (English/camelCase, the
 * same vocabulary the canonical read contract already uses) and the request
 * field names the Authoring API validates today.
 *
 * This is a rename, not a rule. No default is invented, no value is derived and
 * nothing omitted by the caller is filled in: an omitted field stays omitted so
 * the API's partial-update semantics keep working.
 */

type Json = Record<string, unknown>;

/** Drop only keys the caller did not supply; an explicit null is meaningful. */
function compact<T extends Json>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as T;
}

export interface EvidenceInput {
  modalities: string[];
  required?: boolean;
  minimumArtifacts?: number;
  notes?: string;
}

export interface RubricInput {
  title?: string;
  criteria: { code?: string; title: string; description?: string }[];
}

export interface DeliveryGuideInput {
  preserve?: Json;
  evidence?: EvidenceInput;
  rubric?: RubricInput;
}

export interface ContentInput {
  summary?: string;
  blocks: {
    type: string;
    title?: string;
    text?: string;
    items?: string[];
    itemsKey?: string;
    extras?: Json;
  }[];
}

export interface CompletionInput {
  mode?: string;
  passingScore?: number;
  humanReviewRequired?: boolean;
}

export interface ExperienceToolInput {
  unitId?: number | null;
  type?: string;
  variant?: string | null;
  title?: string;
  description?: string | null;
  order?: number;
  required?: boolean;
  attemptable?: boolean;
  maxAttempts?: number | null;
  sourceType?: string | null;
  sourceId?: number | null;
  completion?: CompletionInput;
  deliveryGuide?: DeliveryGuideInput;
  content?: ContentInput | null;
  objectiveIds?: number[];
}

export interface MilestoneToolInput {
  title?: string;
  description?: string | null;
  order?: number;
  required?: boolean;
}

export function toDeliveryGuide(input: DeliveryGuideInput | undefined): Json | undefined {
  if (input === undefined) return undefined;

  const guide: Json = { ...(input.preserve ?? {}) };

  if (input.evidence !== undefined) {
    guide.evidencia = compact({
      modalidades: input.evidence.modalities,
      obligatoria: input.evidence.required,
      minimo_artefactos: input.evidence.minimumArtifacts,
      notas: input.evidence.notes,
    });
  }

  if (input.rubric !== undefined) {
    guide.rubrica = compact({
      titulo: input.rubric.title,
      criterios: input.rubric.criteria.map((criterion) =>
        compact({
          codigo: criterion.code,
          titulo: criterion.title,
          descripcion: criterion.description,
        }),
      ),
    });
  }

  return guide;
}

export function toContent(input: ContentInput | null | undefined): Json | null | undefined {
  if (input === undefined) return undefined;
  if (input === null) return null;

  return compact({
    summary: input.summary,
    blocks: input.blocks.map((block) =>
      compact({
        type: block.type,
        title: block.title,
        text: block.text,
        items: block.items,
        itemsKey: block.itemsKey,
        extras: block.extras,
      }),
    ),
  });
}

export function toCompletionRule(input: CompletionInput | undefined): Json | undefined {
  if (input === undefined) return undefined;

  return compact({
    modo: input.mode,
    puntaje_minimo: input.passingScore,
    revision_humana: input.humanReviewRequired,
  });
}

export function toExperienceRequest(input: ExperienceToolInput): ExperienceInput {
  return compact({
    id_unidad: input.unitId,
    tipo: input.type,
    variante: input.variant,
    titulo: input.title,
    descripcion: input.description,
    origen_tipo: input.sourceType,
    origen_id: input.sourceId,
    orden: input.order,
    obligatoria: input.required,
    permite_intentos: input.attemptable,
    max_intentos: input.maxAttempts,
    regla_completitud: toCompletionRule(input.completion),
    guia_entrega: toDeliveryGuide(input.deliveryGuide),
    contenido: toContent(input.content),
    objetivos: input.objectiveIds,
  }) as ExperienceInput;
}

export function toMilestoneRequest(input: MilestoneToolInput): MilestoneInput {
  return compact({
    titulo: input.title,
    descripcion: input.description,
    orden: input.order,
    obligatorio: input.required,
  }) as MilestoneInput;
}
