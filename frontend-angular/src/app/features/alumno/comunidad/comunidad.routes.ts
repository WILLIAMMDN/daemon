import { Routes } from '@angular/router';

/**
 * Comunidad — rutas internas del área.
 *
 * El ranking y la competencia son destinos contextuales, no pestañas: la
 * clasificación no es el concepto principal del área. Se enlazan desde
 * Descubrir y Eventos y conservan sus URLs.
 *
 * No hay pestaña “Feed”: la plataforma sólo expone mensajería de comunidad para
 * docentes, así que una pestaña vacía permanente sería peor que no tenerla.
 */
export const comunidadRoutes: Routes = [
  {
    path: 'perfil/:usuarioId',
    loadComponent: () => import('../pages/perfil-alumno/perfil-alumno').then((m) => m.PerfilAlumno),
  },
  {
    path: 'ranking',
    loadComponent: () => import('../../ranking/pages/ranking/ranking').then((m) => m.Ranking),
    data: { preload: true },
  },
  {
    path: 'competencia',
    pathMatch: 'full',
    loadComponent: () => import('../../competencia/pages/votar/votar').then((m) => m.Votar),
  },
  {
    path: 'competencia/tv',
    loadComponent: () => import('../../competencia/pages/tv/tv').then((m) => m.Tv),
  },
  {
    path: '',
    loadComponent: () => import('./pages/comunidad-area/comunidad-area').then((m) => m.ComunidadArea),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'descubrir' },
      {
        path: 'descubrir',
        loadComponent: () => import('./pages/descubrir/descubrir').then((m) => m.Descubrir),
      },
      {
        path: 'proyectos',
        loadComponent: () =>
          import('../../cuentos/pages/galeria-proyectos/galeria-proyectos').then((m) => m.GaleriaProyectos),
        data: { arcTituloPropio: true },
      },
      {
        path: 'perfiles',
        loadComponent: () => import('../../comunidad/pages/comunidad/comunidad').then((m) => m.Comunidad),
        data: { arcTituloPropio: true, preload: true },
      },
      {
        path: 'eventos',
        loadComponent: () => import('./pages/eventos/eventos').then((m) => m.Eventos),
      },
    ],
  },
];
