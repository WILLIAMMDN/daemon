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
 * parámetros.
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
    path: 'notificaciones',
    loadComponent: () =>
      import('../compartido/pages/notificaciones/notificaciones').then((m) => m.NotificacionesPage),
  },

  // ===== Áreas todavía sin reestructurar (se migran en este mismo sprint) =====
  {
    path: 'herramientas',
    loadComponent: () => import('../herramientas/pages/herramientas/herramientas').then((m) => m.Herramientas),
    data: { preload: true },
  },
  {
    path: 'herramientas/chatbot',
    loadComponent: () => import('../chatbot/pages/chatbot-alumno/chatbot-alumno').then((m) => m.ChatbotAlumno),
  },
  {
    path: 'herramientas/bot',
    loadComponent: () => import('../chatbot/pages/crear-bot/crear-bot').then((m) => m.CrearBot),
  },
  {
    path: 'herramientas/laboratorio',
    loadComponent: () => import('../laboratorio/pages/lab-ia/lab-ia').then((m) => m.LabIa),
  },
  {
    path: 'herramientas/neuro-maze',
    loadComponent: () => import('../laboratorio/pages/neuro-maze/neuro-maze').then((m) => m.NeuroMaze),
  },
  {
    path: 'herramientas/defensa-ia',
    loadComponent: () => import('../laboratorio/pages/defensa-ia/defensa-ia').then((m) => m.DefensaIa),
  },
  {
    path: 'herramientas/entrenamiento',
    loadComponent: () =>
      import('../laboratorio/pages/entrenamiento-mascota/entrenamiento-mascota').then((m) => m.EntrenamientoMascota),
  },
  {
    path: 'proyectos',
    pathMatch: 'full',
    loadComponent: () => import('../proyectos/pages/proyectos/proyectos').then((m) => m.Proyectos),
    data: { preload: true },
  },
  {
    path: 'proyectos/cuentos',
    pathMatch: 'full',
    loadComponent: () => import('../cuentos/pages/galeria-proyectos/galeria-proyectos').then((m) => m.GaleriaProyectos),
    data: { preload: true },
  },
  {
    path: 'proyectos/cuentos/crear',
    loadComponent: () => import('../cuentos/pages/crear-cuento/crear-cuento').then((m) => m.CrearCuento),
  },
  {
    path: 'proyectos/cuentos/:id',
    loadComponent: () => import('../cuentos/pages/ver-cuento/ver-cuento').then((m) => m.VerCuento),
  },
  {
    path: 'comunidad',
    loadComponent: () => import('../comunidad/pages/comunidad/comunidad').then((m) => m.Comunidad),
    data: { preload: true },
  },
  {
    path: 'comunidad/perfil/:usuarioId',
    loadComponent: () => import('./pages/perfil-alumno/perfil-alumno').then((m) => m.PerfilAlumno),
  },
  {
    path: 'ranking',
    loadComponent: () => import('../ranking/pages/ranking/ranking').then((m) => m.Ranking),
    data: { preload: true },
  },
  {
    path: 'competencia',
    loadComponent: () => import('../competencia/pages/votar/votar').then((m) => m.Votar),
  },
  {
    path: 'competencia/tv',
    loadComponent: () => import('../competencia/pages/tv/tv').then((m) => m.Tv),
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil-alumno/perfil-alumno').then((m) => m.PerfilAlumno),
    data: { preload: true },
  },
  {
    path: 'perfil/editar',
    loadComponent: () => import('./pages/editar-perfil/editar-perfil').then((m) => m.EditarPerfil),
  },
  {
    path: 'tienda',
    loadComponent: () => import('../tienda/pages/tienda-alumno/tienda-alumno').then((m) => m.TiendaAlumno),
    data: { preload: true },
  },
  {
    path: 'canjes',
    loadComponent: () => import('../tienda/pages/mis-canjes/mis-canjes').then((m) => m.MisCanjes),
  },
  {
    path: 'mascota',
    loadComponent: () => import('../mascota/pages/vestidor-mascota/vestidor-mascota').then((m) => m.VestidorMascota),
    data: { preload: true },
  },
  {
    path: 'certificado',
    loadComponent: () => import('../certificados/pages/certificado/certificado').then((m) => m.Certificado),
    data: { preload: true },
  },
  {
    path: 'certificado/imprimir',
    loadComponent: () => import('../certificados/pages/imprimir-carnet/imprimir-carnet').then((m) => m.ImprimirCarnet),
  },

  // ===== Compatibilidad con rutas heredadas =====
  { path: 'recursos', redirectTo: 'aprender/explorar', pathMatch: 'full' },
  { path: 'desafios', redirectTo: 'aprender/misiones', pathMatch: 'full' },
  { path: 'misiones', redirectTo: 'aprender/misiones', pathMatch: 'full' },
  { path: 'misiones/:id/entregar', redirectTo: 'aprender/misiones/:id/entregar', pathMatch: 'full' },
  { path: 'misiones/:id', redirectTo: 'aprender/misiones/:id', pathMatch: 'full' },
  { path: 'evaluaciones', redirectTo: 'aprender/evaluaciones', pathMatch: 'full' },
  { path: 'resultados', redirectTo: 'aprender/evaluaciones/resultados', pathMatch: 'full' },
  { path: 'chatbot', redirectTo: 'herramientas/chatbot', pathMatch: 'full' },
  { path: 'crear-bot', redirectTo: 'herramientas/bot', pathMatch: 'full' },
  { path: 'cuentos', redirectTo: 'proyectos/cuentos', pathMatch: 'full' },
  { path: 'cuentos/crear', redirectTo: 'proyectos/cuentos/crear', pathMatch: 'full' },
  { path: 'cuentos/:id', redirectTo: 'proyectos/cuentos/:id' },
  { path: 'laboratorio', redirectTo: 'herramientas/laboratorio', pathMatch: 'full' },
  { path: 'laboratorio/neuro-maze', redirectTo: 'herramientas/neuro-maze', pathMatch: 'full' },
  { path: 'laboratorio/defensa-ia', redirectTo: 'herramientas/defensa-ia', pathMatch: 'full' },
  { path: 'laboratorio/entrenamiento-mascota', redirectTo: 'herramientas/entrenamiento', pathMatch: 'full' },
];
