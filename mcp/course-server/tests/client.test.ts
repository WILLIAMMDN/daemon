import { describe, expect, it } from 'vitest';
import { DaemonAuthoringClient } from '../src/api/client.js';
import { loadConfig } from '../src/config.js';

interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

function harness(responder: (call: RecordedCall) => { status: number; body: unknown }) {
  const calls: RecordedCall[] = [];

  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = Object.fromEntries(
      Object.entries((init?.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]),
    );
    const call: RecordedCall = {
      url: String(input),
      method: init?.method ?? 'GET',
      headers,
      body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
    };
    calls.push(call);

    const { status, body } = responder(call);
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  const config = loadConfig({
    DAEMON_API_BASE_URL: 'http://127.0.0.1:8000/api/v1',
    DAEMON_MCP_TOKEN: 'secret-token-value',
    DAEMON_MCP_LOG: 'silent',
  } as NodeJS.ProcessEnv);

  return { calls, client: new DaemonAuthoringClient(config, fetchImpl) };
}

const ok = () => ({ status: 200, body: { ok: true } });

describe('DaemonAuthoringClient', () => {
  it('sends the bearer token on every call and never as a query parameter', async () => {
    const { calls, client } = harness(ok);
    await client.listCourses();

    expect(calls[0]?.headers.authorization).toBe('Bearer secret-token-value');
    expect(calls[0]?.url).not.toContain('secret-token-value');
  });

  it('reads the canonical Course Studio surface, the same one Angular uses', async () => {
    const { calls, client } = harness(ok);

    await client.catalog();
    await client.listCourses();
    await client.course(4);
    await client.courseVersion(9);
    await client.validateVersion(9);

    expect(calls.map((call) => `${call.method} ${call.url.replace('http://127.0.0.1:8000/api/v1', '')}`)).toEqual([
      'GET /academico/studio/catalogo',
      'GET /academico/studio/cursos',
      'GET /academico/studio/cursos/4',
      'GET /academico/studio/versiones/9',
      'GET /academico/studio/versiones/9/validacion',
    ]);
  });

  it('creates a draft through the canonical versioning endpoint', async () => {
    const { calls, client } = harness(() => ({ status: 201, body: { version: { id: 12 } } }));
    await client.createDraftFromVersion(9, { titulo: 'IA_ORIGEN_TEENS_2026_V2' });

    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.url).toContain('/academico/studio/versiones/9/borrador');
    expect(calls[0]?.body).toEqual({ titulo: 'IA_ORIGEN_TEENS_2026_V2' });
  });

  it('writes milestones, prerequisites, experiences and objective links to the Learning Core contracts', async () => {
    const { calls, client } = harness(ok);

    await client.createMilestone(3, { titulo: 'Hito', orden: 1 });
    await client.setMilestonePrerequisites(5, [3, 4]);
    await client.createExperience(5, { tipo: 'practica', titulo: 'Práctica', orden: 1 });
    await client.linkExperienceObjectives(8, [1, 2]);
    await client.deleteExperience(8);

    expect(calls.map((call) => `${call.method} ${call.url.replace('http://127.0.0.1:8000/api/v1', '')}`)).toEqual([
      'POST /academico/rutas/3/hitos',
      'PUT /academico/hitos/5/prerrequisitos',
      'POST /academico/hitos/5/experiencias',
      'PUT /academico/experiencias/8/objetivos',
      'DELETE /academico/experiencias/8',
    ]);
    expect(calls[1]?.body).toEqual({ prerrequisitos: [3, 4] });
    expect(calls[3]?.body).toEqual({ objetivos: [1, 2] });
  });

  it('never calls a publication endpoint', async () => {
    const { calls, client } = harness(ok);

    await client.listCourses();
    await client.courseVersion(9);
    await client.validateVersion(9);

    expect(calls.some((call) => /publicar|publicacion|archivar/.test(call.url))).toBe(false);
  });

  it('translates an API rejection into the canonical error model', async () => {
    const { client } = harness(() => ({
      status: 409,
      body: { message: 'Solo se puede modificar una versión de curso en borrador.' },
    }));

    await expect(client.updateVersionMetadata(1, { audiencia: 'TEENS', etapa: 'inicial' })).rejects.toMatchObject({
      code: 'PUBLISHED_VERSION_IMMUTABLE',
      status: 409,
    });
  });

  it('reports the authenticated actor without echoing the token', async () => {
    const { client } = harness(() => ({
      status: 200,
      body: { id: 3, rol: 'docente', id_institucion: 1, usuario: 'ana-autora', email: 'ana@daemon.test' },
    }));

    await expect(client.whoami()).resolves.toEqual({
      id: 3,
      role: 'docente',
      institutionId: 1,
      reference: 'ana-autora',
    });
  });
});

describe('configuration', () => {
  const base = { DAEMON_API_BASE_URL: 'http://127.0.0.1:8000/api/v1', DAEMON_MCP_TOKEN: 't' } as NodeJS.ProcessEnv;

  it('requires a base URL', () => {
    expect(() => loadConfig({ DAEMON_MCP_TOKEN: 't' } as NodeJS.ProcessEnv)).toThrow(/DAEMON_API_BASE_URL/);
  });

  it('requires a token and says how to issue one', () => {
    expect(() => loadConfig({ DAEMON_API_BASE_URL: base.DAEMON_API_BASE_URL } as NodeJS.ProcessEnv)).toThrow(
      /autoria:token emitir/,
    );
  });

  it('rejects a non-http base URL', () => {
    expect(() => loadConfig({ ...base, DAEMON_API_BASE_URL: 'file:///etc/passwd' } as NodeJS.ProcessEnv)).toThrow(
      /http\(s\)/,
    );
  });

  it('never hardcodes production as the only target', () => {
    expect(loadConfig({ ...base, DAEMON_API_BASE_URL: 'https://daemon-5vo1.onrender.com/api/v1' }).baseUrl).toBe(
      'https://daemon-5vo1.onrender.com/api/v1',
    );
    expect(loadConfig(base).baseUrl).toBe('http://127.0.0.1:8000/api/v1');
  });
});
