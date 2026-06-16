import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion } from '../servicios/sesion';

export const alumnoGuard: CanActivateFn = () => inject(Sesion).usuario()?.rol === 'alumno' || inject(Router).createUrlTree(['/docente']);
