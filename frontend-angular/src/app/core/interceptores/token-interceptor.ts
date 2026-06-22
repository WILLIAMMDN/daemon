import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Sesion } from '../servicios/sesion';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(Sesion);
  const router = inject(Router);
  const token = sesion.token();
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }) : req;
  return next(peticion).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 401) {
      sesion.limpiar();
      router.navigateByUrl('/login');
    }
    return throwError(() => error);
  }));
};
