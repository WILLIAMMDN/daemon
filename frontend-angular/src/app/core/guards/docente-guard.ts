import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion } from '../servicios/sesion';

export const docenteGuard: CanActivateFn = () => {
  const sesion = inject(Sesion);
  return sesion.esDocente() || inject(Router).createUrlTree([sesion.rutaInicio()]);
};
