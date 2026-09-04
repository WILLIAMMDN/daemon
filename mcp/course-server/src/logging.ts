import { randomUUID } from 'node:crypto';

/**
 * Structured operation log.
 *
 * Written to stderr because stdout is the MCP stdio transport. Records what an
 * operation did, never what it carried: no bearer token, no evidence content,
 * no learner data, no raw request or response bodies.
 */
export interface OperationLog {
  readonly tool: string;
  readonly requestId: string;
  readonly actor?: string | undefined;
  readonly target?: string | undefined;
  readonly outcome: 'success' | 'failure';
  readonly errorCode?: string | undefined;
  readonly durationMs: number;
}

export type LogSink = (line: string) => void;

export interface Logger {
  newRequestId(): string;
  operation(entry: OperationLog): void;
  note(message: string, context?: Record<string, string | number | boolean>): void;
}

const REDACTED_KEYS = /token|authorization|secret|password|bearer/i;

/** Defence in depth: a caller must not be able to log a credential by accident. */
function safeContext(context: Record<string, string | number | boolean>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, REDACTED_KEYS.test(key) ? '[redacted]' : value]),
  );
}

export function createLogger(level: 'info' | 'silent', sink: LogSink = (line) => process.stderr.write(`${line}\n`)): Logger {
  const write = (payload: Record<string, unknown>): void => {
    if (level === 'silent') return;
    sink(JSON.stringify({ ts: new Date().toISOString(), service: 'daemon-course-mcp', ...payload }));
  };

  return {
    newRequestId: () => randomUUID(),
    operation: (entry) =>
      write({
        level: entry.outcome === 'success' ? 'info' : 'warn',
        event: 'tool.call',
        tool: entry.tool,
        requestId: entry.requestId,
        actor: entry.actor ?? null,
        target: entry.target ?? null,
        outcome: entry.outcome,
        errorCode: entry.errorCode ?? null,
        durationMs: entry.durationMs,
      }),
    note: (message, context = {}) => write({ level: 'info', event: 'note', message, ...safeContext(context) }),
  };
}
