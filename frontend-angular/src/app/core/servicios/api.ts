import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly http = inject(HttpClient);
  readonly baseUrl = environment.apiUrl;

  get<T>(ruta: string): Observable<T> { return this.http.get<T>(this.url(ruta)); }
  post<T>(ruta: string, datos: unknown): Observable<T> { return this.http.post<T>(this.url(ruta), datos); }
  put<T>(ruta: string, datos: unknown): Observable<T> { return this.http.put<T>(this.url(ruta), datos); }
  delete<T>(ruta: string): Observable<T> { return this.http.delete<T>(this.url(ruta)); }

  private url(ruta: string): string {
    return `${this.baseUrl}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
  }
}
