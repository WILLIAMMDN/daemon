import { z } from 'zod';
import type { DaemonAuthoringClient } from './api/client.js';
import {
  AUDIENCES,
  DIFFICULTIES,
  EXPERIENCE_TYPES,
  SOURCE_TYPES,
  completionSchema,
  contentSchema,
  deliveryGuideSchema,
  idSchema,
} from './schemas.js';
import { toExperienceRequest, toMilestoneRequest } from './mapping.js';
import type { ExperienceToolInput, MilestoneToolInput } from './mapping.js';

/**
 * The DAEMON Course MCP tool set, V1.
 *
 * Every tool is a thin, typed call into the canonical Authoring API — the same
 * surface Course Studio uses. There is deliberately no publish tool: this
 * server holds course:read and course:write, and the server-side scope check
 * refuses publication even if a client tried to reach it another way.
 */

export interface ToolContext {
  readonly client: DaemonAuthoringClient;
}

export interface ToolDefinition {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: z.ZodRawShape;
  readonly annotations: {
    readonly readOnlyHint?: boolean;
    readonly destructiveHint?: boolean;
    readonly idempotentHint?: boolean;
    readonly openWorldHint?: boolean;
  };
  /** Human-readable target of the call, for the structured operation log. */
  readonly target?: (args: Record<string, unknown>) => string | undefined;
  readonly handler: (args: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
}

const versionId = idSchema.describe('Course version id.');
const courseId = idSchema.describe('Course id.');

const metadataShape = {
  title: z.string().max(150).optional().describe('Version title, e.g. IA_ORIGEN_TEENS_2026_V2.'),
  description: z.string().max(5000).optional(),
  audience: z.enum(AUDIENCES).describe('Who the version is for. Independent of difficulty.'),
  difficulty: z.enum(DIFFICULTIES).describe('Learning stage. Independent of audience.'),
};

const experienceShape = {
  unitId: idSchema.nullable().optional().describe('Curricular unit of the same course version, if any.'),
  variant: z.literal('boss').nullable().optional().describe('Marks a milestone-closing boss experience.'),
  description: z.string().max(5000).nullable().optional(),
  sourceType: z.enum(SOURCE_TYPES).nullable().optional().describe('Existing Learning Core entity this experience wraps.'),
  sourceId: idSchema.nullable().optional().describe('Id of the source entity. Required together with sourceType.'),
  required: z.boolean().optional().describe('Whether the experience is mandatory inside its milestone.'),
  attemptable: z.boolean().optional(),
  maxAttempts: z.number().int().min(1).max(100).nullable().optional(),
  completion: completionSchema.optional(),
  deliveryGuide: deliveryGuideSchema.optional(),
  content: contentSchema.nullable().optional(),
  objectiveIds: z.array(idSchema).max(50).optional().describe('Learning objectives this experience serves.'),
};

export function buildTools(): ToolDefinition[] {
  return [
    /* ---------------------------------------------------------------- */
    /* Read                                                              */
    /* ---------------------------------------------------------------- */
    {
      name: 'get_authoring_catalog',
      title: 'Authoring catalog',
      description:
        'Canonical vocabulary and limits DAEMON permits when authoring: experience types, audiences, difficulty ' +
        'stages, evidence modalities, completion modes, content block types, field constraints, the token scope ' +
        'model, the authenticated actor with its institutionId, and the objectives available to it. ' +
        'Read this before writing anything.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: (_args, { client }) => client.catalog(),
    },
    {
      name: 'list_courses',
      title: 'List courses',
      description:
        'Courses this authoring actor can operate, each with its versions and which one is published or draft.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: (_args, { client }) => client.listCourses(),
    },
    {
      name: 'get_course',
      title: 'Get course',
      description: 'One course with the detail of every version, including publication state.',
      inputSchema: { courseId },
      annotations: { readOnlyHint: true, openWorldHint: true },
      target: (args) => `course:${args.courseId}`,
      handler: (args, { client }) => client.course(args.courseId as number),
    },
    {
      name: 'get_course_version',
      title: 'Get course version',
      description:
        'Full authoring tree of a version: metadata, units, lessons, learning paths, milestones with their ' +
        'prerequisites, experiences with evidence configuration, rubric, structured content and objectives, plus ' +
        'the current publication-readiness report. `editable` is false for published versions.',
      inputSchema: { versionId },
      annotations: { readOnlyHint: true, openWorldHint: true },
      target: (args) => `version:${args.versionId}`,
      handler: (args, { client }) => client.courseVersion(args.versionId as number),
    },

    /* ---------------------------------------------------------------- */
    /* Draft versions                                                    */
    /* ---------------------------------------------------------------- */
    {
      name: 'create_draft_version',
      title: 'Create draft version',
      description:
        'Clone an existing course version into a new DRAFT using the canonical versioning mechanism. The source ' +
        'version is never modified: units, lessons, paths, milestones, experiences, objective links and ' +
        'prerequisites are copied into the new draft. Metadata is inherited unless overridden here.',
      inputSchema: {
        versionId: versionId.describe('Source version to clone. May be published; it stays untouched.'),
        title: z.string().max(150).optional(),
        description: z.string().max(5000).optional(),
        audience: z.enum(AUDIENCES).optional(),
        difficulty: z.enum(DIFFICULTIES).optional(),
      },
      annotations: { openWorldHint: true },
      target: (args) => `version:${args.versionId}`,
      handler: (args, { client }) =>
        client.createDraftFromVersion(args.versionId as number, {
          ...(args.title === undefined ? {} : { titulo: args.title as string }),
          ...(args.description === undefined ? {} : { descripcion: args.description as string }),
          ...(args.audience === undefined ? {} : { audiencia: args.audience as string }),
          ...(args.difficulty === undefined ? {} : { etapa: args.difficulty as string }),
        }),
    },
    {
      name: 'update_draft_metadata',
      title: 'Update draft metadata',
      description:
        'Update the metadata of a DRAFT version. A published version is immutable and the API rejects this with ' +
        'PUBLISHED_VERSION_IMMUTABLE.',
      inputSchema: { versionId, ...metadataShape },
      annotations: { idempotentHint: true, openWorldHint: true },
      target: (args) => `version:${args.versionId}`,
      handler: (args, { client }) =>
        client.updateVersionMetadata(args.versionId as number, {
          ...(args.title === undefined ? {} : { titulo: args.title as string }),
          ...(args.description === undefined ? {} : { descripcion: args.description as string }),
          audiencia: args.audience as string,
          etapa: args.difficulty as string,
        }),
    },

    /* ---------------------------------------------------------------- */
    /* New course authoring path                                         */
    /* ---------------------------------------------------------------- */
    {
      name: 'create_course',
      title: 'Create course',
      description:
        'Create the course shell a first version hangs from. Only needed when authoring a brand new course; to ' +
        'evolve an existing one use create_draft_version instead. The course itself carries no curriculum.',
      inputSchema: {
        institutionId: idSchema.describe('Institution that owns the course. Read it from get_authoring_catalog.actor.institutionId.'),
        title: z.string().min(1).max(150),
        code: z.string().max(60).optional().describe('Stable course code, unique within the institution.'),
        description: z.string().max(5000).optional(),
        audience: z.enum(AUDIENCES).optional(),
      },
      annotations: { openWorldHint: true },
      target: (args) => `institution:${args.institutionId}`,
      handler: (args, { client }) =>
        client.createCourse({
          id_institucion: args.institutionId as number,
          titulo: args.title as string,
          ...(args.code === undefined ? {} : { codigo: args.code as string }),
          ...(args.description === undefined ? {} : { descripcion: args.description as string }),
          ...(args.audience === undefined ? {} : { nivel: args.audience as string }),
        }),
    },
    {
      name: 'create_course_version',
      title: 'Create course version',
      description:
        'Create the first DRAFT version of a course that has none. Use create_draft_version whenever a version ' +
        'already exists, so the new draft inherits its tree.',
      inputSchema: { courseId, ...metadataShape },
      annotations: { openWorldHint: true },
      target: (args) => `course:${args.courseId}`,
      handler: (args, { client }) =>
        client.createVersion(args.courseId as number, {
          ...(args.title === undefined ? {} : { titulo: args.title as string }),
          ...(args.description === undefined ? {} : { descripcion: args.description as string }),
          audiencia: args.audience as string,
          etapa: args.difficulty as string,
        }),
    },
    {
      name: 'create_unit',
      title: 'Create curricular unit',
      description: 'Add a curricular unit to a DRAFT version. A version needs at least one unit to be publishable.',
      inputSchema: {
        versionId,
        title: z.string().min(1).max(150),
        description: z.string().max(5000).optional(),
        order: z.number().int().min(1).max(999),
      },
      annotations: { openWorldHint: true },
      target: (args) => `version:${args.versionId}`,
      handler: (args, { client }) =>
        client.createUnit(args.versionId as number, {
          titulo: args.title as string,
          ...(args.description === undefined ? {} : { descripcion: args.description as string }),
          orden: args.order as number,
        }),
    },
    {
      name: 'create_lesson',
      title: 'Create lesson',
      description:
        'Add a lesson to a curricular unit. A version needs at least one lesson to be publishable, and a lesson is ' +
        'what an experience of type "leccion" can point at through sourceType/sourceId.',
      inputSchema: {
        unitId: idSchema.describe('Curricular unit id.'),
        title: z.string().min(1).max(150),
        summary: z.string().max(5000).optional(),
        durationMinutes: z.number().int().min(1).max(600).optional(),
        order: z.number().int().min(1).max(999),
        objectiveIds: z.array(idSchema).max(50).optional(),
      },
      annotations: { openWorldHint: true },
      target: (args) => `unit:${args.unitId}`,
      handler: (args, { client }) =>
        client.createLesson(args.unitId as number, {
          titulo: args.title as string,
          ...(args.summary === undefined ? {} : { resumen: args.summary as string }),
          ...(args.durationMinutes === undefined ? {} : { duracion_minutos: args.durationMinutes as number }),
          orden: args.order as number,
          ...(args.objectiveIds === undefined ? {} : { objetivos: args.objectiveIds as number[] }),
        }),
    },
    {
      name: 'create_learning_path',
      title: 'Create learning path',
      description:
        'Create the learning path of a DRAFT version. Milestones and experiences hang from a path, so a brand new ' +
        'version needs one before any milestone can be created. A cloned draft already has its path.',
      inputSchema: {
        versionId,
        title: z.string().min(1).max(150),
        description: z.string().max(5000).optional(),
        audience: z.enum(AUDIENCES),
        difficulty: z.enum(DIFFICULTIES),
      },
      annotations: { openWorldHint: true },
      target: (args) => `version:${args.versionId}`,
      handler: (args, { client }) =>
        client.createPath(args.versionId as number, {
          titulo: args.title as string,
          ...(args.description === undefined ? {} : { descripcion: args.description as string }),
          audiencia: args.audience as string,
          etapa: args.difficulty as string,
        }),
    },

    /* ---------------------------------------------------------------- */
    /* Objectives                                                        */
    /* ---------------------------------------------------------------- */
    {
      name: 'create_objective',
      title: 'Create learning objective',
      description:
        'Create a learning objective for the institution. Objectives are institution-wide and reusable across ' +
        'courses; check get_authoring_catalog first and reuse an existing one when it fits.',
      inputSchema: {
        institutionId: idSchema.describe('Read it from get_authoring_catalog.actor.institutionId.'),
        code: z.string().max(80).optional().describe('Stable objective code, e.g. AI-07.'),
        description: z.string().min(1).max(2000),
        framework: z.string().max(100).optional().describe('Competency framework, e.g. DAEMON_ARC.'),
        level: z.enum(AUDIENCES).optional(),
      },
      annotations: { openWorldHint: true },
      handler: (args, { client }) =>
        client.createObjective({
          id_institucion: args.institutionId as number,
          ...(args.code === undefined ? {} : { codigo: args.code as string }),
          descripcion: args.description as string,
          ...(args.framework === undefined ? {} : { marco: args.framework as string }),
          ...(args.level === undefined ? {} : { nivel: args.level as string }),
        }),
    },
    {
      name: 'update_objective',
      title: 'Update learning objective',
      description: 'Update an existing institution learning objective.',
      inputSchema: {
        objectiveId: idSchema,
        code: z.string().max(80).optional(),
        description: z.string().min(1).max(2000),
        framework: z.string().max(100).optional(),
        level: z.enum(AUDIENCES).optional(),
      },
      annotations: { idempotentHint: true, openWorldHint: true },
      target: (args) => `objective:${args.objectiveId}`,
      handler: (args, { client }) =>
        client.updateObjective(args.objectiveId as number, {
          ...(args.code === undefined ? {} : { codigo: args.code as string }),
          descripcion: args.description as string,
          ...(args.framework === undefined ? {} : { marco: args.framework as string }),
          ...(args.level === undefined ? {} : { nivel: args.level as string }),
        }),
    },

    /* ---------------------------------------------------------------- */
    /* Milestones                                                        */
    /* ---------------------------------------------------------------- */
    {
      name: 'create_milestone',
      title: 'Create milestone',
      description: 'Add a milestone to the learning path of a DRAFT version.',
      inputSchema: {
        pathId: idSchema.describe('Learning path id, from get_course_version.paths[].id.'),
        title: z.string().min(1).max(150),
        description: z.string().max(5000).optional(),
        order: z.number().int().min(1).max(999),
        required: z.boolean().optional().describe('A required milestone needs at least one required experience.'),
      },
      annotations: { openWorldHint: true },
      target: (args) => `path:${args.pathId}`,
      handler: (args, { client }) =>
        client.createMilestone(args.pathId as number, toMilestoneRequest(args as MilestoneToolInput)),
    },
    {
      name: 'update_milestone',
      title: 'Update milestone',
      description: 'Update a milestone of a DRAFT path. Only the fields supplied are changed.',
      inputSchema: {
        milestoneId: idSchema,
        title: z.string().min(1).max(150).optional(),
        description: z.string().max(5000).nullable().optional(),
        order: z.number().int().min(1).max(999).optional(),
        required: z.boolean().optional(),
      },
      annotations: { idempotentHint: true, openWorldHint: true },
      target: (args) => `milestone:${args.milestoneId}`,
      handler: (args, { client }) =>
        client.updateMilestone(args.milestoneId as number, toMilestoneRequest(args as MilestoneToolInput)),
    },
    {
      name: 'delete_milestone',
      title: 'Delete milestone',
      description:
        'Delete a milestone of a DRAFT path together with its experiences, and remove it from every prerequisite ' +
        'link. Irreversible.',
      inputSchema: { milestoneId: idSchema },
      annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: true },
      target: (args) => `milestone:${args.milestoneId}`,
      handler: (args, { client }) => client.deleteMilestone(args.milestoneId as number),
    },
    {
      name: 'set_milestone_prerequisites',
      title: 'Set milestone prerequisites',
      description:
        'Replace the prerequisites of a milestone. Every prerequisite must belong to the same path. The backend ' +
        'rejects self-dependency and any cycle with DEPENDENCY_CYCLE; pass an empty list to clear them.',
      inputSchema: {
        milestoneId: idSchema,
        prerequisiteIds: z.array(idSchema).max(100).describe('Complete replacement set, not a delta.'),
      },
      annotations: { idempotentHint: true, openWorldHint: true },
      target: (args) => `milestone:${args.milestoneId}`,
      handler: (args, { client }) =>
        client.setMilestonePrerequisites(args.milestoneId as number, args.prerequisiteIds as number[]),
    },

    /* ---------------------------------------------------------------- */
    /* Experiences                                                       */
    /* ---------------------------------------------------------------- */
    {
      name: 'create_experience',
      title: 'Create experience',
      description:
        'Add a learning experience to a milestone of a DRAFT path, with its evidence configuration, human rubric, ' +
        'structured content and objective links.',
      inputSchema: {
        milestoneId: idSchema,
        type: z.enum(EXPERIENCE_TYPES).describe('Canonical experience type.'),
        title: z.string().min(1).max(150),
        order: z.number().int().min(1).max(999),
        ...experienceShape,
      },
      annotations: { openWorldHint: true },
      target: (args) => `milestone:${args.milestoneId}`,
      handler: (args, { client }) =>
        client.createExperience(args.milestoneId as number, toExperienceRequest(args as ExperienceToolInput)),
    },
    {
      name: 'update_experience',
      title: 'Update experience',
      description:
        'Update an experience of a DRAFT path. Only the fields supplied are changed. When setting deliveryGuide, ' +
        'pass the existing guide back in deliveryGuide.preserve: the API replaces that column whole.',
      inputSchema: {
        experienceId: idSchema,
        type: z.enum(EXPERIENCE_TYPES).optional(),
        title: z.string().min(1).max(150).optional(),
        order: z.number().int().min(1).max(999).optional(),
        ...experienceShape,
      },
      annotations: { idempotentHint: true, openWorldHint: true },
      target: (args) => `experience:${args.experienceId}`,
      handler: (args, { client }) =>
        client.updateExperience(args.experienceId as number, toExperienceRequest(args as ExperienceToolInput)),
    },
    {
      name: 'delete_experience',
      title: 'Delete experience',
      description: 'Delete an experience of a DRAFT path and its objective links. Irreversible.',
      inputSchema: { experienceId: idSchema },
      annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: true },
      target: (args) => `experience:${args.experienceId}`,
      handler: (args, { client }) => client.deleteExperience(args.experienceId as number),
    },
    {
      name: 'link_experience_objectives',
      title: 'Link experience objectives',
      description:
        'Replace the learning objectives an experience serves. Objectives must belong to the institution that owns ' +
        'the path. Pass an empty list to unlink them all.',
      inputSchema: {
        experienceId: idSchema,
        objectiveIds: z.array(idSchema).max(50).describe('Complete replacement set, not a delta.'),
      },
      annotations: { idempotentHint: true, openWorldHint: true },
      target: (args) => `experience:${args.experienceId}`,
      handler: (args, { client }) =>
        client.linkExperienceObjectives(args.experienceId as number, args.objectiveIds as number[]),
    },

    /* ---------------------------------------------------------------- */
    /* Validation                                                        */
    /* ---------------------------------------------------------------- */
    {
      name: 'validate_course_version',
      title: 'Validate course version',
      description:
        'Publication-readiness report from the backend, which is the authority: blocking errors, warnings and a ' +
        '`ready` flag. A ready draft still requires a human to publish it in Course Studio — this server cannot.',
      inputSchema: { versionId },
      annotations: { readOnlyHint: true, openWorldHint: true },
      target: (args) => `version:${args.versionId}`,
      handler: (args, { client }) => client.validateVersion(args.versionId as number),
    },
  ];
}

/** Tool names this server refuses to expose, asserted by the test suite. */
export const FORBIDDEN_TOOL_NAMES = [
  'publish_course_version',
  'publish_course',
  'unpublish_course_version',
  'archive_course_version',
  'delete_course_version',
] as const;
