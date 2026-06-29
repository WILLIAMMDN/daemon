import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly http = inject(HttpClient);
  private readonly options = { withCredentials: true } as const;
  readonly baseUrl = environment.apiUrl;

  get<T>(ruta: string): Observable<T> { return this.http.get<T>(this.url(ruta), this.options); }
  post<T>(ruta: string, datos: unknown): Observable<T> { return this.http.post<T>(this.url(ruta), datos, this.options); }
  patch<T>(ruta: string, datos: unknown): Observable<T> { return this.http.patch<T>(this.url(ruta), datos, this.options); }
  put<T>(ruta: string, datos: unknown): Observable<T> { return this.http.put<T>(this.url(ruta), datos, this.options); }
  delete<T>(ruta: string): Observable<T> { return this.http.delete<T>(this.url(ruta), this.options); }

  private url(ruta: string): string {
    return `${this.baseUrl}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
  }
}
