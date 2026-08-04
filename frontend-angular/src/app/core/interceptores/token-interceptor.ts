import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Sesion } from '../servicios/sesion';
import { CargaGlobal } from '../servicios/carga-global';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(Sesion);
  const router = inject(Router);
  const cargaGlobal = inject(CargaGlobal);
  const toast = inject(NzMessageService);
  const peticion = req.clone({ setHeaders: { Accept: 'application/json' }, withCredentials: true });
  // El asistente de cuentos responde 503 cuando el proveedor de IA no está
  // configurado (IA_NO_DISPONIBLE). Es un error de dominio, no un cold start:
  // no debe mostrar el aviso de "servidor encendiendo".
  const esAsistenteCuentosIA = peticion.url.includes('/cuentos-v2/ia/');

  return next(peticion).pipe(catchError((error: HttpErrorResponse) => {
    // Desbloquear UI en caso de error
    cargaGlobal.ocultar();

    if (error.status === 401) {
      sesion.limpiar();
      router.navigateByUrl('/login');
    } else if ((error.status === 503 || error.status === 504) && !esAsistenteCuentosIA) {
      toast.warning(
        'El servidor se está encendiendo (tarda ~1 min). Espera un momento y vuelve a intentarlo.', 
        { nzDuration: 5000 }
      );
    }
    return throwError(() => error);
  }));
};
