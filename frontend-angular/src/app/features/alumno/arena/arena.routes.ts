import { Routes } from '@angular/router';

/**
 * DAEMON ARC — Arena (área de producto reservada).
 *
 * El formato definitivo se definirá tras la etapa de descubrimiento de producto.
 * Mantiene únicamente la ruta canónica reservada /alumno/arena.
 */
export const arenaRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/arena/arena').then((m) => m.Arena),
  },
];
