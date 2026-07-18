import { routes } from './app.routes';

describe('rutas principales del portal alumno', () => {
  it('precarga las entradas visibles del sidebar sin incluir experiencias internas', () => {
    const portal = routes.find((route) => route.path === 'alumno');
    const rutasPrincipales = [
      'perfil',
      'misiones',
      'herramientas',
      'recursos',
      'tienda',
      'evaluaciones',
      'cuentos',
      'ranking',
      'comunidad',
      'certificado',
    ];

    expect(portal?.children).toBeDefined();
    for (const path of rutasPrincipales) {
      const route = portal?.children?.find((child) => child.path === path);
      expect(route?.data?.['preload']).toBe(true);
    }

    const chatbot = portal?.children?.find((child) => child.path === 'herramientas/chatbot');
    expect(chatbot?.data?.['preload']).not.toBe(true);
  });
});
