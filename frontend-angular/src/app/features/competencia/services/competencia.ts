import { Injectable, NgZone } from '@angular/core';
import { Api } from '../../../core/servicios/api';
import { NotificacionesService } from '../../../core/servicios/notificaciones.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Competencia {
  constructor(private api: Api, private notificaciones: NotificacionesService, private zone: NgZone) {}
  // La competencia es tiempo real: cada evento debe consultar el estado actual
  // y no reutilizar la ventana de caché de los módulos académicos normales.
  estado() { return this.api.get('/competencia/estado', { fresh: true }); }
  votar(datos: unknown) { return this.api.post('/competencia/votar', datos); }
  controlar(datos: unknown) { return this.api.post('/competencia/control', datos); }
  chat() { return this.api.get('/competencia/chat', { fresh: true }); }
  enviarChat(mensaje: string) { return this.api.post('/competencia/chat', { mensaje }); }
  historial() { return this.api.get('/competencia/historial'); }

  escucharActualizaciones(): Observable<any> {
    return new Observable((subscriber) => {
      const echo = this.notificaciones.echo;
      if (echo) {
        echo.channel('competencia-live').listen('CompetenciaActualizada', (e: any) => {
          this.zone.run(() => subscriber.next(e.estado));
        });
      }

      return () => {
        if (echo) echo.leaveChannel('competencia-live');
      };
    });
  }
}
