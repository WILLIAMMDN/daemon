import { TestBed } from '@angular/core/testing';
import {
  CUENTO_REPOSITORIO,
  type CuentoRepositorio,
} from '../acceso-datos/cuento.repositorio';
import { DatosBorradorCuento, VERSION_ESQUEMA_CUENTO } from '../dominio/cuento.modelo';
import { crearPaginaCuento } from '../dominio/pagina-cuento.modelo';
import { CrearBorradorCasoUso } from './crear-borrador.caso-uso';

function datos(): DatosBorradorCuento {
  return {
    cuentoId: 'cuento-1',
    versionId: 'version-1',
    titulo: 'Mi cuento',
    sinopsis: '',
    categoria: 'Aventura',
    rangoEdad: '9 - 12 años',
    portadaRef: null,
    paginas: [{
      ...crearPaginaCuento('pagina-1', 1, '<p>Hola</p>'),
      cuentoId: 'cuento-1',
      versionId: 'version-1',
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    }],
    revisionEsperada: 0,
  };
}

describe('CrearBorradorCasoUso', () => {
  let casoUso: CrearBorradorCasoUso;
  const repositorio = { crearBorrador: jest.fn() } as unknown as CuentoRepositorio;

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        CrearBorradorCasoUso,
        { provide: CUENTO_REPOSITORIO, useValue: repositorio },
      ],
    });
    casoUso = TestBed.inject(CrearBorradorCasoUso);
  });

  it('delega la creación del borrador con audiencia KIDS', async () => {
    (repositorio.crearBorrador as jest.Mock).mockResolvedValue({ cuento: { id: 'cuento-1' } });
    const resultado = await casoUso.ejecutar(datos(), 'KIDS');
    expect(repositorio.crearBorrador).toHaveBeenCalledWith(datos(), 'KIDS');
    expect(resultado).toEqual({ cuento: { id: 'cuento-1' } });
  });
});
