import { Timestamp, type QueryDocumentSnapshot } from 'firebase/firestore';
import { ErrorCuento } from '../../dominio/errores-cuento';
import { reaccionConverter } from './reaccion.converter';

function snapshot(id: string, datos: Record<string, unknown>): QueryDocumentSnapshot {
  return { id, data: () => datos } as unknown as QueryDocumentSnapshot;
}

describe('reaccionConverter', () => {
  const datos = {
    schema_version: 2,
    usuario_uid: 'uid-1',
    tipo: 'encanto',
    created_at: Timestamp.fromMillis(1000),
    updated_at: Timestamp.fromMillis(2000),
  };

  it('convierte una reacción válida', () => {
    const reaccion = reaccionConverter.fromFirestore(snapshot('r-1', datos), {});
    expect(reaccion.usuario_uid).toBe('uid-1');
    expect(reaccion.tipo).toBe('encanto');
  });

  it('rechaza tipo y usuario con tipos incorrectos o campos ausentes', () => {
    const sinTipo = { ...datos };
    delete sinTipo['tipo'];
    expect(() => reaccionConverter.fromFirestore(snapshot('r-1', sinTipo), {}))
      .toThrow(ErrorCuento);
    expect(() => reaccionConverter.fromFirestore(snapshot('r-1', { ...datos, tipo: 42 }), {}))
      .toThrow(ErrorCuento);
    expect(() => reaccionConverter.fromFirestore(snapshot('r-1', { ...datos, usuario_uid: 123 }), {}))
      .toThrow(ErrorCuento);
  });

  it('rechaza campos no permitidos', () => {
    expect(() => reaccionConverter.fromFirestore(snapshot('r-1', { ...datos, rol: 'admin' }), {}))
      .toThrow(ErrorCuento);
  });
});
