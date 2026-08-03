import { TestBed } from '@angular/core/testing';
import {
  CUENTO_REPOSITORIO,
  type CuentoRepositorio,
} from '../acceso-datos/cuento.repositorio';
import { DatosBorradorCuento, VERSION_ESQUEMA_CUENTO } from '../dominio/cuento.modelo';
import { crearPaginaCuento } from '../dominio/pagina-cuento.modelo';
import { ActualizarBorradorCasoUso } from './actualizar-borrador.caso-uso';

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
    revisionEsperada: 3,
  };
}

describe('ActualizarBorradorCasoUso', () => {
  let casoUso: ActualizarBorradorCasoUso;
  const repositorio = { actualizarBorrador: jest.fn() } as unknown as CuentoRepositorio;

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        ActualizarBorradorCasoUso,
        { provide: CUENTO_REPOSITORIO, useValue: repositorio },
      ],
    });
    casoUso = TestBed.inject(ActualizarBorradorCasoUso);
  });

  it('delega la actualización con la revisión esperada del servidor', async () => {
    (repositorio.actualizarBorrador as jest.Mock).mockResolvedValue({ cuento: { id: 'cuento-1' } });
    const resultado = await casoUso.ejecutar(datos());
    expect(repositorio.actualizarBorrador).toHaveBeenCalledWith(datos());
    expect(resultado).toEqual({ cuento: { id: 'cuento-1' } });
  });
});
