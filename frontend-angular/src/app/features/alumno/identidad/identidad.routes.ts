import { Routes } from '@angular/router';

/**
 * Identidad — rutas internas del área.
 *
 * “Mis canjes” es historial de la economía, no una aplicación aparte: cuelga de
 * Daems.
 */
export const identidadRoutes: Routes = [
  {
    path: 'perfil/editar',
    loadComponent: () => import('../pages/editar-perfil/editar-perfil').then((m) => m.EditarPerfil),
  },
  {
    path: 'daems/canjes',
    loadComponent: () => import('../../tienda/pages/mis-canjes/mis-canjes').then((m) => m.MisCanjes),
  },
  {
    path: '',
    loadComponent: () => import('./pages/identidad/identidad').then((m) => m.Identidad),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'perfil' },
      {
        path: 'perfil',
        loadComponent: () => import('../pages/perfil-alumno/perfil-alumno').then((m) => m.PerfilAlumno),
        data: { arcTituloPropio: true, preload: true },
      },
      {
        path: 'progreso',
        loadComponent: () => import('./pages/progreso-logros/progreso-logros').then((m) => m.ProgresoLogros),
      },
      {
        path: 'personalizacion',
        loadComponent: () =>
          import('../../mascota/pages/vestidor-mascota/vestidor-mascota').then((m) => m.VestidorMascota),
        data: { arcTituloPropio: true, preload: true },
      },
      {
        path: 'daems',
        loadComponent: () => import('../../tienda/pages/tienda-alumno/tienda-alumno').then((m) => m.TiendaAlumno),
        data: { arcTituloPropio: true, preload: true },
      },
    ],
  },
];
