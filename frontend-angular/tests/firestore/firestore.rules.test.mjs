import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..', '..', '..');
const projectId = process.env.FIREBASE_PROJECT_ID ?? 'demo-daemon-rules';
const emulatorAddress = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const [emulatorHost, emulatorPortText] = emulatorAddress.split(':');
const emulatorPort = Number(emulatorPortText);

const OWNER_UID = 'student-owner';
const OTHER_UID = 'student-other';
const TEACHER_UID = 'teacher-one';
const ADMIN_UID = 'admin-one';

const studentClaims = Object.freeze({
  daemon: true,
  daemonRole: 'estudiante',
  daemonAudience: 'KIDS',
  daemonClaimsVersion: 1,
});

const teenClaims = Object.freeze({
  ...studentClaims,
  daemonAudience: 'TEENS',
});

const teacherClaims = Object.freeze({
  daemon: true,
  daemonRole: 'docente',
  daemonClaimsVersion: 1,
});

const adminClaims = Object.freeze({
  daemon: true,
  daemonRole: 'admin',
  daemonClaimsVersion: 1,
});

let testEnv;

function dbFor(uid, claims) {
  return testEnv.authenticatedContext(uid, claims).firestore();
}

function ownerDb() {
  return dbFor(OWNER_UID, studentClaims);
}

function otherDb() {
  return dbFor(OTHER_UID, teenClaims);
}

function draftStoryPayload(uid = OWNER_UID, overrides = {}) {
  return {
    schema_version: 2,
    autor_uid: uid,
    audiencia: 'KIDS',
    estado: 'borrador',
    visibilidad: 'privado',
    version_borrador_id: 'draft-v1',
    moderacion_estado: 'no_solicitada',
    comentarios_bloqueados: true,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    ...overrides,
  };
}

function storedDraftStory(uid = OWNER_UID, overrides = {}) {
  const now = Timestamp.fromMillis(1_800_000_000_000);
  return {
    schema_version: 2,
    autor_uid: uid,
    audiencia: 'KIDS',
    estado: 'borrador',
    visibilidad: 'privado',
    version_borrador_id: 'draft-v1',
    moderacion_estado: 'no_solicitada',
    comentarios_bloqueados: true,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function storedPublishedStory(overrides = {}) {
  const now = Timestamp.fromMillis(1_800_000_000_000);
  return {
    schema_version: 2,
    autor_uid: OWNER_UID,
    audiencia: 'KIDS',
    estado: 'publicado',
    visibilidad: 'comunidad',
    version_borrador_id: 'draft-v2',
    version_publicada_id: 'published-v1',
    moderacion_estado: 'aprobado',
    titulo_publicado: 'El bosque seguro',
    sinopsis_publicada: 'Una historia de prueba.',
    portada_ref: null,
    stats: { comentarios: 1, reacciones: 0, lecturas: 0 },
    comentarios_bloqueados: false,
    created_at: now,
    updated_at: now,
    submitted_at: now,
    published_at: now,
    deleted_at: null,
    ...overrides,
  };
}

function draftVersionPayload(uid = OWNER_UID, overrides = {}) {
  return {
    schema_version: 2,
    autor_uid: uid,
    estado: 'borrador',
    titulo: '',
    sinopsis: '',
    categoria: '',
    rango_edad: '9 - 12 años',
    portada_ref: null,
    paginas: 1,
    idioma: 'es',
    palabras: 0,
    tiempo_lectura: 0,
    revision: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    ...overrides,
  };
}

function storedVersion(uid = OWNER_UID, overrides = {}) {
  const now = Timestamp.fromMillis(1_800_000_000_000);
  return {
    schema_version: 2,
    autor_uid: uid,
    estado: 'borrador',
    titulo: 'Borrador',
    sinopsis: '',
    categoria: 'aventura',
    rango_edad: '9 - 12 años',
    portada_ref: null,
    paginas: 1,
    idioma: 'es',
    palabras: 2,
    tiempo_lectura: 1,
    revision: 0,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function pagePayload(uid = OWNER_UID, overrides = {}) {
  return {
    schema_version: 2,
    autor_uid: uid,
    orden: 1,
    contenido: 'Había una vez.',
    ilustracion_ref: null,
    texto_alternativo: '',
    fondo_token: 'var(--daemon-on-primary)',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    ...overrides,
  };
}

function storedComment(overrides = {}) {
  const now = Timestamp.fromMillis(1_800_000_000_000);
  return {
    schema_version: 2,
    autor_uid: OTHER_UID,
    cuerpo: 'Una historia excelente.',
    estado: 'visible',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function reactionPayload(uid, type = 'encanto', overrides = {}) {
  return {
    schema_version: 2,
    usuario_uid: uid,
    tipo: type,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    ...overrides,
  };
}

async function seedDocument(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

async function seedDraft(storyId = 'draft-story') {
  await seedDocument(`cuentos/${storyId}`, storedDraftStory());
}

async function seedPublished(storyId = 'published-story', overrides = {}) {
  await seedDocument(`cuentos/${storyId}`, storedPublishedStory(overrides));
  await seedDocument(
    `cuentos/${storyId}/versiones/published-v1`,
    storedVersion(OWNER_UID, { estado: 'borrador', titulo: 'Versión publicada' }),
  );
}

async function exportRuleCoverage() {
  const coverageUrl = `http://${emulatorAddress}/emulator/v1/projects/${projectId}:ruleCoverage`;
  const response = await fetch(coverageUrl);
  if (!response.ok) {
    throw new Error(`No se pudo obtener cobertura de reglas: HTTP ${response.status}`);
  }

  const coverage = await response.json();
  const summary = summarizeRuleCoverage(coverage);
  const reportDirectory = resolve(projectRoot, 'frontend-angular', 'reports', 'firestore-rules');
  await mkdir(reportDirectory, { recursive: true });
  await writeFile(
    resolve(reportDirectory, 'rule-coverage.json'),
    `${JSON.stringify(coverage, null, 2)}\n`,
    'utf8',
  );
  await writeFile(
    resolve(reportDirectory, 'rule-coverage-summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8',
  );
  process.stdout.write(
    `Cobertura de expresiones Rules: ${summary.evaluatedExpressions}/${summary.totalExpressions} (${summary.expressionCoveragePercent}%)\n`,
  );
}

function summarizeRuleCoverage(coverage) {
  const summary = {
    projectId,
    totalExpressions: 0,
    evaluatedExpressions: 0,
    expressionCoveragePercent: 0,
    trueEvaluations: 0,
    falseEvaluations: 0,
  };

  function visit(expression) {
    summary.totalExpressions += 1;
    const values = expression.values ?? [];
    const evaluationCount = values.reduce((total, entry) => total + Number(entry.count ?? 0), 0);
    if (evaluationCount > 0) summary.evaluatedExpressions += 1;

    for (const entry of values) {
      const count = Number(entry.count ?? 0);
      if (entry.value?.boolValue === true) summary.trueEvaluations += count;
      if (entry.value?.boolValue === false) summary.falseEvaluations += count;
    }

    for (const child of expression.children ?? []) visit(child);
  }

  for (const expression of coverage.report ?? []) visit(expression);
  summary.expressionCoveragePercent = Number(
    ((summary.evaluatedExpressions / summary.totalExpressions) * 100).toFixed(2),
  );
  return summary;
}

before(async () => {
  assert.ok(Number.isInteger(emulatorPort) && emulatorPort > 0, 'Puerto de emulador inválido');
  const rules = await readFile(resolve(projectRoot, 'firestore.rules'), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: emulatorHost,
      port: emulatorPort,
      rules,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await exportRuleCoverage();
  await testEnv.cleanup();
});

test('usuario no autenticado no puede leer ni crear cuentos', async () => {
  await seedPublished();
  const anonymousDb = testEnv.unauthenticatedContext().firestore();

  await assertFails(getDoc(doc(anonymousDb, 'cuentos/published-story')));
  await assertFails(setDoc(doc(anonymousDb, 'cuentos/new-story'), draftStoryPayload()));
});

test('estudiante propietario crea una raíz de borrador mínima y válida', async () => {
  await assertSucceeds(setDoc(doc(ownerDb(), 'cuentos/new-story'), draftStoryPayload()));
});

test('raíz y versión inicial pueden crearse atómicamente en un batch', async () => {
  const db = ownerDb();
  const batch = writeBatch(db);
  batch.set(doc(db, 'cuentos/batched-story'), draftStoryPayload());
  batch.set(doc(db, 'cuentos/batched-story/versiones/draft-v1'), draftVersionPayload());

  await assertSucceeds(batch.commit());
  await assertSucceeds(getDoc(doc(db, 'cuentos/batched-story/versiones/draft-v1')));
});

test('creación rechaza campos extra, privilegios y authorUid alternativo', async () => {
  const db = ownerDb();

  await assertFails(setDoc(doc(db, 'cuentos/extra'), draftStoryPayload(OWNER_UID, { xp: 500 })));
  await assertFails(
    setDoc(doc(db, 'cuentos/role'), draftStoryPayload(OWNER_UID, { daemonRole: 'admin' })),
  );
  await assertFails(
    setDoc(
      doc(db, 'cuentos/english-owner'),
      draftStoryPayload(OWNER_UID, { authorUid: OWNER_UID }),
    ),
  );
});

test('creación rechaza autor UID, audiencia, estado y visibilidad manipulados', async () => {
  const db = ownerDb();

  await assertFails(setDoc(doc(db, 'cuentos/wrong-owner'), draftStoryPayload(OTHER_UID)));
  await assertFails(
    setDoc(doc(db, 'cuentos/wrong-audience'), draftStoryPayload(OWNER_UID, { audiencia: 'TEENS' })),
  );
  await assertFails(
    setDoc(doc(db, 'cuentos/published'), draftStoryPayload(OWNER_UID, { estado: 'publicado' })),
  );
  await assertFails(
    setDoc(doc(db, 'cuentos/public'), draftStoryPayload(OWNER_UID, { visibilidad: 'comunidad' })),
  );
});

test('creación rechaza tipos, enums, longitudes y timestamps no confiables', async () => {
  const db = ownerDb();
  const oldTimestamp = Timestamp.fromMillis(1_700_000_000_000);

  await assertFails(
    setDoc(doc(db, 'cuentos/schema-string'), draftStoryPayload(OWNER_UID, { schema_version: '2' })),
  );
  await assertFails(
    setDoc(doc(db, 'cuentos/bad-status'), draftStoryPayload(OWNER_UID, { estado: 'aprobado' })),
  );
  await assertFails(
    setDoc(
      doc(db, 'cuentos/long-version'),
      draftStoryPayload(OWNER_UID, { version_borrador_id: 'x'.repeat(129) }),
    ),
  );
  await assertFails(
    setDoc(
      doc(db, 'cuentos/client-clock'),
      draftStoryPayload(OWNER_UID, { created_at: oldTimestamp }),
    ),
  );
});

test('docente y administrador no crean borradores en nombre de estudiantes', async () => {
  await assertFails(
    setDoc(
      doc(dbFor(TEACHER_UID, teacherClaims), 'cuentos/teacher-story'),
      draftStoryPayload(TEACHER_UID),
    ),
  );
  await assertFails(
    setDoc(doc(dbFor(ADMIN_UID, adminClaims), 'cuentos/admin-story'), draftStoryPayload(ADMIN_UID)),
  );
});

test('propietario lee su borrador y otro estudiante, docente y admin no', async () => {
  await seedDraft();

  await assertSucceeds(getDoc(doc(ownerDb(), 'cuentos/draft-story')));
  await assertFails(getDoc(doc(otherDb(), 'cuentos/draft-story')));
  await assertFails(getDoc(doc(dbFor(TEACHER_UID, teacherClaims), 'cuentos/draft-story')));
  await assertFails(getDoc(doc(dbFor(ADMIN_UID, adminClaims), 'cuentos/draft-story')));
});

test('cuenta con claims ausentes u obsoletos no lee contenido publicado', async () => {
  await seedPublished();
  const staleDb = dbFor('stale-user', { daemon: true, daemonRole: 'estudiante' });

  await assertFails(getDoc(doc(staleDb, 'cuentos/published-story')));
});

test('estudiante, docente y administrador leen cuento comunitario publicado y aprobado', async () => {
  await seedPublished();

  await assertSucceeds(getDoc(doc(otherDb(), 'cuentos/published-story')));
  await assertSucceeds(getDoc(doc(dbFor(TEACHER_UID, teacherClaims), 'cuentos/published-story')));
  await assertSucceeds(getDoc(doc(dbFor(ADMIN_UID, adminClaims), 'cuentos/published-story')));
});

test('cuento de aula sólo es legible con el aula proyectada coincidente', async () => {
  await seedPublished('classroom-story', { visibilidad: 'aula', aula_id: 'class-a' });
  const matchingDb = dbFor(OTHER_UID, { ...teenClaims, daemonClassroomId: 'class-a' });
  const differentDb = dbFor('different-class', { ...teenClaims, daemonClassroomId: 'class-b' });

  await assertSucceeds(getDoc(doc(matchingDb, 'cuentos/classroom-story')));
  await assertFails(getDoc(doc(differentDb, 'cuentos/classroom-story')));
  await assertFails(getDoc(doc(otherDb(), 'cuentos/classroom-story')));
});

test('lectura pública falla cerrada si moderación o versión publicada no son válidas', async () => {
  await seedPublished('pending-story', { moderacion_estado: 'pendiente' });
  await seedPublished('missing-version-story', { version_publicada_id: null });

  await assertFails(getDoc(doc(otherDb(), 'cuentos/pending-story')));
  await assertFails(getDoc(doc(otherDb(), 'cuentos/missing-version-story')));
});

test('propietario sólo actualiza updated_at en raíz de borrador', async () => {
  await seedDraft();

  await assertSucceeds(
    updateDoc(doc(ownerDb(), 'cuentos/draft-story'), { updated_at: serverTimestamp() }),
  );
  await assertFails(
    updateDoc(doc(ownerDb(), 'cuentos/draft-story'), {
      estado: 'publicado',
      updated_at: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(ownerDb(), 'cuentos/draft-story'), {
      visibilidad: 'comunidad',
      updated_at: serverTimestamp(),
    }),
  );
});

test('campos inmutables, moderación, stats y ownership no cambian desde cliente', async () => {
  await seedDraft();
  const ref = doc(ownerDb(), 'cuentos/draft-story');

  await assertFails(updateDoc(ref, { autor_uid: OTHER_UID, updated_at: serverTimestamp() }));
  await assertFails(updateDoc(ref, { schema_version: 3, updated_at: serverTimestamp() }));
  await assertFails(
    updateDoc(ref, { moderacion_estado: 'aprobado', updated_at: serverTimestamp() }),
  );
  await assertFails(updateDoc(ref, { stats: { reacciones: 999 }, updated_at: serverTimestamp() }));
});

test('estudiante diferente no actualiza borrador ajeno', async () => {
  await seedDraft();

  await assertFails(
    updateDoc(doc(otherDb(), 'cuentos/draft-story'), { updated_at: serverTimestamp() }),
  );
});

test('borrado directo del cuento se deniega a propietario, docente y admin', async () => {
  await seedDraft();

  await assertFails(deleteDoc(doc(ownerDb(), 'cuentos/draft-story')));
  await assertFails(deleteDoc(doc(dbFor(TEACHER_UID, teacherClaims), 'cuentos/draft-story')));
  await assertFails(deleteDoc(doc(dbFor(ADMIN_UID, adminClaims), 'cuentos/draft-story')));
});

test('propietario crea y edita su versión de borrador con campos permitidos', async () => {
  await seedDraft();
  const versionRef = doc(ownerDb(), 'cuentos/draft-story/versiones/draft-v1');

  await assertSucceeds(setDoc(versionRef, draftVersionPayload()));
  await assertSucceeds(
    updateDoc(versionRef, { titulo: 'Un nuevo título', revision: 1, updated_at: serverTimestamp() }),
  );
});

test('versión rechaza autor ajeno, estado privilegiado, campo extra y texto excesivo', async () => {
  await seedDraft();
  const db = ownerDb();

  await assertFails(
    setDoc(doc(db, 'cuentos/draft-story/versiones/draft-v1'), draftVersionPayload(OTHER_UID)),
  );
  await assertFails(
    setDoc(
      doc(db, 'cuentos/draft-story/versiones/draft-v1'),
      draftVersionPayload(OWNER_UID, { estado: 'publicado' }),
    ),
  );
  await assertFails(
    setDoc(
      doc(db, 'cuentos/draft-story/versiones/draft-v1'),
      draftVersionPayload(OWNER_UID, { extra: true }),
    ),
  );
  await assertFails(
    setDoc(
      doc(db, 'cuentos/draft-story/versiones/draft-v1'),
      draftVersionPayload(OWNER_UID, { titulo: 'x'.repeat(121) }),
    ),
  );
});

test('estudiante diferente no crea ni edita la versión ajena', async () => {
  await seedDraft();
  await seedDocument('cuentos/draft-story/versiones/draft-v1', storedVersion());

  await assertFails(
    setDoc(
      doc(otherDb(), 'cuentos/draft-story/versiones/draft-v1'),
      draftVersionPayload(OTHER_UID),
    ),
  );
  await assertFails(
    updateDoc(doc(otherDb(), 'cuentos/draft-story/versiones/draft-v1'), {
      titulo: 'Intrusión',
      revision: 1,
      updated_at: serverTimestamp(),
    }),
  );
});

test('lector publicado sólo accede a la versión publicada, no al borrador', async () => {
  await seedPublished();
  await seedDocument('cuentos/published-story/versiones/draft-v2', storedVersion());

  await assertSucceeds(getDoc(doc(otherDb(), 'cuentos/published-story/versiones/published-v1')));
  await assertFails(getDoc(doc(otherDb(), 'cuentos/published-story/versiones/draft-v2')));
});

test('propietario crea, actualiza y elimina páginas sólo dentro de su borrador editable', async () => {
  await seedDraft();
  await seedDocument('cuentos/draft-story/versiones/draft-v1', storedVersion());
  const pageRef = doc(ownerDb(), 'cuentos/draft-story/versiones/draft-v1/paginas/page-1');

  await assertSucceeds(setDoc(pageRef, pagePayload()));
  await assertSucceeds(
    updateDoc(pageRef, { contenido: 'Contenido editado.', updated_at: serverTimestamp() }),
  );
  await assertSucceeds(deleteDoc(pageRef));
});

test('página rechaza edición ajena, orden fuera de rango y contenido excesivo', async () => {
  await seedDraft();
  await seedDocument('cuentos/draft-story/versiones/draft-v1', storedVersion());
  const ownerRef = doc(ownerDb(), 'cuentos/draft-story/versiones/draft-v1/paginas/page-1');

  await assertFails(setDoc(ownerRef, pagePayload(OWNER_UID, { orden: 101 })));
  await assertFails(setDoc(ownerRef, pagePayload(OWNER_UID, { contenido: 'x'.repeat(20001) })));
  await seedDocument('cuentos/draft-story/versiones/draft-v1/paginas/page-1', {
    ...pagePayload(),
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });
  await assertFails(deleteDoc(doc(otherDb(), ownerRef.path)));
});

test('comentarios directos válidos, vacíos y excesivos son server-only', async () => {
  await seedPublished();
  const comments = collection(otherDb(), 'cuentos/published-story/comentarios');

  await assertFails(setDoc(doc(comments, 'valid'), storedComment()));
  await assertFails(setDoc(doc(comments, 'empty'), storedComment({ cuerpo: '' })));
  await assertFails(setDoc(doc(comments, 'long'), storedComment({ cuerpo: 'x'.repeat(1001) })));
  await seedDocument('cuentos/published-story/comentarios/existing', storedComment());
  await assertFails(updateDoc(doc(comments, 'existing'), { cuerpo: 'Edición directa' }));
  await assertFails(deleteDoc(doc(comments, 'existing')));
});

test('comentario visible se lee con consulta paginada; oculto y consulta sin límite se deniegan', async () => {
  await seedPublished();
  await seedDocument('cuentos/published-story/comentarios/visible', storedComment());
  await seedDocument(
    'cuentos/published-story/comentarios/hidden',
    storedComment({ estado: 'oculto' }),
  );
  const comments = collection(otherDb(), 'cuentos/published-story/comentarios');
  const paginated = query(
    comments,
    where('schema_version', '==', 2),
    where('estado', '==', 'visible'),
    orderBy('created_at', 'asc'),
    limit(20),
  );

  await assertSucceeds(getDoc(doc(comments, 'visible')));
  await assertFails(getDoc(doc(comments, 'hidden')));
  await assertSucceeds(getDocs(paginated));
  await assertFails(
    getDocs(query(comments, where('schema_version', '==', 2), where('estado', '==', 'visible'))),
  );
});

test('bloqueo de comentarios en el cuento impide su lectura directa', async () => {
  await seedPublished('blocked-comments', { comentarios_bloqueados: true });
  await seedDocument('cuentos/blocked-comments/comentarios/visible', storedComment());

  await assertFails(getDoc(doc(otherDb(), 'cuentos/blocked-comments/comentarios/visible')));
});

test('reacciones se procesan solo por Laravel y no exponen UIDs al cliente', async () => {
  await seedPublished();
  const db = otherDb();
  const reactionRef = doc(db, `cuentos/published-story/reacciones/${OTHER_UID}`);

  await assertFails(setDoc(reactionRef, reactionPayload(OTHER_UID)));
  await seedDocument(`cuentos/published-story/reacciones/${OTHER_UID}`, {
    ...reactionPayload(OTHER_UID),
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });
  await assertFails(getDoc(reactionRef));
  await assertFails(
    setDoc(reactionRef, { tipo: 'gusto', updated_at: serverTimestamp() }, { merge: true }),
  );
  await assertFails(
    getDocs(query(collection(db, 'cuentos/published-story/reacciones'), limit(100))),
  );
});

test('reacción rechaza tipo, campos extra, UID de datos y doc ID ajenos', async () => {
  await seedPublished();
  const db = otherDb();

  await assertFails(
    setDoc(
      doc(db, `cuentos/published-story/reacciones/${OTHER_UID}`),
      reactionPayload(OTHER_UID, 'me_enfada'),
    ),
  );
  await assertFails(
    setDoc(doc(db, `cuentos/published-story/reacciones/${OTHER_UID}`), reactionPayload(OWNER_UID)),
  );
  await assertFails(
    setDoc(doc(db, `cuentos/published-story/reacciones/${OWNER_UID}`), reactionPayload(OTHER_UID)),
  );
  await assertFails(
    setDoc(
      doc(db, `cuentos/published-story/reacciones/${OTHER_UID}`),
      reactionPayload(OTHER_UID, 'encanto', { reacciones_count: 999 }),
    ),
  );
});

test('eliminación de reacción propia o ajena está reservada al servidor', async () => {
  await seedPublished();
  await seedDocument(`cuentos/published-story/reacciones/${OTHER_UID}`, {
    ...reactionPayload(OTHER_UID),
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });

  await assertFails(deleteDoc(doc(ownerDb(), `cuentos/published-story/reacciones/${OTHER_UID}`)));
  await assertFails(
    deleteDoc(doc(otherDb(), `cuentos/published-story/reacciones/${OTHER_UID}`)),
  );
});

test('queries de galería y borradores requieren filtros compatibles y límite', async () => {
  await seedDraft();
  await seedPublished();
  const db = ownerDb();
  const stories = collection(db, 'cuentos');
  const ownDrafts = query(
    stories,
    where('schema_version', '==', 2),
    where('autor_uid', '==', OWNER_UID),
    where('estado', '==', 'borrador'),
    orderBy('updated_at', 'desc'),
    limit(20),
  );
  const publishedCommunity = query(
    stories,
    where('schema_version', '==', 2),
    where('estado', '==', 'publicado'),
    where('visibilidad', '==', 'comunidad'),
    where('moderacion_estado', '==', 'aprobado'),
    orderBy('updated_at', 'desc'),
    limit(20),
  );

  await assertSucceeds(getDocs(ownDrafts));
  await assertSucceeds(getDocs(publishedCommunity));
  await assertFails(getDocs(query(stories, orderBy('updated_at', 'desc'), limit(20))));
  await assertFails(getDocs(stories));
});

test('colecciones legacy y paths no declarados quedan denegados', async () => {
  await seedDocument('cuento_comentarios/legacy-comment', { contenido: 'legacy' });
  await seedDocument('cuento_reacciones/legacy-reaction', { tipo: 'gusto' });
  await seedDocument('usuarios/private-user', { rol: 'admin', xp: 999 });

  await assertFails(getDoc(doc(ownerDb(), 'cuento_comentarios/legacy-comment')));
  await assertFails(setDoc(doc(ownerDb(), 'cuento_reacciones/new-reaction'), { tipo: 'gusto' }));
  await assertFails(getDoc(doc(ownerDb(), 'usuarios/private-user')));
});

test('documento legacy sin schema_version no obtiene acceso implícito', async () => {
  await seedDocument('cuentos/legacy-story', {
    firebase_uid: OWNER_UID,
    id_alumno: '7',
    titulo: 'Legado',
    fecha_creacion: '2026-01-01T00:00:00Z',
  });

  await assertFails(getDoc(doc(ownerDb(), 'cuentos/legacy-story')));
});
