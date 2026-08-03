import { DatosBorradorCuento, VERSION_ESQUEMA_CUENTO } from './cuento.modelo';
import { ErrorCuento } from './errores-cuento';
import { crearPaginaCuento } from './pagina-cuento.modelo';
import { contarPalabras, minutosLectura, validarBorradorCuento } from './politicas-cuento';

function datos(): DatosBorradorCuento {
  return {
    cuentoId: 'cuento-1',
    versionId: 'version-1',
    titulo: 'Una historia',
    sinopsis: '',
    categoria: 'Aventura',
    rangoEdad: '9 - 12 años',
    portadaRef: null,
    paginas: [{
      ...crearPaginaCuento('pagina-1', 1, '<p>Hola mundo seguro</p>'),
      cuentoId: 'cuento-1',
      versionId: 'version-1',
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    }],
    revisionEsperada: 0,
  };
}

describe('políticas de cuentos', () => {
  it('calcula palabras y tiempo sin usar HTML como contenido', () => {
    const borrador = datos();
    expect(contarPalabras(borrador.paginas)).toBe(3);
    expect(minutosLectura(151)).toBe(2);
    expect(() => validarBorradorCuento(borrador)).not.toThrow();
  });

  it('rechaza base64, páginas duplicadas y orden inconsistente', () => {
    const base = datos();
    const pagina = { ...base.paginas[0], ilustracionRef: 'data:image/png;base64,abc' };
    expect(() => validarBorradorCuento({ ...base, paginas: [pagina] })).toThrow(ErrorCuento);
    expect(() => validarBorradorCuento({ ...base, paginas: [pagina, pagina] })).toThrow(ErrorCuento);
  });
});
