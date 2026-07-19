import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  catchError,
  concat,
  EMPTY,
  finalize,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';
import { environment } from '../../../environments/environment';

export type ApiErrorKind = 'offline' | 'timeout';

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiGetOptions {
  /** Omite el valor almacenado y espera una respuesta nueva. */
  fresh?: boolean;
  /** Tiempo durante el cual el valor se considera completamente vigente. */
  freshForMs?: number;
  /** Tiempo máximo para mostrar el último valor mientras se actualiza en segundo plano. */
  retainForMs?: number;
}

interface GetCacheEntry {
  updatedAt: number;
  hasValue: boolean;
  value?: unknown;
  inFlight?: Observable<unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly http = inject(HttpClient);
  private readonly options = { withCredentials: true } as const;
  private readonly cacheGet = new Map<string, GetCacheEntry>();
  private readonly cacheFreshMs = 2 * 60 * 1000;
  private readonly cacheRetentionMs = 30 * 60 * 1000;
  private readonly requestTimeoutMs = 45000;
  readonly baseUrl = environment.apiUrl;

  get<T>(ruta: string, opciones: ApiGetOptions = {}): Observable<T> {
    const url = this.url(ruta);
    const ahora = Date.now();
    const freshForMs = opciones.freshForMs ?? this.cacheFreshMs;
    const retainForMs = Math.max(opciones.retainForMs ?? this.cacheRetentionMs, freshForMs);
    const cache = this.cacheGet.get(url);

    if (!opciones.fresh && cache?.hasValue) {
      const edad = ahora - cache.updatedAt;

      if (edad <= freshForMs) {
        return of(cache.value as T);
      }

      if (edad <= retainForMs) {
        // Stale-while-revalidate: la vista recibe el último valor de inmediato y
        // la red lo reemplaza silenciosamente. Un fallo de actualización no
        // borra contenido que el estudiante ya podía ver.
        return concat(
          of(cache.value as T),
          this.solicitudGet<T>(url).pipe(catchError(() => EMPTY)),
        );
      }

      this.cacheGet.delete(url);
    }

    return this.solicitudGet<T>(url);
  }

  post<T>(ruta: string, datos: unknown): Observable<T> {
    return this.conTimeout(this.http.post<T>(this.url(ruta), datos, this.options)).pipe(
      tap(() => this.invalidarTrasMutacion(ruta)),
    );
  }

  patch<T>(ruta: string, datos: unknown): Observable<T> {
    return this.conTimeout(this.http.patch<T>(this.url(ruta), datos, this.options)).pipe(
      tap(() => this.invalidarTrasMutacion(ruta)),
    );
  }

  put<T>(ruta: string, datos: unknown): Observable<T> {
    return this.conTimeout(this.http.put<T>(this.url(ruta), datos, this.options)).pipe(
      tap(() => this.invalidarTrasMutacion(ruta)),
    );
  }

  delete<T>(ruta: string): Observable<T> {
    return this.conTimeout(this.http.delete<T>(this.url(ruta), this.options)).pipe(
      tap(() => this.invalidarTrasMutacion(ruta)),
    );
  }

  private url(ruta: string): string {
    return `${this.baseUrl}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
  }

  private solicitudGet<T>(url: string): Observable<T> {
    const existente = this.cacheGet.get(url);
    if (existente?.inFlight) {
      return existente.inFlight as Observable<T>;
    }

    const cache = existente ?? { updatedAt: 0, hasValue: false };
    let solicitud!: Observable<T>;
    solicitud = this.conTimeout(this.http.get<T>(url, this.options)).pipe(
      tap((value) => {
        cache.value = value;
        cache.hasValue = true;
        cache.updatedAt = Date.now();
      }),
      catchError((error) => {
        if (!cache.hasValue && this.cacheGet.get(url) === cache) {
          this.cacheGet.delete(url);
        }
        return throwError(() => error);
      }),
      finalize(() => {
        if (cache.inFlight === solicitud) {
          cache.inFlight = undefined;
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    cache.inFlight = solicitud;
    this.cacheGet.set(url, cache);
    return solicitud;
  }

  private invalidarTrasMutacion(ruta: string): void {
    const scope = this.scope(ruta);
    const rutaLimpia = `/${ruta.split('?')[0].split('/').filter(Boolean).join('/')}`;
    if (!scope || scope === 'auth') {
      this.cacheGet.clear();
      return;
    }

    const relacionados = new Set([scope]);

    // Estas operaciones cambian cifras que también aparecen en el resumen del
    // alumno. Se invalidan solo sus dependencias reales, no toda la aplicación.
    if (['misiones', 'tienda', 'evaluaciones', 'competencia'].includes(scope)) {
      relacionados.add('alumno');
    }
    if (scope === 'tienda') {
      relacionados.add('mascota');
    }
    if (['misiones', 'evaluaciones', 'competencia'].includes(scope)) {
      relacionados.add('ranking');
    }
    if (scope === 'alumno') {
      relacionados.add('comunidad');
    }
    const cambiaProyecto = ['cuentos', 'ia-modelos', 'neuro-maze'].includes(scope)
      || rutaLimpia === '/chatbot/bot'
      || rutaLimpia === '/chatbot/cerebro';
    if (cambiaProyecto) {
      // El hub de Proyectos agrega estos artefactos. Se invalida únicamente
      // ese agregado para conservar calientes el panel y los demás módulos.
      this.cacheGet.delete(this.url('/alumno/proyectos'));
    }

    for (const key of this.cacheGet.keys()) {
      if ([...relacionados].some((item) => this.perteneceAlScope(key, item))) {
        this.cacheGet.delete(key);
      }
    }
  }

  private scope(ruta: string): string {
    return ruta.split('?')[0].split('/').filter(Boolean)[0] ?? '';
  }

  private perteneceAlScope(url: string, scope: string): boolean {
    const prefijo = this.url(`/${scope}`);
    return url === prefijo || url.startsWith(`${prefijo}/`) || url.startsWith(`${prefijo}?`);
  }

  private conTimeout<T>(peticion: Observable<T>): Observable<T> {
    return peticion.pipe(
      timeout({ first: this.requestTimeoutMs }),
      catchError((error) => throwError(() => this.normalizarError(error))),
    );
  }

  private normalizarError(error: unknown): unknown {
    if (error instanceof TimeoutError) {
      return new ApiError('timeout', 'La conexion esta tardando mas de lo esperado.');
    }

    if (error instanceof HttpErrorResponse && error.status === 0) {
      return new ApiError('offline', 'No pudimos conectar con DAEMON.');
    }

    return error;
  }
}
