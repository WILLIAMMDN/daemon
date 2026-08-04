import { of } from 'rxjs';
import { Autenticacion } from './autenticacion';
import type { Api } from './api';
import type { FirebaseAuth } from './firebase-auth';
import type { Sesion, UsuarioSesion } from './sesion';

describe('Autenticacion (login local -> Firebase)', () => {
  let api: { post: jest.Mock };
  let sesion: { guardar: jest.Mock; limpiar: jest.Mock; actualizarUsuario: jest.Mock; usuario: jest.Mock };
  let firebase: { disponible: jest.Mock; iniciarConCustomToken: jest.Mock; logout: jest.Mock };
  let servicio: Autenticacion;

  const usuario: UsuarioSesion = { id: 1, usuario: 'pepe', rol: 'alumno' } as UsuarioSesion;

  beforeEach(() => {
    api = { post: jest.fn() };
    sesion = {
      guardar: jest.fn(),
      limpiar: jest.fn(),
      actualizarUsuario: jest.fn(),
      usuario: jest.fn(),
    };
    firebase = {
      disponible: jest.fn(() => true),
      iniciarConCustomToken: jest.fn(() => Promise.resolve()),
      logout: jest.fn(() => Promise.resolve()),
    };
    servicio = new Autenticacion(api as unknown as Api, sesion as unknown as Sesion, firebase as unknown as FirebaseAuth);
  });

  it('guarda la sesion y vincula la identidad de Firebase con el token incluido en /auth/login', async () => {
    api.post.mockReturnValueOnce(of({ usuario, firebase_token: 'custom-token-abc' }));

    await new Promise<void>((resolve) => {
      servicio.login({ usuario: 'pepe', password: 'secreta' }).subscribe(() => resolve());
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenNthCalledWith(1, '/auth/login', { usuario: 'pepe', password: 'secreta' });
    expect(sesion.guardar).toHaveBeenCalledWith(usuario);
    expect(firebase.iniciarConCustomToken).toHaveBeenCalledWith('custom-token-abc');
  });

  it('no rompe el login local si signInWithCustomToken falla (best-effort)', async () => {
    api.post.mockReturnValueOnce(of({ usuario, firebase_token: 'custom-token-abc' }));
    firebase.iniciarConCustomToken.mockRejectedValueOnce(new Error('Firebase no disponible'));

    let emitido = false;
    await new Promise<void>((resolve) => {
      servicio.login({ usuario: 'pepe', password: 'secreta' }).subscribe({
        next: () => {
          emitido = true;
          resolve();
        },
        error: () => resolve(),
      });
    });

    expect(emitido).toBe(true);
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(sesion.guardar).toHaveBeenCalledWith(usuario);
    expect(firebase.iniciarConCustomToken).toHaveBeenCalledWith('custom-token-abc');
  });

  it('salta la vinculacion si la respuesta del login no incluye firebase_token', async () => {
    api.post.mockReturnValueOnce(of({ usuario }));

    await new Promise<void>((resolve) => {
      servicio.login({ usuario: 'pepe', password: 'secreta' }).subscribe(() => resolve());
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(sesion.guardar).toHaveBeenCalledWith(usuario);
    expect(firebase.iniciarConCustomToken).not.toHaveBeenCalled();
  });

  it('salta la vinculacion si Firebase Auth no esta disponible en el entorno', async () => {
    firebase.disponible.mockReturnValue(false);
    api.post.mockReturnValueOnce(of({ usuario, firebase_token: 'custom-token-abc' }));

    await new Promise<void>((resolve) => {
      servicio.login({ usuario: 'pepe', password: 'secreta' }).subscribe(() => resolve());
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(firebase.iniciarConCustomToken).not.toHaveBeenCalled();
  });
});
