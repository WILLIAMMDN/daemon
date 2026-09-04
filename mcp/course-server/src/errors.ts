/**
 * Canonical, AI-usable error model.
 *
 * The Laravel API is the authority on what went wrong; this module only
 * translates its canonical responses into stable codes an MCP client can branch
 * on. Laravel HTML error pages and stack traces never reach the client.
 */
export type DaemonErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'PUBLISHED_VERSION_IMMUTABLE'
  | 'DEPENDENCY_CYCLE'
  | 'PUBLICATION_NOT_READY'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'NETWORK_ERROR'
  | 'CONFIGURATION_ERROR';

export interface DaemonErrorPayload {
  readonly code: DaemonErrorCode;
  readonly message: string;
  readonly status?: number | undefined;
  /** Field-level validation detail, preserved verbatim from the API. */
  readonly fieldErrors?: Record<string, string[]> | undefined;
  /** Publication readiness findings, when the API returned them. */
  readonly validation?: unknown;
  readonly hint?: string | undefined;
}

export class DaemonApiError extends Error {
  readonly code: DaemonErrorCode;
  readonly status: number | undefined;
  readonly fieldErrors: Record<string, string[]> | undefined;
  readonly validation: unknown;
  readonly hint: string | undefined;

  constructor(payload: DaemonErrorPayload) {
    super(payload.message);
    this.name = 'DaemonApiError';
    this.code = payload.code;
    this.status = payload.status;
    this.fieldErrors = payload.fieldErrors;
    this.validation = payload.validation;
    this.hint = payload.hint;
  }

  toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.status === undefined ? {} : { status: this.status }),
        ...(this.fieldErrors === undefined ? {} : { fieldErrors: this.fieldErrors }),
        ...(this.validation === undefined ? {} : { validation: this.validation }),
        ...(this.hint === undefined ? {} : { hint: this.hint }),
      },
    };
  }
}

const IMMUTABLE_HINT =
  'Published versions are immutable. Create a draft with create_draft_version and edit that instead.';

const PUBLISH_HINT =
  'This DAEMON Course MCP holds course:read and course:write only. Publishing is a human action in Course Studio.';

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function readMessage(body: unknown, fallback: string): string {
  const message = asRecord(body).message;
  return typeof message === 'string' && message.trim() !== '' ? message : fallback;
}

function readFieldErrors(body: unknown): Record<string, string[]> | undefined {
  const errors = asRecord(body).errors;
  if (typeof errors !== 'object' || errors === null) return undefined;

  const normalized: Record<string, string[]> = {};
  for (const [field, detail] of Object.entries(errors as Record<string, unknown>)) {
    if (Array.isArray(detail)) {
      normalized[field] = detail.filter((item): item is string => typeof item === 'string');
    } else if (typeof detail === 'string') {
      normalized[field] = [detail];
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

/** A 422 carrying `validation` is a publication-readiness rejection. */
function isPublicationReadiness(body: unknown): boolean {
  const validation = asRecord(body).validation;
  return typeof validation === 'object' && validation !== null && 'ready' in asRecord(validation);
}

function mentionsCycle(text: string): boolean {
  return /ciclo|cycle/i.test(text);
}

function mentionsDraftOnly(text: string): boolean {
  return /borrador|draft/i.test(text);
}

/**
 * Translate one canonical API response into a DaemonApiError.
 *
 * `body` is the already-parsed JSON payload, or the raw text when the response
 * was not JSON (which for this API means an upstream failure, not a domain
 * answer).
 */
export function mapHttpError(status: number, body: unknown, url: string): DaemonApiError {
  const message = readMessage(body, `The DAEMON Authoring API answered ${status}.`);
  const fieldErrors = readFieldErrors(body);

  switch (status) {
    case 401:
      return new DaemonApiError({
        code: 'AUTH_REQUIRED',
        status,
        message,
        hint: 'DAEMON_MCP_TOKEN is missing, expired or revoked. Issue a new one with: php artisan autoria:token emitir',
      });

    case 403:
    case 419:
      return new DaemonApiError({
        code: 'FORBIDDEN',
        status,
        message,
        hint: /alcance|scope|course:publish/i.test(message) ? PUBLISH_HINT : undefined,
      });

    case 404:
      return new DaemonApiError({
        code: 'NOT_FOUND',
        status,
        message: message === `The DAEMON Authoring API answered ${status}.` ? `Not found: ${url}` : message,
      });

    case 405:
      return new DaemonApiError({
        code: 'FORBIDDEN',
        status,
        message,
        hint: PUBLISH_HINT,
      });

    case 409:
      return new DaemonApiError({
        code: mentionsDraftOnly(message) ? 'PUBLISHED_VERSION_IMMUTABLE' : 'CONFLICT',
        status,
        message,
        hint: mentionsDraftOnly(message) ? IMMUTABLE_HINT : undefined,
      });

    case 422: {
      if (isPublicationReadiness(body)) {
        return new DaemonApiError({
          code: 'PUBLICATION_NOT_READY',
          status,
          message,
          validation: asRecord(body).validation,
        });
      }

      const cycleText = [message, ...Object.values(fieldErrors ?? {}).flat()].join(' ');
      if (mentionsCycle(cycleText)) {
        return new DaemonApiError({ code: 'DEPENDENCY_CYCLE', status, message, fieldErrors });
      }

      return new DaemonApiError({ code: 'VALIDATION_FAILED', status, message, fieldErrors });
    }

    case 429:
      return new DaemonApiError({
        code: 'RATE_LIMITED',
        status,
        message,
        hint: 'The canonical API throttle rejected this call. Slow down and retry; MCP does not bypass it.',
      });

    default:
      return new DaemonApiError({
        code: 'UPSTREAM_ERROR',
        status,
        message: status >= 500 ? `The DAEMON Authoring API failed (${status}).` : message,
      });
  }
}

export function mapTransportError(cause: unknown, url: string, timeoutMs: number): DaemonApiError {
  if (cause instanceof DaemonApiError) return cause;

  const aborted = typeof cause === 'object' && cause !== null && (cause as { name?: string }).name === 'AbortError';

  return new DaemonApiError({
    code: 'NETWORK_ERROR',
    message: aborted
      ? `The DAEMON Authoring API did not answer within ${timeoutMs}ms.`
      : `Could not reach the DAEMON Authoring API at ${url}.`,
    hint: 'Check DAEMON_API_BASE_URL and that the API is reachable from this machine.',
  });
}
