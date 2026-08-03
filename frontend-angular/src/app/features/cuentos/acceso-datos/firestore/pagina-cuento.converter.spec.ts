import { Timestamp, type QueryDocumentSnapshot } from 'firebase/firestore';
import { ErrorCuento } from '../../dominio/errores-cuento';
import { paginaCuentoConverter } from './pagina-cuento.converter';

function snapshot(id: string, datos: Record<string, unknown>): QueryDocumentSnapshot {
  return { id, data: () => datos } as unknown as QueryDocumentSnapshot;
}

function datosValidos(): Record<string, unknown> {
  return {
    schema_version: 2,
    autor_uid: 'uid-1',
    orden: 1,
    contenido: '<p>Hola</p>',
    ilustracion_ref: null,
    texto_alternativo: '',
    fondo_token: 'var(--daemon-on-primary)',
    created_at: Timestamp.fromMillis(1000),
    updated_at: Timestamp.fromMillis(2000),
  };
}

describe('paginaCuentoConverter', () => {
  it('convierte una página válida', () => {
    const pagina = paginaCuentoConverter.fromFirestore(snapshot('pagina-1', datosValidos()), {});
    expect(pagina.orden).toBe(1);
    expect(pagina.contenido).toBe('<p>Hola</p>');
    expect(pagina.autor_uid).toBe('uid-1');
  });

  it('rechaza campos extra y orden inválido', () => {
    expect(() => paginaCuentoConverter.fromFirestore(snapshot('p', { ...datosValidos(), extra: 1 }), {}))
      .toThrow(ErrorCuento);
    expect(() => paginaCuentoConverter.fromFirestore(snapshot('p', { ...datosValidos(), orden: 'uno' }), {}))
      .toThrow(ErrorCuento);
  });
});
