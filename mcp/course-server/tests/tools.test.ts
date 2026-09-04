import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { FORBIDDEN_TOOL_NAMES, buildTools } from '../src/tools.js';
import { toContent, toDeliveryGuide, toExperienceRequest, toMilestoneRequest } from '../src/mapping.js';

const tools = buildTools();
const byName = new Map(tools.map((tool) => [tool.name, tool]));

describe('V1 tool set', () => {
  it('exposes the canonical read, draft, authoring and validation tools', () => {
    expect([...byName.keys()].sort()).toEqual(
      [
        'create_course',
        'create_course_version',
        'create_draft_version',
        'create_experience',
        'create_learning_path',
        'create_lesson',
        'create_milestone',
        'create_objective',
        'create_unit',
        'delete_experience',
        'delete_milestone',
        'get_authoring_catalog',
        'get_course',
        'get_course_version',
        'link_experience_objectives',
        'list_courses',
        'set_milestone_prerequisites',
        'update_draft_metadata',
        'update_experience',
        'update_milestone',
        'update_objective',
        'validate_course_version',
      ].sort(),
    );
  });

  it('exposes no publication, unpublication or version-deletion tool', () => {
    for (const forbidden of FORBIDDEN_TOOL_NAMES) {
      expect(byName.has(forbidden)).toBe(false);
    }
    expect(tools.some((tool) => /publish|publicar|unpublish|archive/i.test(tool.name))).toBe(false);
  });

  it('marks read tools as read-only and deletions as destructive', () => {
    for (const name of ['list_courses', 'get_course', 'get_course_version', 'get_authoring_catalog', 'validate_course_version']) {
      expect(byName.get(name)?.annotations.readOnlyHint, name).toBe(true);
    }
    for (const name of ['delete_milestone', 'delete_experience']) {
      expect(byName.get(name)?.annotations.destructiveHint, name).toBe(true);
    }
  });

  it('gives every tool a description that tells an AI what it may and may not do', () => {
    for (const tool of tools) {
      expect(tool.description.length, tool.name).toBeGreaterThan(40);
      expect(tool.title.length, tool.name).toBeGreaterThan(0);
    }
  });

  it('describes experiences with real domain concepts, not a generic JSON blob', () => {
    const shape = byName.get('create_experience')?.inputSchema ?? {};

    expect(Object.keys(shape).sort()).toEqual(
      [
        'attemptable',
        'completion',
        'content',
        'deliveryGuide',
        'description',
        'maxAttempts',
        'milestoneId',
        'objectiveIds',
        'order',
        'required',
        'sourceId',
        'sourceType',
        'title',
        'type',
        'unitId',
        'variant',
      ].sort(),
    );
  });

  it('constrains experience type and audience to the canonical vocabulary', () => {
    const type = byName.get('create_experience')?.inputSchema.type as z.ZodTypeAny;
    expect(type.safeParse('leccion').success).toBe(true);
    expect(type.safeParse('quiz').success).toBe(false);

    const audience = byName.get('create_learning_path')?.inputSchema.audience as z.ZodTypeAny;
    expect(audience.safeParse('TEENS').success).toBe(true);
    expect(audience.safeParse('ADULTS').success).toBe(false);
  });

  it('rejects an out-of-range order and a non-positive id before a request is made', () => {
    const order = byName.get('create_milestone')?.inputSchema.order as z.ZodTypeAny;
    expect(order.safeParse(0).success).toBe(false);
    expect(order.safeParse(1000).success).toBe(false);
    expect(order.safeParse(1).success).toBe(true);

    const pathId = byName.get('create_milestone')?.inputSchema.pathId as z.ZodTypeAny;
    expect(pathId.safeParse(-1).success).toBe(false);
    expect(pathId.safeParse(1.5).success).toBe(false);
  });

  it('constrains evidence modalities to the Evidence & Artifact System vocabulary', () => {
    const guide = byName.get('create_experience')?.inputSchema.deliveryGuide as z.ZodTypeAny;

    expect(guide.safeParse({ evidence: { modalities: ['pdf', 'external_link'] } }).success).toBe(true);
    expect(guide.safeParse({ evidence: { modalities: ['video'] } }).success).toBe(false);
    expect(guide.safeParse({ evidence: { modalities: ['pdf'], minimumArtifacts: 99 } }).success).toBe(false);
  });
});

describe('domain naming normalisation', () => {
  it('maps the English tool surface onto the canonical request contract', () => {
    expect(
      toExperienceRequest({
        type: 'proyecto',
        title: 'Capstone',
        description: 'Defiende tu solución.',
        order: 3,
        required: true,
        attemptable: false,
        maxAttempts: 2,
        unitId: 7,
        variant: 'boss',
        sourceType: 'leccion',
        sourceId: 11,
        objectiveIds: [1, 2],
        completion: { mode: 'manual_review', passingScore: 70, humanReviewRequired: true },
      }),
    ).toEqual({
      tipo: 'proyecto',
      titulo: 'Capstone',
      descripcion: 'Defiende tu solución.',
      orden: 3,
      obligatoria: true,
      permite_intentos: false,
      max_intentos: 2,
      id_unidad: 7,
      variante: 'boss',
      origen_tipo: 'leccion',
      origen_id: 11,
      objetivos: [1, 2],
      regla_completitud: { modo: 'manual_review', puntaje_minimo: 70, revision_humana: true },
    });
  });

  it('omits what the caller omitted so partial updates stay partial', () => {
    expect(toExperienceRequest({ title: 'Sólo el título' })).toEqual({ titulo: 'Sólo el título' });
    expect(toMilestoneRequest({ required: false })).toEqual({ obligatorio: false });
  });

  it('keeps an explicit null, which the API reads as "clear this field"', () => {
    expect(toExperienceRequest({ description: null, content: null })).toEqual({ descripcion: null, contenido: null });
  });

  it('writes evidence and rubric into the canonical delivery guide keys', () => {
    expect(
      toDeliveryGuide({
        evidence: { modalities: ['pdf', 'text'], required: true, minimumArtifacts: 1, notes: 'Sube tu informe.' },
        rubric: { title: 'Rúbrica', criteria: [{ code: 'C1', title: 'Claridad', description: 'Se entiende.' }] },
      }),
    ).toEqual({
      evidencia: { modalidades: ['pdf', 'text'], obligatoria: true, minimo_artefactos: 1, notas: 'Sube tu informe.' },
      rubrica: { titulo: 'Rúbrica', criterios: [{ codigo: 'C1', titulo: 'Claridad', descripcion: 'Se entiende.' }] },
    });
  });

  it('preserves pedagogical keys the caller passed back, so an edit does not erase authored guidance', () => {
    expect(
      toDeliveryGuide({
        preserve: { objetivo_practico: 'Analiza un caso real.', rubrica_referencia: ['Claridad'] },
        evidence: { modalities: ['text'] },
      }),
    ).toEqual({
      objetivo_practico: 'Analiza un caso real.',
      rubrica_referencia: ['Claridad'],
      evidencia: { modalidades: ['text'] },
    });
  });

  it('passes structured content through in the canonical block form, including legacy list keys', () => {
    expect(
      toContent({
        summary: 'Resumen',
        blocks: [{ type: 'flujo', items: ['1. Datos', '2. Modelo'], itemsKey: 'pasos', extras: { fuente: 'v1' } }],
      }),
    ).toEqual({
      summary: 'Resumen',
      blocks: [{ type: 'flujo', items: ['1. Datos', '2. Modelo'], itemsKey: 'pasos', extras: { fuente: 'v1' } }],
    });
  });
});
