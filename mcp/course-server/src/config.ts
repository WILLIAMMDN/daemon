/**
 * Configuration comes exclusively from the environment. No token, no host and
 * no institution identifier is ever compiled into this server.
 */
export interface ServerConfig {
  /** Canonical Authoring API base, including the `/api/v1` prefix. */
  readonly baseUrl: string;
  /** Sanctum service token. Held in memory only; never logged, never echoed. */
  readonly token: string;
  readonly timeoutMs: number;
  readonly logLevel: 'info' | 'silent';
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const DEFAULT_TIMEOUT_MS = 30_000;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const baseUrl = (env.DAEMON_API_BASE_URL ?? '').trim();
  const token = (env.DAEMON_MCP_TOKEN ?? '').trim();

  if (baseUrl === '') {
    throw new ConfigurationError(
      'DAEMON_API_BASE_URL is required, e.g. http://127.0.0.1:8000/api/v1 or https://daemon-5vo1.onrender.com/api/v1',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new ConfigurationError(`DAEMON_API_BASE_URL is not a valid URL: ${baseUrl}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ConfigurationError('DAEMON_API_BASE_URL must be an http(s) URL.');
  }

  if (token === '') {
    throw new ConfigurationError(
      'DAEMON_MCP_TOKEN is required. Issue one with: php artisan autoria:token emitir --actor=<email>',
    );
  }

  const rawTimeout = Number.parseInt(env.DAEMON_MCP_TIMEOUT_MS ?? '', 10);

  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    token,
    timeoutMs: Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : DEFAULT_TIMEOUT_MS,
    logLevel: env.DAEMON_MCP_LOG === 'silent' ? 'silent' : 'info',
  };
}
