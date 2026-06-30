import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, Observable, shareReplay, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly http = inject(HttpClient);
  private readonly options = { withCredentials: true } as const;
  private readonly cacheGet = new Map<string, { expira: number; respuesta: Observable<unknown> }>();
  private readonly cacheGetMs = 30000;
  readonly baseUrl = environment.apiUrl;

  get<T>(ruta: string): Observable<T> {
    const url = this.url(ruta);
    const ahora = Date.now();
    const cache = this.cacheGet.get(url);

    if (cache && cache.expira > ahora) {
      return cache.respuesta as Observable<T>;
    }

    const respuesta = this.http.get<T>(url, this.options).pipe(
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
    return this.http.post<T>(this.url(ruta), datos, this.options);
  }

  patch<T>(ruta: string, datos: unknown): Observable<T> {
    this.limpiarCacheGet();
    return this.http.patch<T>(this.url(ruta), datos, this.options);
  }

  put<T>(ruta: string, datos: unknown): Observable<T> {
    this.limpiarCacheGet();
    return this.http.put<T>(this.url(ruta), datos, this.options);
  }

  delete<T>(ruta: string): Observable<T> {
    this.limpiarCacheGet();
    return this.http.delete<T>(this.url(ruta), this.options);
  }

  private url(ruta: string): string {
    return `${this.baseUrl}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
  }

  private limpiarCacheGet(): void {
    this.cacheGet.clear();
  }
}
