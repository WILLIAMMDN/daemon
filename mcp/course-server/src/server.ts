import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DaemonAuthoringClient } from './api/client.js';
import { DaemonApiError } from './errors.js';
import type { Logger } from './logging.js';
import type { ServerConfig } from './config.js';
import { buildTools } from './tools.js';
import type { ToolDefinition } from './tools.js';

export const SERVER_NAME = 'daemon-course-mcp';
export const SERVER_VERSION = '1.0.0';

const INSTRUCTIONS = [
  'DAEMON Course MCP — canonical course authoring for the DAEMON platform.',
  '',
  'Call get_authoring_catalog first: it returns the vocabulary and limits DAEMON permits.',
  'Read a course version with get_course_version before editing it; ids come from there.',
  '',
  'This server can read, create drafts, edit drafts and validate them. It CANNOT publish.',
  'Published versions are immutable: to evolve one, call create_draft_version and edit the draft.',
  'Publication stays a human action in Course Studio, and the backend enforces that by scope.',
].join('\n');

export interface ServerDependencies {
  readonly config: ServerConfig;
  readonly logger: Logger;
  readonly client?: DaemonAuthoringClient;
}

/**
 * Serialise a successful tool result.
 *
 * MCP clients read `content`; `structuredContent` carries the same canonical
 * payload for clients that consume it directly.
 */
function successResult(payload: unknown): {
  content: { type: 'text'; text: string }[];
  structuredContent?: Record<string, unknown>;
} {
  const text = JSON.stringify(payload ?? {}, null, 2);
  const structured =
    typeof payload === 'object' && payload !== null && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : undefined;

  return {
    content: [{ type: 'text', text }],
    ...(structured === undefined ? {} : { structuredContent: structured }),
  };
}

function failureResult(error: unknown): {
  content: { type: 'text'; text: string }[];
  isError: true;
} {
  const payload =
    error instanceof DaemonApiError
      ? error.toJSON()
      : { error: { code: 'UPSTREAM_ERROR', message: error instanceof Error ? error.message : String(error) } };

  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }], isError: true };
}

function errorCode(error: unknown): string {
  return error instanceof DaemonApiError ? error.code : 'UPSTREAM_ERROR';
}

export function createServer({ config, logger, client }: ServerDependencies): McpServer {
  const api = client ?? new DaemonAuthoringClient(config);
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {}, resources: {} }, instructions: INSTRUCTIONS },
  );

  // Resolved lazily and remembered: the actor reference makes the operation log
  // attributable without the token ever being read back or written down.
  let actorReference: string | undefined;
  const actor = async (): Promise<string | undefined> => {
    if (actorReference !== undefined) return actorReference;
    try {
      actorReference = (await api.whoami()).reference;
    } catch {
      actorReference = undefined;
    }
    return actorReference;
  };

  for (const tool of buildTools() as ToolDefinition[]) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (async (args: Record<string, unknown>) => {
        const requestId = logger.newRequestId();
        const startedAt = Date.now();

        try {
          const payload = await tool.handler(args ?? {}, { client: api });
          logger.operation({
            tool: tool.name,
            requestId,
            actor: await actor(),
            target: tool.target?.(args ?? {}),
            outcome: 'success',
            durationMs: Date.now() - startedAt,
          });

          return successResult(payload);
        } catch (error) {
          logger.operation({
            tool: tool.name,
            requestId,
            actor: actorReference,
            target: tool.target?.(args ?? {}),
            outcome: 'failure',
            errorCode: errorCode(error),
            durationMs: Date.now() - startedAt,
          });

          return failureResult(error);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
  }

  registerResources(server, api);

  return server;
}

/**
 * Read-only resources for high-value context an AI wants pinned rather than
 * re-fetched. They mirror existing reads; nothing is exposed here that a tool
 * cannot already return, and nothing here can write.
 */
function registerResources(server: McpServer, api: DaemonAuthoringClient): void {
  server.registerResource(
    'authoring-catalog',
    'daemon://authoring/catalog',
    {
      title: 'DAEMON authoring catalog',
      description: 'Canonical experience types, audiences, difficulties, evidence modalities, limits and objectives.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(await api.catalog(), null, 2) }],
    }),
  );

  server.registerResource(
    'course',
    new ResourceTemplate('daemon://course/{courseId}', { list: undefined }),
    {
      title: 'DAEMON course',
      description: 'A course with the detail of every version.',
      mimeType: 'application/json',
    },
    async (uri, variables) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(await api.course(Number(variables.courseId)), null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    'course-version',
    new ResourceTemplate('daemon://course-version/{versionId}', { list: undefined }),
    {
      title: 'DAEMON course version',
      description: 'The full authoring tree of one course version, with its publication-readiness report.',
      mimeType: 'application/json',
    },
    async (uri, variables) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(await api.courseVersion(Number(variables.versionId)), null, 2),
        },
      ],
    }),
  );
}
