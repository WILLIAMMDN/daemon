import { of, throwError } from 'rxjs';
import { Activos } from '../../../../core/servicios/activos';
import { Api } from '../../../../core/servicios/api';
import { ChatbotAlumno } from './chatbot-alumno';

describe('ChatbotAlumno', () => {
  const activos = { url: (ruta?: string | null) => ruta ?? '' } as Activos;

  function crearApi(get: jest.Mock) {
    return {
      get,
      post: jest.fn(),
      delete: jest.fn(() => of({})),
    } as unknown as Api;
  }

  it('no carga el historial ni deja un spinner si el bot no existe', () => {
    const get = jest.fn(() => of(null));
    const componente = new ChatbotAlumno(crearApi(get), activos);

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/chatbot/bot');
    expect(componente.bot()).toBeNull();
    expect(componente.cargando()).toBe(false);
    expect(componente.mensajesFormateados()).toEqual([]);
  });

  it('monta el chat solo después de cargar bot e historial', () => {
    const get = jest.fn()
      .mockReturnValueOnce(of({ nombre_bot: 'Ada' }))
      .mockReturnValueOnce(of([{ role: 'user', content: 'Hola' }, { role: 'assistant', content: '¡Hola!' }]));
    const componente = new ChatbotAlumno(crearApi(get), activos);

    expect(get.mock.calls).toEqual([['/chatbot/bot'], ['/chatbot/mensajes']]);
    expect(componente.cargando()).toBe(false);
    expect(componente.error()).toBe('');
    expect(componente.mensajesFormateados()).toEqual([
      { role: 'user', text: 'Hola' },
      { role: 'ai', text: '¡Hola!' },
    ]);
  });

  it('sale del estado de carga y permite reintentar cuando falla la API', () => {
    const get = jest.fn(() => throwError(() => ({ error: { message: 'Servicio no disponible' } })));
    const componente = new ChatbotAlumno(crearApi(get), activos);

    expect(componente.cargando()).toBe(false);
    expect(componente.error()).toBe('Servicio no disponible');
  });
});
