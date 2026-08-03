import { TestBed } from '@angular/core/testing';
import { DatosBorradorCuento, VERSION_ESQUEMA_CUENTO } from '../dominio/cuento.modelo';
import { crearPaginaCuento } from '../dominio/pagina-cuento.modelo';
import { BorradorLocalCuento } from './borrador-local-cuento';

function borrador(revision = 3): DatosBorradorCuento {
  return {
    cuentoId: 'cuento-1',
    versionId: 'version-1',
    titulo: 'Título local',
    sinopsis: 'Sinopsis',
    categoria: 'Aventura',
    rangoEdad: '9 - 12 años',
    portadaRef: null,
    paginas: [{
      ...crearPaginaCuento('pagina-1', 1, '<p>Contenido</p>'),
      cuentoId: 'cuento-1',
      versionId: 'version-1',
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    }],
    revisionEsperada: revision,
  };
}

describe('BorradorLocalCuento', () => {
  let almacenamiento: BorradorLocalCuento;

  beforeEach(() => {
    localStorage.clear();
    almacenamiento = TestBed.inject(BorradorLocalCuento);
  });

  it('recupera sólo si cuento, versión, checksum y revisión del servidor coinciden', () => {
    almacenamiento.guardar('uid-1', borrador());
    expect(almacenamiento.recuperar('uid-1', borrador())?.titulo).toBe('Título local');
    expect(almacenamiento.recuperar('uid-1', borrador(4))).toBeNull();
  });

  it('rechaza una copia local manipulada', () => {
    almacenamiento.guardar('uid-1', borrador());
    const clave = 'daemon:cuentos:borrador:v2:uid-1:cuento-1';
    const documento = JSON.parse(localStorage.getItem(clave) ?? '{}') as Record<string, unknown>;
    documento['titulo'] = 'Contenido manipulado';
    localStorage.setItem(clave, JSON.stringify(documento));
    expect(almacenamiento.recuperar('uid-1', borrador())).toBeNull();
  });
});
