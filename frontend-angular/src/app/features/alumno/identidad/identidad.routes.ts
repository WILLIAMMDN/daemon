import { Routes } from '@angular/router';

/**
 * Identidad — rutas internas del área.
 *
 * “Mis canjes” es historial de la economía, no una aplicación aparte: cuelga de
 * Daems. El certificado y el carnet son documentos contextuales y se alcanzan
 * desde Progreso y logros.
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
    path: 'certificado',
    pathMatch: 'full',
    loadComponent: () => import('../../certificados/pages/certificado/certificado').then((m) => m.Certificado),
    data: { preload: true },
  },
  {
    path: 'certificado/imprimir',
    loadComponent: () =>
      import('../../certificados/pages/imprimir-carnet/imprimir-carnet').then((m) => m.ImprimirCarnet),
  },
  {
    path: '',
    loadComponent: () => import('./pages/identidad/identidad').then((m) => m.Identidad),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'resumen' },
      {
        path: 'resumen',
        loadComponent: () => import('./pages/resumen-identidad/resumen-identidad').then((m) => m.ResumenIdentidad),
      },
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
