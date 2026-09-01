import { Routes } from '@angular/router';

/**
 * DAEMON ARC — rutas del estudiante.
 *
 * Áreas canónicas: Inicio (`/alumno`), Aprender, Crear, Comunidad, Agenda e
 * Identidad. Cada área carga su propio archivo de rutas.
 *
 * Las rutas heredadas de `/alumno/*` se conservan como alias de compatibilidad
 * al final del archivo: los enlaces antiguos (incluidos los del sidebar, que
 * pertenece a otro flujo de trabajo) siguen funcionando y conservan sus
 * parámetros. Ningún alias apunta a otro alias, así que no hay ciclos.
 */
export const alumnoRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/panel-alumno/panel-alumno').then((m) => m.PanelAlumno),
  },
  {
    path: 'aprender',
    loadChildren: () => import('./aprender/aprender.routes').then((m) => m.aprenderRoutes),
    data: { preload: true },
  },
  {
    path: 'crear',
    loadChildren: () => import('./crear/crear.routes').then((m) => m.crearRoutes),
  },
  {
    path: 'comunidad',
    loadChildren: () => import('./comunidad/comunidad.routes').then((m) => m.comunidadRoutes),
  },
  {
    path: 'agenda',
    loadChildren: () => import('./agenda/agenda.routes').then((m) => m.agendaRoutes),
    data: { preload: true },
  },
  {
    path: 'identidad',
    loadChildren: () => import('./identidad/identidad.routes').then((m) => m.identidadRoutes),
  },
  {
    path: 'notificaciones',
    loadComponent: () =>
      import('../compartido/pages/notificaciones/notificaciones').then((m) => m.NotificacionesPage),
  },

  // ===== Compatibilidad con rutas heredadas =====
  // Aprender
  { path: 'recursos', redirectTo: 'aprender/explorar', pathMatch: 'full' },
  { path: 'desafios', redirectTo: 'aprender/misiones', pathMatch: 'full' },
  { path: 'misiones', redirectTo: 'aprender/misiones', pathMatch: 'full' },
  { path: 'misiones/:id/entregar', redirectTo: 'aprender/misiones/:id/entregar', pathMatch: 'full' },
  { path: 'misiones/:id', redirectTo: 'aprender/misiones/:id', pathMatch: 'full' },
  { path: 'evaluaciones', redirectTo: 'aprender/evaluaciones', pathMatch: 'full' },
  { path: 'resultados', redirectTo: 'aprender/evaluaciones/resultados', pathMatch: 'full' },

  // Crear
  { path: 'proyectos', redirectTo: 'crear/proyectos', pathMatch: 'full' },
  { path: 'proyectos/cuentos', redirectTo: 'crear/historias', pathMatch: 'full' },
  { path: 'proyectos/cuentos/crear', redirectTo: 'crear/historias/crear', pathMatch: 'full' },
  { path: 'proyectos/cuentos/:id', redirectTo: 'crear/historias/:id', pathMatch: 'full' },
  { path: 'cuentos', redirectTo: 'crear/historias', pathMatch: 'full' },
  { path: 'cuentos/crear', redirectTo: 'crear/historias/crear', pathMatch: 'full' },
  { path: 'cuentos/:id', redirectTo: 'crear/historias/:id', pathMatch: 'full' },
  { path: 'herramientas', redirectTo: 'crear/herramientas', pathMatch: 'full' },
  { path: 'herramientas/chatbot', redirectTo: 'crear/chatbot', pathMatch: 'full' },
  { path: 'herramientas/bot', redirectTo: 'crear/bot', pathMatch: 'full' },
  { path: 'herramientas/laboratorio', redirectTo: 'crear/laboratorio', pathMatch: 'full' },
  { path: 'herramientas/neuro-maze', redirectTo: 'crear/neuro-maze', pathMatch: 'full' },
  { path: 'herramientas/defensa-ia', redirectTo: 'crear/defensa-ia', pathMatch: 'full' },
  { path: 'herramientas/entrenamiento', redirectTo: 'crear/entrenamiento', pathMatch: 'full' },
  { path: 'chatbot', redirectTo: 'crear/chatbot', pathMatch: 'full' },
  { path: 'crear-bot', redirectTo: 'crear/bot', pathMatch: 'full' },
  { path: 'laboratorio', redirectTo: 'crear/laboratorio', pathMatch: 'full' },
  { path: 'laboratorio/neuro-maze', redirectTo: 'crear/neuro-maze', pathMatch: 'full' },
  { path: 'laboratorio/defensa-ia', redirectTo: 'crear/defensa-ia', pathMatch: 'full' },
  { path: 'laboratorio/entrenamiento-mascota', redirectTo: 'crear/entrenamiento', pathMatch: 'full' },

  // Comunidad
  { path: 'ranking', redirectTo: 'comunidad/ranking', pathMatch: 'full' },
  { path: 'competencia', redirectTo: 'comunidad/competencia', pathMatch: 'full' },
  { path: 'competencia/tv', redirectTo: 'comunidad/competencia/tv', pathMatch: 'full' },

  // Identidad
  { path: 'perfil', redirectTo: 'identidad/perfil', pathMatch: 'full' },
  { path: 'perfil/editar', redirectTo: 'identidad/perfil/editar', pathMatch: 'full' },
  { path: 'tienda', redirectTo: 'identidad/daems', pathMatch: 'full' },
  { path: 'canjes', redirectTo: 'identidad/daems/canjes', pathMatch: 'full' },
  { path: 'mascota', redirectTo: 'identidad/personalizacion', pathMatch: 'full' },
  { path: 'certificado', redirectTo: 'identidad/certificado', pathMatch: 'full' },
  { path: 'certificado/imprimir', redirectTo: 'identidad/certificado/imprimir', pathMatch: 'full' },
];
