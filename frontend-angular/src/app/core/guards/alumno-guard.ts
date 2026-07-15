import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion } from '../servicios/sesion';

export const alumnoGuard: CanActivateFn = () => {
  const sesion = inject(Sesion);
  return sesion.esAlumno() || inject(Router).createUrlTree([sesion.rutaInicio()]);
};
