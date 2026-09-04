import { describe, expect, it } from 'vitest';
import { DaemonApiError, mapHttpError, mapTransportError } from '../src/errors.js';

const URL_UNDER_TEST = 'http://127.0.0.1:8000/api/v1/academico/studio/versiones/1';

describe('canonical error mapping', () => {
  it('maps an unauthenticated response to AUTH_REQUIRED with an actionable hint', () => {
    const error = mapHttpError(401, { message: 'Unauthenticated.' }, URL_UNDER_TEST);

    expect(error.code).toBe('AUTH_REQUIRED');
    expect(error.hint).toContain('autoria:token emitir');
  });

  it('maps a missing scope to FORBIDDEN and explains that publishing is human', () => {
    const error = mapHttpError(
      403,
      { message: 'El token no declara el alcance requerido: course:publish.' },
      URL_UNDER_TEST,
    );

    expect(error.code).toBe('FORBIDDEN');
    expect(error.hint).toContain('human action in Course Studio');
  });

  it('maps a role rejection to FORBIDDEN without a publication hint', () => {
    const error = mapHttpError(403, { message: 'No tienes permisos para acceder a este recurso.' }, URL_UNDER_TEST);

    expect(error.code).toBe('FORBIDDEN');
    expect(error.hint).toBeUndefined();
  });

  it('maps a 404 to NOT_FOUND', () => {
    expect(mapHttpError(404, {}, URL_UNDER_TEST).code).toBe('NOT_FOUND');
  });

  it('maps the draft-only 409 to PUBLISHED_VERSION_IMMUTABLE and points at create_draft_version', () => {
    const error = mapHttpError(
      409,
      { message: 'Solo se puede modificar una versión de curso en borrador.' },
      URL_UNDER_TEST,
    );

    expect(error.code).toBe('PUBLISHED_VERSION_IMMUTABLE');
    expect(error.hint).toContain('create_draft_version');
  });

  it('maps any other 409 to CONFLICT', () => {
    expect(mapHttpError(409, { message: 'Solo se puede archivar una versión publicada.' }, URL_UNDER_TEST).code).toBe(
      'CONFLICT',
    );
  });

  it('maps a validation failure to VALIDATION_FAILED and preserves field-level detail', () => {
    const error = mapHttpError(
      422,
      { message: 'The given data was invalid.', errors: { titulo: ['El título es obligatorio.'], orden: 'inválido' } },
      URL_UNDER_TEST,
    );

    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.fieldErrors).toEqual({ titulo: ['El título es obligatorio.'], orden: ['inválido'] });
  });

  it('maps a prerequisite cycle to DEPENDENCY_CYCLE even when it arrives as a field error', () => {
    const error = mapHttpError(
      422,
      { message: 'The given data was invalid.', errors: { prerrequisitos: ['Los prerrequisitos forman un ciclo.'] } },
      URL_UNDER_TEST,
    );

    expect(error.code).toBe('DEPENDENCY_CYCLE');
  });

  it('maps a publication readiness rejection to PUBLICATION_NOT_READY and keeps the findings', () => {
    const validation = { versionId: 7, ready: false, errors: [{ code: 'path.missing' }], warnings: [] };
    const error = mapHttpError(422, { message: 'La versión no está lista para publicarse.', validation }, URL_UNDER_TEST);

    expect(error.code).toBe('PUBLICATION_NOT_READY');
    expect(error.validation).toEqual(validation);
  });

  it('maps throttling to RATE_LIMITED and says MCP does not bypass it', () => {
    const error = mapHttpError(429, { message: 'Too Many Attempts.' }, URL_UNDER_TEST);

    expect(error.code).toBe('RATE_LIMITED');
    expect(error.hint).toContain('does not bypass');
  });

  it('never leaks a server-side failure body', () => {
    const error = mapHttpError(500, '<html><body>Whoops, stack trace</body></html>', URL_UNDER_TEST);

    expect(error.code).toBe('UPSTREAM_ERROR');
    expect(error.message).not.toContain('stack trace');
  });

  it('maps an aborted request to NETWORK_ERROR naming the timeout', () => {
    const error = mapTransportError({ name: 'AbortError' }, URL_UNDER_TEST, 1234);

    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.message).toContain('1234ms');
  });

  it('serialises to a stable JSON envelope an MCP client can branch on', () => {
    const error = new DaemonApiError({ code: 'NOT_FOUND', status: 404, message: 'gone' });

    expect(error.toJSON()).toEqual({ error: { code: 'NOT_FOUND', message: 'gone', status: 404 } });
  });
});
