import { Routes } from '@angular/router';

/**
 * DAEMON ARC — Arena (concurso y competencia en vivo).
 *
 * Establece la propiedad del producto para competencias en vivo vinculadas a
 * cursos sin datos simulados ni mecánicas de juego inventadas.
 */
export const arenaRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/arena/arena').then((m) => m.Arena),
  },
  {
    path: 'torneos',
    loadComponent: () => import('./pages/arena/arena').then((m) => m.Arena),
  },
  {
    path: 'partida/:matchId',
    loadComponent: () => import('./pages/arena/arena').then((m) => m.Arena),
  },
  {
    path: 'resultados/:matchId',
    loadComponent: () => import('./pages/arena/arena').then((m) => m.Arena),
  },
];
