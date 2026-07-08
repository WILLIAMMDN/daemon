import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { Sesion } from './sesion';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as any).Pusher = Pusher;

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
  public echo: Echo<any> | null = null;
  private readonly sesion = inject(Sesion);
  
  readonly notificaciones = signal<Notificacion[]>([]);
  readonly noLeidas = signal<number>(0);

  constructor(private http: HttpClient) {}

  cargarNotificaciones(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(this.baseUrl).pipe(
      tap((data) => {
        this.notificaciones.set(data);
        this.actualizarConteoNoLeidas(data);
        this.conectarWebSockets();
      })
    );
  }

  private conectarWebSockets(): void {
    const usuario = this.sesion.usuario();
    if (!usuario || this.echo) return;

    this.echo = new Echo({
      broadcaster: 'pusher',
      key: environment.pusher.key,
      cluster: environment.pusher.cluster,
      forceTLS: true,
      authorizer: (channel: any) => {
        return {
          authorize: (socketId: string, callback: Function) => {
            const authUrl = environment.apiUrl.replace('/api/v1', '') + '/broadcasting/auth';
            this.http.post(authUrl, {
              socket_id: socketId,
              channel_name: channel.name
            }, { withCredentials: true }).subscribe({
              next: (data) => callback(false, data),
              error: (error) => callback(true, error)
            });
          }
        };
      }
    });

    this.echo.private(`App.Models.Usuario.${usuario.id}`)
      .listen('NuevaNotificacion', (e: any) => {
        // Al recibir una notificacion, la agregamos al inicio de la lista
        const nuevaNotificacion = e as Notificacion;
        this.notificaciones.update(actuales => [nuevaNotificacion, ...actuales]);
        this.noLeidas.update(conteo => conteo + 1);
      });
  }

  desconectarWebSockets(): void {
    if (this.echo && this.sesion.usuario()) {
      this.echo.leaveChannel(`App.Models.Usuario.${this.sesion.usuario()!.id}`);
      this.echo.disconnect();
      this.echo = null;
    }
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
