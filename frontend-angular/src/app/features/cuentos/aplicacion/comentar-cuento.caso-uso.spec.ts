import { TestBed } from '@angular/core/testing';
import {
  COMANDOS_CUENTO_GATEWAY,
  type ComandosCuentoGateway,
} from '../acceso-datos/comandos-cuento.gateway';
import { ErrorCuento } from '../dominio/errores-cuento';
import { ComentarCuentoCasoUso } from './comentar-cuento.caso-uso';

describe('ComentarCuentoCasoUso', () => {
  let casoUso: ComentarCuentoCasoUso;
  const gateway = {
    comentar: jest.fn(),
    editarComentario: jest.fn(),
    eliminarComentario: jest.fn(),
  } as unknown as ComandosCuentoGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        ComentarCuentoCasoUso,
        { provide: COMANDOS_CUENTO_GATEWAY, useValue: gateway },
      ],
    });
    casoUso = TestBed.inject(ComentarCuentoCasoUso);
  });

  it('recorta el comentario y delega con clave de idempotencia', async () => {
    (gateway.comentar as jest.Mock).mockResolvedValue({ id: 'c-1' });
    await casoUso.ejecutar('cuento-1', '  ¡Hola!  ');
    expect(gateway.comentar).toHaveBeenCalledWith(
      'cuento-1',
      '¡Hola!',
      expect.stringMatching(/^comentario:cuento-1:/),
    );
  });

  it('rechaza comentarios vacíos y excesivos sin llamar al gateway', () => {
    expect(() => casoUso.ejecutar('cuento-1', '   ')).toThrow(ErrorCuento);
    expect(() => casoUso.ejecutar('cuento-1', 'a'.repeat(1001))).toThrow(ErrorCuento);
    expect(gateway.comentar).not.toHaveBeenCalled();
  });
});
