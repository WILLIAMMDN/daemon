import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion } from '../servicios/sesion';

export const tutorGuard: CanActivateFn = () => {
  const sesion = inject(Sesion);
  const router = inject(Router);

  if (!sesion.autenticado()) return router.createUrlTree(['/familias/acceso']);

  return sesion.esTutor() || router.createUrlTree([sesion.rutaInicio()]);
};
