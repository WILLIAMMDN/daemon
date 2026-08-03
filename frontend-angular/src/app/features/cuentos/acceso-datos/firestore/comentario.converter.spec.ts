import { Timestamp, type QueryDocumentSnapshot } from 'firebase/firestore';
import { ErrorCuento } from '../../dominio/errores-cuento';
import { comentarioConverter } from './comentario.converter';

function snapshot(id: string, datos: Record<string, unknown>): QueryDocumentSnapshot {
  return { id, data: () => datos } as unknown as QueryDocumentSnapshot;
}

describe('comentarioConverter', () => {
  const datos = {
    schema_version: 2,
    autor_uid: 'uid-1',
    cuerpo: '¡Me encantó!',
    estado: 'visible',
    created_at: Timestamp.fromMillis(1000),
    updated_at: Timestamp.fromMillis(2000),
  };

  it('convierte un comentario válido', () => {
    const comentario = comentarioConverter.fromFirestore(snapshot('c-1', datos), {});
    expect(comentario.autor_uid).toBe('uid-1');
    expect(comentario.cuerpo).toBe('¡Me encantó!');
    expect(comentario.estado).toBe('visible');
  });

  it('rechaza cuerpo ausente y campos extra', () => {
    const sinCuerpo = { ...datos };
    delete sinCuerpo['cuerpo'];
    expect(() => comentarioConverter.fromFirestore(snapshot('c-1', sinCuerpo), {}))
      .toThrow(ErrorCuento);
    expect(() => comentarioConverter.fromFirestore(snapshot('c-1', { ...datos, rol: 'admin' }), {}))
      .toThrow(ErrorCuento);
  });
});
