import { TestBed } from '@angular/core/testing';
import {
  COMANDOS_CUENTO_GATEWAY,
  type ComandosCuentoGateway,
} from '../acceso-datos/comandos-cuento.gateway';
import { ReaccionarCuentoCasoUso } from './reaccionar-cuento.caso-uso';

describe('ReaccionarCuentoCasoUso', () => {
  let casoUso: ReaccionarCuentoCasoUso;
  const gateway = { reaccionar: jest.fn() } as unknown as ComandosCuentoGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        ReaccionarCuentoCasoUso,
        { provide: COMANDOS_CUENTO_GATEWAY, useValue: gateway },
      ],
    });
    casoUso = TestBed.inject(ReaccionarCuentoCasoUso);
  });

  it('delega la reacción con tipo e idempotencia', async () => {
    (gateway.reaccionar as jest.Mock).mockResolvedValue(undefined);
    await casoUso.ejecutar('cuento-1', 'encanto');
    expect(gateway.reaccionar).toHaveBeenCalledWith(
      'cuento-1',
      'encanto',
      expect.stringMatching(/^reaccion:/),
    );
  });

  it('permite deshacer la reacción con tipo null', async () => {
    (gateway.reaccionar as jest.Mock).mockResolvedValue(undefined);
    await casoUso.ejecutar('cuento-1', null);
    expect(gateway.reaccionar).toHaveBeenCalledWith('cuento-1', null, expect.any(String));
  });
});
