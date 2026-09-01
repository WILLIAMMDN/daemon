import { Routes } from '@angular/router';

/**
 * Aprender — rutas internas del área.
 *
 * Las pestañas estables son Mis aprendizajes, Explorar y Rutas. El espacio de un
 * curso, las misiones y las evaluaciones son destinos contextuales: viven dentro
 * de Aprender pero no son pestañas del área, y traen su propio `<h1>`
 * (`arcTituloPropio`) para conservar el orden de encabezados.
 */
export const aprenderRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/aprender/aprender').then((m) => m.Aprender),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'mis-aprendizajes' },
      {
        path: 'mis-aprendizajes',
        loadComponent: () => import('./pages/mis-aprendizajes/mis-aprendizajes').then((m) => m.MisAprendizajes),
      },
      {
        path: 'explorar',
        loadComponent: () => import('../pages/recursos/recursos').then((m) => m.Recursos),
        data: { arcTituloPropio: true },
      },
      {
        path: 'rutas',
        loadComponent: () => import('./pages/rutas-aprendizaje/rutas-aprendizaje').then((m) => m.RutasAprendizaje),
      },
    ],
  },
  {
    path: 'curso/:cursoId',
    loadComponent: () => import('./pages/espacio-curso/espacio-curso').then((m) => m.EspacioCurso),
  },
  {
    path: 'misiones',
    loadComponent: () => import('../../misiones/pages/lista-misiones/lista-misiones').then((m) => m.ListaMisiones),
    data: { preload: true },
  },
  {
    path: 'misiones/:id',
    loadComponent: () => import('../../misiones/pages/detalle-mision/detalle-mision').then((m) => m.DetalleMision),
  },
  {
    path: 'misiones/:id/entregar',
    loadComponent: () => import('../../misiones/pages/entregar-mision/entregar-mision').then((m) => m.EntregarMision),
  },
  {
    path: 'evaluaciones',
    loadComponent: () => import('../../evaluaciones/pages/examen-live/examen-live').then((m) => m.ExamenLive),
    data: { preload: true },
  },
  {
    path: 'evaluaciones/resultados',
    loadComponent: () =>
      import('../../evaluaciones/pages/resultados-examen/resultados-examen').then((m) => m.ResultadosExamen),
  },
];
