import { z } from 'zod';

/**
 * Structured input schemas expressed in DAEMON's own domain vocabulary.
 *
 * There is no generic "payload" blob and no raw database field anywhere in the
 * tool surface: an MCP client declares experiences, milestones, evidence and
 * rubrics, and this layer maps them onto the canonical Authoring API request
 * contract. The server still validates everything; these schemas exist so a
 * client fails fast and legibly, not so it can skip the backend.
 */

export const EXPERIENCE_TYPES = [
  'leccion',
  'practica',
  'mision',
  'laboratorio',
  'evaluacion',
  'proyecto',
  'desafio',
] as const;

export const AUDIENCES = ['KIDS', 'TEENS', 'TODOS'] as const;
export const DIFFICULTIES = ['inicial', 'intermedia', 'avanzada'] as const;
export const EVIDENCE_MODALITIES = ['text', 'structured', 'image', 'pdf', 'external_link'] as const;
export const COMPLETION_MODES = ['manual_review', 'passing_score', 'submission', 'lesson_completion'] as const;
export const SOURCE_TYPES = [
  'leccion',
  'mision',
  'evaluacion',
  'proyecto',
  'laboratorio',
  'practica',
  'desafio',
] as const;

export const evidenceConfigurationSchema = z
  .object({
    modalities: z
      .array(z.enum(EVIDENCE_MODALITIES))
      .max(5)
      .describe('Canonical evidence modalities this experience accepts.'),
    required: z.boolean().optional().describe('Whether evidence is mandatory to complete the experience.'),
    minimumArtifacts: z
      .number()
      .int()
      .min(0)
      .max(10)
      .optional()
      .describe('Minimum number of attached artifacts (0-10).'),
    notes: z.string().max(2000).optional().describe('Delivery instructions shown to the learner.'),
  })
  .describe('Canonical evidence configuration (Evidence & Artifact System V1).');

export const rubricSchema = z
  .object({
    title: z.string().max(150).optional(),
    criteria: z
      .array(
        z.object({
          code: z.string().max(40).optional().describe('Stable criterion code, e.g. "C1".'),
          title: z.string().min(1).max(150),
          description: z.string().max(2000).optional(),
        }),
      )
      .max(20)
      .describe('Human qualitative rubric criteria. Formative, never auto-scored.'),
  })
  .describe('Human qualitative rubric attached to the experience delivery guide.');

export const deliveryGuideSchema = z
  .object({
    preserve: z
      .record(z.unknown())
      .optional()
      .describe(
        'The experience deliveryGuide exactly as returned by get_course_version. ' +
          'Pass it back when updating evidence or rubric so pedagogical keys authored earlier survive: ' +
          'the API replaces the whole column, it does not merge inside it.',
      ),
    evidence: evidenceConfigurationSchema.optional(),
    rubric: rubricSchema.optional(),
  })
  .describe('Evidence configuration and rubric, written into the canonical delivery guide.');

export const contentBlockSchema = z.object({
  type: z.string().max(40).describe('Block type, e.g. concepto, ejemplo, instrucciones, pasos, pregunta.'),
  title: z.string().max(200).optional(),
  text: z.string().optional(),
  items: z.array(z.string()).optional().describe('Ordered list items belonging to this block.'),
  itemsKey: z
    .string()
    .optional()
    .describe('Original list key of a legacy block (pasos, campos, preguntas...). Preserve it on round-trip.'),
  extras: z.record(z.unknown()).optional().describe('Legacy block keys to preserve verbatim.'),
});

export const contentSchema = z
  .object({
    summary: z.string().optional(),
    blocks: z.array(contentBlockSchema).max(60),
  })
  .describe('Structured pedagogical content, in the canonical Learning Core block form.');

export const completionSchema = z
  .object({
    mode: z.enum(COMPLETION_MODES).optional(),
    passingScore: z.number().min(0).max(100).optional(),
    humanReviewRequired: z
      .boolean()
      .optional()
      .describe('Explicit override. Omit to let the Learning Core derive it from the experience type.'),
  })
  .describe('Completion rule of the experience.');

/** Positive integer identifier of a canonical domain entity. */
export const idSchema = z.number().int().positive();
