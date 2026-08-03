import { Timestamp, type QueryDocumentSnapshot } from 'firebase/firestore';
import { ErrorCuento } from '../../dominio/errores-cuento';
import { cuentoConverter, type CuentoFirestoreDto } from './cuento.converter';

function snapshot(id: string, datos: Record<string, unknown>): QueryDocumentSnapshot {
  return { id, data: () => datos } as unknown as QueryDocumentSnapshot;
}

function datosValidos(): Record<string, unknown> {
  return {
    schema_version: 2,
    autor_uid: 'uid-1',
    autor_usuario_id: 7,
    autor_perfil: { nombre: 'Ana', avatar_ref: null },
    audiencia: 'TEENS',
    aula_id: null,
    estado: 'borrador',
    visibilidad: 'privado',
    version_borrador_id: 'version-1',
    version_publicada_id: null,
    moderacion_estado: 'no_solicitada',
    titulo_publicado: null,
    sinopsis_publicada: null,
    categoria_publicada: null,
    rango_edad_publicado: null,
    paginas_publicadas: null,
    palabras_publicadas: null,
    portada_ref: null,
    stats: null,
    comentarios_bloqueados: false,
    created_at: Timestamp.fromMillis(1000),
    updated_at: Timestamp.fromMillis(2000),
    submitted_at: null,
    published_at: null,
    deleted_at: null,
    legacy: null,
  };
}

describe('cuentoConverter', () => {
  it('convierte un documento v2 válido', () => {
    const dto = cuentoConverter.fromFirestore(snapshot('cuento-1', datosValidos()), {});
    expect(dto.schema_version).toBe(2);
    expect(dto.autor_uid).toBe('uid-1');
    expect(dto.autor_usuario_id).toBe(7);
    expect(dto.autor_perfil?.nombre).toBe('Ana');
    expect(dto.created_at.toMillis()).toBe(1000);
  });

  it('rechaza campos no permitidos', () => {
    const datos = { ...datosValidos(), titulo: 'campo extra' };
    expect(() => cuentoConverter.fromFirestore(snapshot('cuento-1', datos), {}))
      .toThrow(ErrorCuento);
  });

  it('rechaza timestamps no confiables', () => {
    const datos = { ...datosValidos(), created_at: '2026-08-03T00:00:00Z' };
    expect(() => cuentoConverter.fromFirestore(snapshot('cuento-1', datos), {}))
      .toThrow(ErrorCuento);
  });

  it('tolera legacy nullable y stats ausentes', () => {
    const dto = cuentoConverter.fromFirestore(snapshot('cuento-1', datosValidos()), {});
    expect(dto.legacy).toBeNull();
    expect(dto.stats).toBeNull();
  });

  it('serializa el modelo sin transformación (toFirestore)', () => {
    const modelo: CuentoFirestoreDto = cuentoConverter.fromFirestore(
      snapshot('cuento-1', datosValidos()),
      {},
    );
    const salida = cuentoConverter.toFirestore(modelo);
    expect(salida['schema_version']).toBe(2);
    expect(salida['autor_uid']).toBe('uid-1');
  });
});
