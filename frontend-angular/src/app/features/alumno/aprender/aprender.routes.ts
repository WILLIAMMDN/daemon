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
      { path: '', pathMatch: 'full', redirectTo: 'mis-cursos' },
      {
        path: 'mis-cursos',
        loadComponent: () => import('./pages/mis-cursos/mis-cursos').then((m) => m.MisCursos),
      },
      {
        path: 'explorar',
        loadComponent: () => import('./pages/explorar/explorar').then((m) => m.Explorar),
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
    loadComponent: () => import('./pages/experiencia/experiencia').then((m) => m.Experiencia),
  },
  {
    path: 'curso/:cursoId/progreso',
    loadComponent: () => import('./pages/espacio-curso/espacio-curso').then((m) => m.EspacioCurso),
  },
];
