#!/usr/bin/env node
/**
 * DAEMON Course MCP — end-to-end acceptance harness.
 *
 * Drives the real MCP server over stdio, with a real MCP client, against a live
 * DAEMON Authoring API. Nothing here talks to the database and nothing here
 * re-implements a domain rule: every assertion is about what the canonical API
 * actually did.
 *
 * Two scenarios:
 *   A. IA: Origen integration benchmark — read the published reference course,
 *      draft a V2 from it, author into the draft, validate, and prove V1 never
 *      moved and V2 was never published.
 *   B. New course from zero — prove the tool set is sufficient to author a
 *      complete draft without cloning anything.
 *
 * Usage:
 *   DAEMON_API_BASE_URL=... DAEMON_MCP_TOKEN=... node scripts/acceptance.mjs
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverEntry = path.join(here, '..', 'dist', 'index.js');

const results = [];
let failures = 0;

function check(label, condition, detail = '') {
  const ok = Boolean(condition);
  if (!ok) failures += 1;
  results.push({ label, ok, detail });
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail && !ok ? ` — ${detail}` : ''}\n`);
  return ok;
}

function section(title) {
  process.stdout.write(`\n--- ${title} ---\n`);
}

/** Call a tool and require success; returns the parsed canonical payload. */
async function call(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content?.[0]?.text ?? '{}';
  const payload = JSON.parse(text);

  if (result.isError) {
    throw new Error(`${name} failed: ${JSON.stringify(payload)}`);
  }
  return payload;
}

/** Call a tool expecting the canonical API to refuse it; returns the error. */
async function callExpectingError(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  const rawText = result.content?.[0]?.text ?? '{}';
  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch {
    payload = { error: { message: rawText } };
  }

  if (!result.isError) {
    throw new Error(`${name} was expected to fail but succeeded: ${JSON.stringify(payload).slice(0, 300)}`);
  }
  return payload.error ?? payload;
}

async function main() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    env: {
      ...process.env,
      DAEMON_API_BASE_URL: process.env.DAEMON_API_BASE_URL,
      DAEMON_MCP_TOKEN: process.env.DAEMON_MCP_TOKEN,
      DAEMON_MCP_LOG: process.env.DAEMON_MCP_LOG ?? 'info',
    },
    stderr: 'pipe',
  });

  const client = new Client({ name: 'daemon-course-mcp-acceptance', version: '1.0.0' });
  await client.connect(transport);

  const logLines = [];
  transport.stderr?.on('data', (chunk) => logLines.push(String(chunk)));

  try {
    /* ================================================================ */
    section('Tool surface');
    /* ================================================================ */
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);

    check('server advertises the V1 tool set', names.length >= 20, `got ${names.length}`);
    check('no publish_course_version tool exists', !names.includes('publish_course_version'));
    check('no tool mentions publishing at all', !names.some((name) => /publish|unpublish|archive/i.test(name)));
    check(
      'every tool publishes an object input schema',
      tools.every((tool) => tool.inputSchema?.type === 'object'),
    );

    /* ================================================================ */
    section('get_authoring_catalog');
    /* ================================================================ */
    const catalog = await call(client, 'get_authoring_catalog');

    check('catalog returns canonical experience types', catalog.experienceTypes?.includes('proyecto'));
    check('catalog returns audiences and difficulties', catalog.audiences?.includes('TEENS') && catalog.difficulties?.includes('inicial'));
    check('catalog returns evidence modalities', catalog.evidenceModalities?.includes('external_link'));
    check('catalog returns authoring constraints', typeof catalog.authoringConstraints?.titleMaxLength === 'number');
    check('catalog states that publication needs a human', catalog.publication?.humanReviewRequired === true);
    check('catalog exposes institution objectives', Array.isArray(catalog.objectives) && catalog.objectives.length > 0);

    // The actor never guesses an institution id: the catalog reports its own.
    const institutionId = catalog.actor?.institutionId;
    check('catalog reports the authoring actor institution', typeof institutionId === 'number', String(institutionId));

    /* ================================================================ */
    section('IA: Origen — read');
    /* ================================================================ */
    const listing = await call(client, 'list_courses');
    const origen = listing.courses?.find((course) => course.code === 'IA-ORIGEN-TEENS');

    check('list_courses finds IA: Origen', Boolean(origen));
    const courseDetail = await call(client, 'get_course', { courseId: origen.id });
    check('get_course returns the course with its versions', courseDetail.course?.id === origen.id);

    const v1Summary = courseDetail.course.versions.find((version) => version.title === 'IA_ORIGEN_TEENS_2026_V1');
    check('IA_ORIGEN_TEENS_2026_V1 is published', v1Summary?.status === 'published');

    const v1 = await call(client, 'get_course_version', { versionId: v1Summary.id });
    check('get_course_version returns the full authoring tree', v1.paths?.[0]?.milestones?.length === 6);
    check('V1 has 18 experiences', v1.paths[0].milestones.flatMap((m) => m.experiences).length === 18);
    check('V1 reports itself as not editable', v1.editable === false);

    const v1Fingerprint = JSON.stringify({
      title: v1.version.title,
      status: v1.version.status,
      milestones: v1.paths[0].milestones.map((m) => ({
        id: m.id,
        title: m.title,
        prerequisiteIds: m.prerequisiteIds,
        experiences: m.experiences.map((e) => ({ id: e.id, title: e.title, type: e.type, evidence: e.evidence })),
      })),
    });

    /* ================================================================ */
    section('IA: Origen — published immutability is enforced server-side');
    /* ================================================================ */
    const immutable = await callExpectingError(client, 'update_draft_metadata', {
      versionId: v1Summary.id,
      title: 'IA_ORIGEN_TEENS_2026_V1_MUTADA',
      audience: 'TEENS',
      difficulty: 'inicial',
    });
    check('mutating V1 metadata is refused', immutable.code === 'PUBLISHED_VERSION_IMMUTABLE', JSON.stringify(immutable));
    check('the refusal carries the canonical 409', immutable.status === 409, String(immutable.status));

    const immutableMilestone = await callExpectingError(client, 'update_milestone', {
      milestoneId: v1.paths[0].milestones[0].id,
      title: 'Hito reescrito',
    });
    check('mutating a V1 milestone is refused', immutableMilestone.code === 'PUBLISHED_VERSION_IMMUTABLE');

    const immutableExperience = await callExpectingError(client, 'delete_experience', {
      experienceId: v1.paths[0].milestones[0].experiences[0].id,
    });
    check('deleting a V1 experience is refused', immutableExperience.code === 'PUBLISHED_VERSION_IMMUTABLE');

    /* ================================================================ */
    section('IA: Origen — draft V2');
    /* ================================================================ */
    const v2 = await call(client, 'create_draft_version', {
      versionId: v1Summary.id,
      title: 'IA_ORIGEN_TEENS_2026_V2_MCP_BENCHMARK',
      description: 'Draft authored through the DAEMON Course MCP integration benchmark.',
    });

    check('draft V2 is created in DRAFT', v2.version?.status === 'draft', v2.version?.status);
    check('draft V2 is editable', v2.editable === true);
    check('draft V2 records V1 as its origin', v2.version.clonedFromVersionId === v1Summary.id);
    check('draft V2 inherited the 6 milestones', v2.paths?.[0]?.milestones?.length === 6);
    check('draft V2 inherited the 18 experiences', v2.paths[0].milestones.flatMap((m) => m.experiences).length === 18);
    check(
      'draft V2 inherited the prerequisite chain',
      v2.paths[0].milestones.filter((m) => m.prerequisiteIds.length > 0).length === 5,
    );
    check('draft V2 ids are distinct from V1', v2.paths[0].milestones[0].id !== v1.paths[0].milestones[0].id);

    /* ================================================================ */
    section('IA: Origen — MCP writes into the draft');
    /* ================================================================ */
    const targetMilestone = v2.paths[0].milestones[0];
    const targetExperience = targetMilestone.experiences[0];

    await call(client, 'update_experience', {
      experienceId: targetExperience.id,
      description: 'Revisada a través del DAEMON Course MCP durante el benchmark de integración.',
      deliveryGuide: {
        preserve: targetExperience.deliveryGuide ?? {},
        evidence: {
          modalities: ['text', 'pdf'],
          required: true,
          minimumArtifacts: 1,
          notes: 'Entrega un informe breve con tu razonamiento.',
        },
        rubric: {
          title: 'Rúbrica de verificación',
          criteria: [
            { code: 'C1', title: 'Distingue reglas de aprendizaje', description: 'Explica la diferencia con un ejemplo propio.' },
            { code: 'C2', title: 'Justifica con evidencia', description: 'Apoya la afirmación en una fuente verificable.' },
          ],
        },
      },
    });

    const newObjective = await call(client, 'create_objective', {
      institutionId,
      code: `AI-MCP-${Date.now().toString().slice(-6)}`,
      description: 'Documenta el razonamiento humano detrás de una decisión asistida por IA.',
      framework: 'DAEMON_ARC',
      level: 'TEENS',
    });
    check('create_objective returns a canonical objective', typeof newObjective.id === 'number');

    const existingObjectiveIds = targetExperience.objectiveIds ?? [];
    await call(client, 'link_experience_objectives', {
      experienceId: targetExperience.id,
      objectiveIds: [...new Set([...existingObjectiveIds, newObjective.id])],
    });

    const newMilestone = await call(client, 'create_milestone', {
      pathId: v2.paths[0].id,
      title: 'Hito de cierre escrito por MCP',
      description: 'Añadido por el benchmark de integración del DAEMON Course MCP.',
      order: 7,
      required: true,
    });
    check('create_milestone returns a canonical milestone', typeof newMilestone.id === 'number');

    await call(client, 'set_milestone_prerequisites', {
      milestoneId: newMilestone.id,
      prerequisiteIds: [v2.paths[0].milestones[5].id],
    });

    const newExperience = await call(client, 'create_experience', {
      milestoneId: newMilestone.id,
      type: 'proyecto',
      title: 'Defensa final asistida por IA',
      description: 'Diseña, prueba y defiende una solución asistida por IA.',
      order: 1,
      required: true,
      completion: { mode: 'manual_review' },
      deliveryGuide: {
        evidence: { modalities: ['pdf', 'external_link'], required: true, minimumArtifacts: 2 },
        rubric: { title: 'Defensa', criteria: [{ code: 'D1', title: 'Trazabilidad de decisiones humanas' }] },
      },
      content: {
        summary: 'Cierre del recorrido.',
        blocks: [{ type: 'instrucciones', title: 'Qué entregar', items: ['Informe', 'Enlace al prototipo'], itemsKey: 'pasos' }],
      },
      objectiveIds: [newObjective.id],
    });
    check('create_experience returns a canonical experience', typeof newExperience.id === 'number');

    const cycle = await callExpectingError(client, 'set_milestone_prerequisites', {
      milestoneId: v2.paths[0].milestones[0].id,
      prerequisiteIds: [newMilestone.id],
    });
    check('a prerequisite cycle is refused by the backend', cycle.code === 'DEPENDENCY_CYCLE', JSON.stringify(cycle));

    const badType = await callExpectingError(client, 'create_experience', {
      milestoneId: newMilestone.id,
      type: 'quiz',
      title: 'Tipo inexistente',
      order: 2,
    });
    check('an invalid experience type is refused', ['VALIDATION_FAILED', 'CONFLICT'].includes(badType.code) || badType.code === undefined, JSON.stringify(badType));

    /* ================================================================ */
    section('IA: Origen — validate and read back');
    /* ================================================================ */
    const validation = await call(client, 'validate_course_version', { versionId: v2.version.id });
    check('validate_course_version returns a readiness report', typeof validation.ready === 'boolean');
    check('the draft has no blocking errors', validation.errors?.length === 0, JSON.stringify(validation.errors));
    check('the draft reports itself ready for human review', validation.ready === true);

    const v2Read = await call(client, 'get_course_version', { versionId: v2.version.id });
    const editedExperience = v2Read.paths[0].milestones
      .flatMap((milestone) => milestone.experiences)
      .find((experience) => experience.id === targetExperience.id);

    check('Course Studio reads the MCP-configured evidence', JSON.stringify(editedExperience.evidence.modalities) === JSON.stringify(['text', 'pdf']));
    check('evidence is marked required with a minimum artifact', editedExperience.evidence.required === true && editedExperience.evidence.minimumArtifacts === 1);
    check('Course Studio reads the MCP-authored rubric', editedExperience.rubric?.criteria?.length === 2);
    check('the objective link written by MCP is visible', editedExperience.objectiveIds.includes(newObjective.id));
    check(
      'pedagogical delivery-guide keys authored before MCP survived the edit',
      Object.keys(targetExperience.deliveryGuide ?? {})
        .filter((key) => key !== 'evidencia' && key !== 'rubrica')
        .every((key) => key in (editedExperience.deliveryGuide ?? {})),
    );

    const addedMilestone = v2Read.paths[0].milestones.find((milestone) => milestone.id === newMilestone.id);
    check('the MCP milestone is visible with its prerequisite', addedMilestone?.prerequisiteIds?.length === 1);
    check('the MCP experience is visible inside it', addedMilestone?.experiences?.[0]?.id === newExperience.id);
    check('the MCP experience keeps its structured content', addedMilestone.experiences[0].content?.blocks?.length === 1);
    check('the MCP experience is not published', addedMilestone.experiences[0].status === 'draft');

    check('draft V2 never became published', v2Read.version.status === 'draft');

    /* ================================================================ */
    section('IA: Origen — V1 is untouched');
    /* ================================================================ */
    const v1After = await call(client, 'get_course_version', { versionId: v1Summary.id });
    const v1FingerprintAfter = JSON.stringify({
      title: v1After.version.title,
      status: v1After.version.status,
      milestones: v1After.paths[0].milestones.map((m) => ({
        id: m.id,
        title: m.title,
        prerequisiteIds: m.prerequisiteIds,
        experiences: m.experiences.map((e) => ({ id: e.id, title: e.title, type: e.type, evidence: e.evidence })),
      })),
    });

    check('V1 is byte-for-byte unchanged after the whole benchmark', v1Fingerprint === v1FingerprintAfter);
    check('V1 is still published', v1After.version.status === 'published');

    /* ================================================================ */
    section('New course from zero');
    /* ================================================================ */
    const stamp = Date.now().toString().slice(-8);
    const newCourse = await call(client, 'create_course', {
      institutionId,
      title: `Programming Teens Test ${stamp}`,
      code: `PROG-TEENS-TEST-${stamp}`,
      description: 'Non-production test course authored end to end through the DAEMON Course MCP.',
      audience: 'TEENS',
    });
    check('create_course returns a course shell', typeof newCourse.id === 'number');

    const newVersion = await call(client, 'create_course_version', {
      courseId: newCourse.id,
      title: `PROG_TEENS_TEST_${stamp}_V1`,
      description: 'Primera versión en borrador.',
      audience: 'TEENS',
      difficulty: 'inicial',
    });
    check('create_course_version returns a DRAFT version', newVersion.estado === 'draft' || newVersion.status === 'draft');
    const newVersionId = newVersion.id;

    const unit = await call(client, 'create_unit', {
      versionId: newVersionId,
      title: 'Unidad 1: Pensar como programador',
      description: 'Descomposición de problemas y secuencias.',
      order: 1,
    });
    const lesson = await call(client, 'create_lesson', {
      unitId: unit.id,
      title: 'Descomponer un problema',
      summary: 'De un problema grande a pasos verificables.',
      durationMinutes: 25,
      order: 1,
    });
    check('create_unit and create_lesson build the curricular spine', typeof unit.id === 'number' && typeof lesson.id === 'number');

    const objectiveA = await call(client, 'create_objective', {
      institutionId,
      code: `PROG-${stamp}-01`,
      description: 'Descompone un problema en pasos verificables.',
      framework: 'DAEMON_ARC',
      level: 'TEENS',
    });
    const objectiveB = await call(client, 'create_objective', {
      institutionId,
      code: `PROG-${stamp}-02`,
      description: 'Depura un programa razonando sobre su estado.',
      framework: 'DAEMON_ARC',
      level: 'TEENS',
    });
    check('objectives are created for the new course', typeof objectiveA.id === 'number' && typeof objectiveB.id === 'number');

    const newPath = await call(client, 'create_learning_path', {
      versionId: newVersionId,
      title: 'Ruta troncal Programming Teens Test',
      description: 'Ruta de prueba del benchmark MCP.',
      audience: 'TEENS',
      difficulty: 'inicial',
    });

    const milestoneOne = await call(client, 'create_milestone', {
      pathId: newPath.id,
      title: 'Hito 1: Descomponer',
      order: 1,
      required: true,
    });
    const milestoneTwo = await call(client, 'create_milestone', {
      pathId: newPath.id,
      title: 'Hito 2: Depurar',
      order: 2,
      required: true,
    });
    await call(client, 'set_milestone_prerequisites', {
      milestoneId: milestoneTwo.id,
      prerequisiteIds: [milestoneOne.id],
    });
    check('milestones and dependencies are authored', typeof milestoneOne.id === 'number' && typeof milestoneTwo.id === 'number');

    const experienceOne = await call(client, 'create_experience', {
      milestoneId: milestoneOne.id,
      type: 'leccion',
      title: 'Leer y descomponer',
      order: 1,
      required: true,
      unitId: unit.id,
      sourceType: 'leccion',
      sourceId: lesson.id,
      completion: { mode: 'lesson_completion' },
      objectiveIds: [objectiveA.id],
    });
    const experienceTwo = await call(client, 'create_experience', {
      milestoneId: milestoneTwo.id,
      type: 'practica',
      title: 'Depurar un programa roto',
      description: 'Encuentra y explica tres errores.',
      order: 1,
      required: true,
      completion: { mode: 'manual_review' },
      deliveryGuide: {
        evidence: { modalities: ['text', 'image'], required: true, minimumArtifacts: 1, notes: 'Adjunta una captura del error.' },
        rubric: { title: 'Depuración', criteria: [{ code: 'C1', title: 'Explica la causa, no sólo el síntoma' }] },
      },
      content: { summary: 'Práctica guiada.', blocks: [{ type: 'instrucciones', text: 'Ejecuta, observa, corrige.' }] },
      objectiveIds: [objectiveB.id],
    });
    check('experiences with evidence configuration are authored', typeof experienceOne.id === 'number' && typeof experienceTwo.id === 'number');

    const newValidation = await call(client, 'validate_course_version', { versionId: newVersionId });
    check('the new draft validates with no blocking errors', newValidation.errors?.length === 0, JSON.stringify(newValidation.errors));
    check('the new draft reports ready for human review', newValidation.ready === true);

    const newRead = await call(client, 'get_course_version', { versionId: newVersionId });
    check('Course Studio reads the new draft', newRead.version.id === newVersionId);
    check('the new draft stays in DRAFT', newRead.version.status === 'draft');
    check('the new draft evidence is readable by Course Studio', newRead.paths[0].milestones[1].experiences[0].evidence.modalities.length === 2);
    check('the new draft dependency is readable', newRead.paths[0].milestones[1].prerequisiteIds.length === 1);

    /* ================================================================ */
    section('Observability');
    /* ================================================================ */
    const stderr = logLines.join('');
    check('operations are logged with a tool name and request id', /"event":"tool\.call"/.test(stderr));
    check('the log never contains the bearer token', !stderr.includes(process.env.DAEMON_MCP_TOKEN ?? '@@none@@'));
    check('the log records durations', /"durationMs":\d+/.test(stderr));

    /* ================================================================ */
    section('Result');
    /* ================================================================ */
    process.stdout.write(`\n${results.filter((r) => r.ok).length}/${results.length} checks passed\n`);
    if (failures > 0) {
      process.stdout.write('\nFailed checks:\n');
      for (const result of results.filter((r) => !r.ok)) {
        process.stdout.write(`  - ${result.label}${result.detail ? ` (${result.detail})` : ''}\n`);
      }
    }
  } finally {
    await client.close().catch(() => {});
  }

  process.exit(failures > 0 ? 1 : 0);
}

main().catch((error) => {
  process.stderr.write(`\nAcceptance harness crashed: ${error?.stack ?? error}\n`);
  process.exit(1);
});
