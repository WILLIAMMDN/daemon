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
    ],
  },
  {
    path: 'curso/:cursoId',
    loadComponent: () => import('./pages/espacio-curso/espacio-curso').then((m) => m.EspacioCurso),
  },
  {
    path: 'curso/:cursoId/ruta',
    loadComponent: () => import('./pages/espacio-curso/espacio-curso').then((m) => m.EspacioCurso),
  },
  {
    path: 'curso/:cursoId/contenido',
    loadComponent: () => import('./pages/espacio-curso/espacio-curso').then((m) => m.EspacioCurso),
  },
  {
    path: 'curso/:cursoId/experiencia/:experienceId',
    loadComponent: () => import('./pages/espacio-curso/espacio-curso').then((m) => m.EspacioCurso),
  },
  {
    path: 'curso/:cursoId/progreso',
    loadComponent: () => import('./pages/espacio-curso/espacio-curso').then((m) => m.EspacioCurso),
  },
];
