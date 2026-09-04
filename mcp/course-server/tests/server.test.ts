import { describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { DaemonAuthoringClient } from '../src/api/client.js';
import { loadConfig } from '../src/config.js';
import { createLogger } from '../src/logging.js';
import { createServer } from '../src/server.js';

interface Stub {
  match: RegExp;
  method?: string;
  status: number;
  body: unknown;
}

const IDENTITY: Stub = {
  match: /\/auth\/yo$/,
  status: 200,
  body: { id: 3, rol: 'docente', id_institucion: 1, usuario: 'ana-autora' },
};

/** Boot the MCP server over an in-memory transport against a stubbed API. */
async function connect(stubs: Stub[], logLines: string[] = []) {
  const requests: { url: string; method: string; body: unknown }[] = [];

  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    requests.push({ url, method, body: init?.body === undefined ? undefined : JSON.parse(String(init.body)) });

    const stub = [IDENTITY, ...stubs].find(
      (candidate) => candidate.match.test(url) && (candidate.method ?? method) === method,
    );

    return new Response(JSON.stringify(stub?.body ?? { message: 'No stub matched.' }), {
      status: stub?.status ?? 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  const config = loadConfig({
    DAEMON_API_BASE_URL: 'http://127.0.0.1:8000/api/v1',
    DAEMON_MCP_TOKEN: 'super-secret-token',
  } as NodeJS.ProcessEnv);

  const server = createServer({
    config,
    logger: createLogger('info', (line) => logLines.push(line)),
    client: new DaemonAuthoringClient(config, fetchImpl),
  });

  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

  return { client, server, requests };
}

describe('DAEMON Course MCP over the MCP protocol', () => {
  it('advertises the V1 tool set and no publication tool', async () => {
    const { client, server } = await connect([]);
    const names = (await client.listTools()).tools.map((tool) => tool.name);

    expect(names).toContain('create_draft_version');
    expect(names).toContain('validate_course_version');
    expect(names).not.toContain('publish_course_version');
    expect(names.some((name) => /publish/i.test(name))).toBe(false);

    await server.close();
  });

  it('publishes a strict input schema for every tool', async () => {
    const { client, server } = await connect([]);

    for (const tool of (await client.listTools()).tools) {
      expect(tool.inputSchema.type, tool.name).toBe('object');
      expect(tool.description, tool.name).toBeTruthy();
    }

    const experience = (await client.listTools()).tools.find((tool) => tool.name === 'create_experience');
    const properties = experience?.inputSchema.properties as Record<string, unknown>;
    expect(Object.keys(properties)).toContain('deliveryGuide');
    expect(experience?.inputSchema.required).toEqual(
      expect.arrayContaining(['milestoneId', 'type', 'title', 'order']),
    );

    await server.close();
  });

  it('returns the canonical read contract from a tool call', async () => {
    const version = {
      course: { id: 1, title: 'IA: Origen' },
      version: { id: 9, number: 1, status: 'published', editable: false },
      editable: false,
      paths: [],
      validation: { versionId: 9, ready: false, errors: [], warnings: [] },
    };
    const { client, server } = await connect([{ match: /\/studio\/versiones\/9$/, status: 200, body: version }]);

    const result = await client.callTool({ name: 'get_course_version', arguments: { versionId: 9 } });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toMatchObject({ editable: false });

    await server.close();
  });

  it('surfaces published immutability as a typed error a client can branch on', async () => {
    const { client, server } = await connect([
      {
        match: /\/academico\/versiones\/9$/,
        method: 'PUT',
        status: 409,
        body: { message: 'Solo se puede modificar una versión de curso en borrador.' },
      },
    ]);

    const result = await client.callTool({
      name: 'update_draft_metadata',
      arguments: { versionId: 9, audience: 'TEENS', difficulty: 'inicial' },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as { text: string }[])[0]?.text ?? '';
    expect(JSON.parse(text).error.code).toBe('PUBLISHED_VERSION_IMMUTABLE');

    await server.close();
  });

  it('rejects an invalid experience type at the protocol boundary, before any request', async () => {
    const { client, server, requests } = await connect([]);

    const result = await client.callTool({
      name: 'create_experience',
      arguments: { milestoneId: 1, type: 'quiz', title: 'Nope', order: 1 },
    });

    expect(result.isError).toBe(true);
    expect(requests.some((request) => request.url.includes('/experiencias'))).toBe(false);

    await server.close();
  });

  it('exposes read-only resources for catalog, course and version', async () => {
    const { client, server } = await connect([]);

    const resources = await client.listResources();
    const templates = await client.listResourceTemplates();

    expect(resources.resources.map((resource) => resource.uri)).toContain('daemon://authoring/catalog');
    expect(templates.resourceTemplates.map((template) => template.uriTemplate)).toEqual(
      expect.arrayContaining(['daemon://course/{courseId}', 'daemon://course-version/{versionId}']),
    );

    await server.close();
  });

  it('logs each operation without ever writing the bearer token', async () => {
    const lines: string[] = [];
    const { client, server } = await connect(
      [{ match: /\/studio\/cursos$/, status: 200, body: { courses: [], generatedAt: 'now' } }],
      lines,
    );

    await client.callTool({ name: 'list_courses', arguments: {} });
    await server.close();

    const operation = lines.map((line) => JSON.parse(line)).find((entry) => entry.event === 'tool.call');
    expect(operation).toMatchObject({ tool: 'list_courses', outcome: 'success', actor: 'ana-autora' });
    expect(operation.requestId).toBeTruthy();
    expect(typeof operation.durationMs).toBe('number');
    expect(lines.join('\n')).not.toContain('super-secret-token');
  });

  it('logs a failure with its canonical error code and no payload', async () => {
    const lines: string[] = [];
    const { client, server } = await connect(
      [{ match: /\/studio\/versiones\/404$/, status: 404, body: { message: 'No query results.' } }],
      lines,
    );

    await client.callTool({ name: 'get_course_version', arguments: { versionId: 404 } });
    await server.close();

    const operation = lines.map((line) => JSON.parse(line)).find((entry) => entry.outcome === 'failure');
    expect(operation).toMatchObject({ tool: 'get_course_version', errorCode: 'NOT_FOUND', target: 'version:404' });
  });
});
