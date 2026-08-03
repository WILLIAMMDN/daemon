import { TestBed } from '@angular/core/testing';
import {
  COMANDOS_CUENTO_GATEWAY,
  type ComandosCuentoGateway,
} from '../acceso-datos/comandos-cuento.gateway';
import { PublicarCuentoCasoUso } from './publicar-cuento.caso-uso';

interface Control {
  gateway: ComandosCuentoGateway;
  liberar: () => void;
  llamadas: () => Array<[string, string]>;
}

function crearGatewayControlado(): Control {
  const resolvers: Array<() => void> = [];
  const llamadas: Array<[string, string]> = [];
  const gateway = {
    solicitarPublicacion: jest.fn((cuentoId: string, idempotencia: string) => {
      llamadas.push([cuentoId, idempotencia]);
      return new Promise((resolve) => {
        resolvers.push(() => resolve({ estado: 'en_revision', repetido: true }));
      });
    }),
  } as unknown as ComandosCuentoGateway;
  return {
    gateway,
    liberar: () => {
      resolvers.forEach((resolver) => resolver());
      resolvers.length = 0;
    },
    llamadas: () => llamadas,
  };
}

describe('PublicarCuentoCasoUso', () => {
  let casoUso: PublicarCuentoCasoUso;
  let control: Control;

  beforeEach(() => {
    jest.clearAllMocks();
    control = crearGatewayControlado();
    TestBed.configureTestingModule({
      providers: [
        PublicarCuentoCasoUso,
        { provide: COMANDOS_CUENTO_GATEWAY, useValue: control.gateway },
      ],
    });
    casoUso = TestBed.inject(PublicarCuentoCasoUso);
  });

  it('reutiliza la misma clave para reintentos en vuelo del mismo cuento', async () => {
    const primero = casoUso.ejecutar('cuento-1');
    const segundo = casoUso.ejecutar('cuento-1');
    control.liberar();
    await Promise.all([primero, segundo]);

    const llamadas = control.llamadas();
    expect(llamadas).toHaveLength(2);
    expect(llamadas[0][1]).toMatch(/^publicar:cuento-1:/);
    expect(llamadas[0][1]).toBe(llamadas[1][1]);
  });

  it('genera una clave nueva para un cuento distinto', async () => {
    const primero = casoUso.ejecutar('cuento-1');
    const segundo = casoUso.ejecutar('cuento-2');
    control.liberar();
    await Promise.all([primero, segundo]);

    const llamadas = control.llamadas();
    expect(llamadas).toHaveLength(2);
    expect(llamadas[0][1]).not.toBe(llamadas[1][1]);
  });
});
