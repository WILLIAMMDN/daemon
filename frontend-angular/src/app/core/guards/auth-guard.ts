import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion } from '../servicios/sesion';

export const authGuard: CanActivateFn = (_route, state) => {
  const sesion = inject(Sesion);
  const router = inject(Router);

  if (!sesion.autenticado()) {
    return router.createUrlTree(['/login']);
  }

  const usuario = sesion.usuario();
  const esBienvenida = state.url.split('?')[0] === '/bienvenida';

  if (usuario?.perfil_completo === false && !esBienvenida) {
    return router.createUrlTree(['/bienvenida']);
  }

  if (usuario?.perfil_completo !== false && esBienvenida) {
    return router.createUrlTree([sesion.esDocente() ? '/docente' : '/alumno']);
  }

  return true;
};
