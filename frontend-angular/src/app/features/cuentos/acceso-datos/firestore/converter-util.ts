import { DocumentData, Timestamp } from 'firebase/firestore';
import { ErrorCuento } from '../../dominio/errores-cuento';

export function asegurarMapa(datos: DocumentData, contexto: string): Record<string, unknown> {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw invalido(contexto);
  }
  return datos as Record<string, unknown>;
}

export function validarCampos(
  datos: Record<string, unknown>,
  permitidos: readonly string[],
  contexto: string,
): void {
  const extras = Object.keys(datos).filter((campo) => !permitidos.includes(campo));
  if (extras.length > 0) {
    throw new ErrorCuento(
      'DATOS_INVALIDOS',
      `${contexto} contiene campos no soportados: ${extras.join(', ')}.`,
      false,
    );
  }
}

export function leerString(datos: Record<string, unknown>, campo: string, contexto: string): string {
  const valor = datos[campo];
  if (typeof valor !== 'string') throw invalido(`${contexto}.${campo}`);
  return valor;
}

export function leerStringOpcional(
  datos: Record<string, unknown>,
  campo: string,
  contexto: string,
): string | null {
  const valor = datos[campo];
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'string') throw invalido(`${contexto}.${campo}`);
  return valor;
}

export function leerNumero(datos: Record<string, unknown>, campo: string, contexto: string): number {
  const valor = datos[campo];
  if (typeof valor !== 'number' || !Number.isFinite(valor)) throw invalido(`${contexto}.${campo}`);
  return valor;
}

export function leerNumeroOpcional(
  datos: Record<string, unknown>,
  campo: string,
  contexto: string,
): number | null {
  const valor = datos[campo];
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'number' || !Number.isFinite(valor)) throw invalido(`${contexto}.${campo}`);
  return valor;
}

export function leerBooleano(datos: Record<string, unknown>, campo: string, contexto: string): boolean {
  const valor = datos[campo];
  if (typeof valor !== 'boolean') throw invalido(`${contexto}.${campo}`);
  return valor;
}

export function leerTimestamp(datos: Record<string, unknown>, campo: string, contexto: string): Timestamp {
  const valor = datos[campo];
  if (!(valor instanceof Timestamp)) throw invalido(`${contexto}.${campo}`);
  return valor;
}

export function leerTimestampOpcional(
  datos: Record<string, unknown>,
  campo: string,
  contexto: string,
): Timestamp | null {
  const valor = datos[campo];
  if (valor === null || valor === undefined) return null;
  if (!(valor instanceof Timestamp)) throw invalido(`${contexto}.${campo}`);
  return valor;
}

export function leerMapaOpcional(
  datos: Record<string, unknown>,
  campo: string,
  contexto: string,
): Record<string, unknown> | null {
  const valor = datos[campo];
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'object' || Array.isArray(valor)) throw invalido(`${contexto}.${campo}`);
  return valor as Record<string, unknown>;
}

function invalido(contexto: string): ErrorCuento {
  return new ErrorCuento('DATOS_INVALIDOS', `Firestore devolvió datos inválidos en ${contexto}.`, false);
}
