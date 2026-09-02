import { Routes } from '@angular/router';

/**
 * DAEMON ARC — rutas del estudiante (IA V2).
 *
 * Áreas canónicas (5 destinos de primer nivel):
 * - Inicio (`/alumno`)
 * - Aprender (`/alumno/aprender`)
 * - Arena (`/alumno/arena`)
 * - Agenda (`/alumno/agenda`)
 * - Identidad (`/alumno/identidad`)
 *
 * Cada área carga perezosamente su propio archivo de rutas modulares.
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
    path: 'arena',
    loadChildren: () => import('./arena/arena.routes').then((m) => m.arenaRoutes),
    data: { preload: true },
  },
  {
    path: 'agenda',
    loadChildren: () => import('./agenda/agenda.routes').then((m) => m.agendaRoutes),
    data: { preload: true },
  },
  {
    path: 'identidad',
    loadChildren: () => import('./identidad/identidad.routes').then((m) => m.identidadRoutes),
    data: { preload: true },
  },
  {
    path: 'notificaciones',
    loadComponent: () =>
      import('../compartido/pages/notificaciones/notificaciones').then((m) => m.NotificacionesPage),
  },

  // ===== Compatibilidad mínima documentada =====
  // Alias mínimos preservados para enlaces directos históricos de perfil y tienda
  { path: 'perfil', redirectTo: 'identidad/perfil', pathMatch: 'full' },
  { path: 'tienda', redirectTo: 'identidad/daems', pathMatch: 'full' },
];
