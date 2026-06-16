import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion } from '../servicios/sesion';

export const docenteGuard: CanActivateFn = () => inject(Sesion).esDocente() || inject(Router).createUrlTree(['/alumno']);
