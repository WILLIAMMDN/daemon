import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion } from '../servicios/sesion';

export const authGuard: CanActivateFn = () => inject(Sesion).autenticado() || inject(Router).createUrlTree(['/login']);
