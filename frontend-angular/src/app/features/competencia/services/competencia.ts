import { Injectable, NgZone } from '@angular/core';
import { Api } from '../../../core/servicios/api';
import { NotificacionesService } from '../../../core/servicios/notificaciones.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Competencia {
  constructor(private api: Api, private notificaciones: NotificacionesService, private zone: NgZone) {}
  estado() { return this.api.get('/competencia/estado'); }
  votar(datos: unknown) { return this.api.post('/competencia/votar', datos); }
  controlar(datos: unknown) { return this.api.post('/competencia/control', datos); }
  chat() { return this.api.get('/competencia/chat'); }
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
