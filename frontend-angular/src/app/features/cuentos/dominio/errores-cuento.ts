export type CodigoErrorCuento =
  | 'NO_AUTENTICADO'
  | 'NO_ENCONTRADO'
  | 'NO_AUTORIZADO'
  | 'DATOS_INVALIDOS'
  | 'CONFLICTO_REVISION'
  | 'SIN_CONEXION'
  | 'CUOTA_EXCEDIDA'
  | 'OPERACION_NO_DISPONIBLE'
  | 'DESCONOCIDO';

export class ErrorCuento extends Error {
  constructor(
    readonly codigo: CodigoErrorCuento,
    message: string,
    readonly recuperable: boolean,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ErrorCuento';
  }
}

export function normalizarErrorCuento(error: unknown): ErrorCuento {
  if (error instanceof ErrorCuento) return error;

  const candidato = error as { code?: unknown; message?: unknown; status?: unknown };
  const codigo = typeof candidato?.code === 'string' ? candidato.code : '';
  const mensaje = typeof candidato?.message === 'string' ? candidato.message : '';

  if (codigo === 'permission-denied') {
    return new ErrorCuento('NO_AUTORIZADO', 'No tienes permisos para realizar esta acción.', false, { cause: error });
  }
  if (codigo === 'unauthenticated') {
    return new ErrorCuento('NO_AUTENTICADO', 'Tu sesión de Firebase expiró.', true, { cause: error });
  }
  if (codigo === 'unavailable' || codigo === 'network-request-failed' || candidato?.status === 0) {
    return new ErrorCuento('SIN_CONEXION', 'Sin conexión. Conservamos tu borrador en este dispositivo.', true, { cause: error });
  }
  if (codigo === 'not-found') {
    return new ErrorCuento('NO_ENCONTRADO', 'El cuento solicitado no existe.', false, { cause: error });
  }
  if (codigo === 'resource-exhausted' || codigo === 'quota-exceeded') {
    return new ErrorCuento('CUOTA_EXCEDIDA', 'La base de datos alcanzó temporalmente su cuota.', true, { cause: error });
  }
  if (codigo === 'invalid-argument' || codigo === 'data-loss') {
    return new ErrorCuento('DATOS_INVALIDOS', mensaje || 'Los datos del cuento no son válidos.', false, { cause: error });
  }

  // Error del Firestore emulator: indice compuesto faltante. El emulador
  // devuelve SQLSTATE[42S22] con create_composite=... en el mensaje.
  if (mensaje.includes('SQLSTATE') || mensaje.includes('create_composite')) {
    return new ErrorCuento(
      'OPERACION_NO_DISPONIBLE',
      'La galería no está disponible ahora. Vuelve a intentar en unos segundos.',
      true,
      { cause: error },
    );
  }

  return new ErrorCuento('DESCONOCIDO', mensaje || 'No pudimos completar la operación.', true, { cause: error });
}
