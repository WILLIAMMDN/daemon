import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Sesion } from '../servicios/sesion';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(Sesion);
  const token = sesion.token();
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }) : req;
  return next(peticion).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 401) { sesion.limpiar(); }
    return throwError(() => error);
  }));
};
