import { Routes } from '@angular/router';

/**
 * Agenda — rutas internas del área.
 *
 * No hay pestaña “Sesiones”: la plataforma no expone todavía sesiones
 * programadas ni fechas de vencimiento, y una pestaña permanentemente vacía es
 * peor que no tenerla. El contrato pendiente queda anotado en el informe.
 */
export const agendaRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/agenda/agenda').then((m) => m.Agenda),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'hoy' },
      { path: 'hoy', loadComponent: () => import('./pages/hoy/hoy').then((m) => m.Hoy) },
      {
        path: 'sesiones',
        loadComponent: () => import('./pages/sesiones/sesiones').then((m) => m.Sesiones),
      },
      {
        path: 'proximamente',
        loadComponent: () => import('./pages/proximamente/proximamente').then((m) => m.Proximamente),
      },
      { path: 'entregas', loadComponent: () => import('./pages/entregas/entregas').then((m) => m.Entregas) },
    ],
  },
];
