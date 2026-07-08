import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

export interface Notificacion {
  id: number;
  usuario_id: number;
  titulo: string;
  mensaje: string;
  url_accion: string | null;
  leida: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private readonly baseUrl = `${environment.apiUrl}/notificaciones`;
  
  // State signal to hold notifications for components
  readonly notificaciones = signal<Notificacion[]>([]);
  
  // Computed signal for unread count
  readonly noLeidas = signal<number>(0);

  constructor(private http: HttpClient) {}

  cargarNotificaciones(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(this.baseUrl).pipe(
      tap((data) => {
        this.notificaciones.set(data);
        this.actualizarConteoNoLeidas(data);
      })
    );
  }

  marcarTodasComoLeidas(): Observable<any> {
    return this.http.post(`${this.baseUrl}/marcar-todas`, {}).pipe(
      tap(() => {
        const actualizadas = this.notificaciones().map(n => ({ ...n, leida: true }));
        this.notificaciones.set(actualizadas);
        this.noLeidas.set(0);
      })
    );
  }

  marcarComoLeida(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/marcar-leida`, {}).pipe(
      tap(() => {
        const actualizadas = this.notificaciones().map(n => 
          n.id === id ? { ...n, leida: true } : n
        );
        this.notificaciones.set(actualizadas);
        this.actualizarConteoNoLeidas(actualizadas);
      })
    );
  }
  
  private actualizarConteoNoLeidas(data: Notificacion[]): void {
    const conteo = data.filter(n => !n.leida).length;
    this.noLeidas.set(conteo);
  }
}
