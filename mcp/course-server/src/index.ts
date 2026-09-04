#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ConfigurationError, loadConfig } from './config.js';
import { createLogger } from './logging.js';
import { SERVER_NAME, SERVER_VERSION, createServer } from './server.js';

/**
 * Entry point. V1 speaks stdio, the transport every current MCP client
 * supports locally and the one that keeps the security model simple: the token
 * lives in the client's own environment and never crosses a network boundary
 * this server owns.
 *
 * Transport is deliberately the only thing this file knows about. Adding a
 * remote transport later means adding a sibling entry point around the same
 * `createServer`; no tool and no domain call changes.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const server = createServer({ config, logger });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.note('DAEMON Course MCP ready', {
    version: SERVER_VERSION,
    transport: 'stdio',
    // The host, never the credential.
    apiBaseUrl: config.baseUrl,
  });

  const shutdown = (): void => {
    void server.close().finally(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `${JSON.stringify({
      ts: new Date().toISOString(),
      service: SERVER_NAME,
      level: 'error',
      event: error instanceof ConfigurationError ? 'configuration.invalid' : 'startup.failed',
      message,
    })}\n`,
  );
  process.exit(1);
});
