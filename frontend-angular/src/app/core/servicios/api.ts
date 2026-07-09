import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, Observable, shareReplay, throwError, timeout, TimeoutError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly http = inject(HttpClient);
  private readonly options = { withCredentials: true } as const;
  private readonly cacheGet = new Map<string, { expira: number; respuesta: Observable<unknown> }>();
  private readonly cacheGetMs = 30000;
  private readonly requestTimeoutMs = 45000;
  readonly baseUrl = environment.apiUrl;

  get<T>(ruta: string): Observable<T> {
    const url = this.url(ruta);
    const ahora = Date.now();
    const cache = this.cacheGet.get(url);

    if (cache && cache.expira > ahora) {
      return cache.respuesta as Observable<T>;
    }

    const respuesta = this.conTimeout(this.http.get<T>(url, this.options)).pipe(
      catchError((error) => {
        this.cacheGet.delete(url);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.cacheGet.set(url, { expira: ahora + this.cacheGetMs, respuesta });

    return respuesta;
  }

  post<T>(ruta: string, datos: unknown): Observable<T> {
    this.limpiarCacheGet();
    return this.conTimeout(this.http.post<T>(this.url(ruta), datos, this.options));
  }

  patch<T>(ruta: string, datos: unknown): Observable<T> {
    this.limpiarCacheGet();
    return this.conTimeout(this.http.patch<T>(this.url(ruta), datos, this.options));
  }

  put<T>(ruta: string, datos: unknown): Observable<T> {
    this.limpiarCacheGet();
    return this.conTimeout(this.http.put<T>(this.url(ruta), datos, this.options));
  }

  delete<T>(ruta: string): Observable<T> {
    this.limpiarCacheGet();
    return this.conTimeout(this.http.delete<T>(this.url(ruta), this.options));
  }

  private url(ruta: string): string {
    return `${this.baseUrl}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
  }

  private limpiarCacheGet(): void {
    this.cacheGet.clear();
  }

  private conTimeout<T>(peticion: Observable<T>): Observable<T> {
    return peticion.pipe(
      timeout({ first: this.requestTimeoutMs }),
      catchError((error) => throwError(() => this.normalizarError(error))),
    );
  }

  private normalizarError(error: unknown): unknown {
    if (error instanceof TimeoutError) {
      return new Error(this.mensajeConexionApi('La API tardo demasiado en responder'));
    }

    if (error instanceof HttpErrorResponse && error.status === 0) {
      return new Error(this.mensajeConexionApi('No se pudo conectar con la API'));
    }

    return error;
  }

  private mensajeConexionApi(prefijo: string): string {
    const ayuda = this.baseUrl.includes('localhost')
      ? ' Si estas usando ng serve, inicia Laravel en backend-laravel con: php artisan serve --host=127.0.0.1 --port=8000.'
      : ' Revisa tu conexion e intenta nuevamente.';

    return `${prefijo} (${this.baseUrl}).${ayuda}`;
  }
}
