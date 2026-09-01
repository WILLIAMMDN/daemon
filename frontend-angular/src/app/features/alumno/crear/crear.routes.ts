import { Routes } from '@angular/router';

/**
 * Crear — rutas internas del área.
 *
 * Las rutas contextuales (historias y cada herramienta del laboratorio) van
 * primero para que el enrutador las resuelva antes que la ruta vacía del área;
 * así `crear/herramientas` abre el hub y `crear/laboratorio` abre la estación,
 * sin ambigüedad de prefijos.
 */
export const crearRoutes: Routes = [
  {
    path: 'historias',
    pathMatch: 'full',
    loadComponent: () =>
      import('../../cuentos/pages/galeria-proyectos/galeria-proyectos').then((m) => m.GaleriaProyectos),
    data: { preload: true },
  },
  {
    path: 'historias/crear',
    loadComponent: () => import('../../cuentos/pages/crear-cuento/crear-cuento').then((m) => m.CrearCuento),
  },
  {
    path: 'historias/:id',
    loadComponent: () => import('../../cuentos/pages/ver-cuento/ver-cuento').then((m) => m.VerCuento),
  },
  {
    path: 'chatbot',
    loadComponent: () => import('../../chatbot/pages/chatbot-alumno/chatbot-alumno').then((m) => m.ChatbotAlumno),
  },
  {
    path: 'bot',
    loadComponent: () => import('../../chatbot/pages/crear-bot/crear-bot').then((m) => m.CrearBot),
  },
  {
    path: 'laboratorio',
    loadComponent: () => import('../../laboratorio/pages/lab-ia/lab-ia').then((m) => m.LabIa),
  },
  {
    path: 'neuro-maze',
    loadComponent: () => import('../../laboratorio/pages/neuro-maze/neuro-maze').then((m) => m.NeuroMaze),
  },
  {
    path: 'defensa-ia',
    loadComponent: () => import('../../laboratorio/pages/defensa-ia/defensa-ia').then((m) => m.DefensaIa),
  },
  {
    path: 'entrenamiento',
    loadComponent: () =>
      import('../../laboratorio/pages/entrenamiento-mascota/entrenamiento-mascota').then((m) => m.EntrenamientoMascota),
  },
  {
    path: '',
    loadComponent: () => import('./pages/crear/crear').then((m) => m.Crear),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'proyectos' },
      {
        path: 'proyectos',
        loadComponent: () => import('../../proyectos/pages/proyectos/proyectos').then((m) => m.Proyectos),
        data: { arcTituloPropio: true, preload: true },
      },
      {
        path: 'estudio',
        loadComponent: () => import('./pages/estudio/estudio').then((m) => m.Estudio),
      },
      {
        path: 'herramientas',
        loadComponent: () => import('../../herramientas/pages/herramientas/herramientas').then((m) => m.Herramientas),
        data: { arcTituloPropio: true },
      },
      {
        path: 'portafolio',
        loadComponent: () => import('./pages/portafolio/portafolio').then((m) => m.Portafolio),
      },
    ],
  },
];
