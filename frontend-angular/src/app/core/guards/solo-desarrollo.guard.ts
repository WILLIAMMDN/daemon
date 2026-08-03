import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

/**
 * Guard de catálogos internos: solo accesible fuera de producción.
 * En producción redirige al inicio sin registrar error.
 */
export const soloDesarrolloGuard: CanActivateFn = () => {
  if (environment.production) {
    return inject(Router).createUrlTree(['/']);
  }
  return true;
};
