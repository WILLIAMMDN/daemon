import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

@Injectable({
  providedIn: 'root',
})
export class Docente {
  constructor(private api: Api) {}
  panel() { return this.api.get('/docente/panel'); }
  alumnos() { return this.api.get('/docente/alumnos'); }
  asignarTokens(datos: unknown) { return this.api.post('/docente/tokens', datos); }
  historialTokens() { return this.api.get('/docente/historial-tokens'); }
  insignias() { return this.api.get('/docente/insignias'); }
  crearInsignia(datos: unknown) { return this.api.post('/docente/insignias', datos); }
  asignarInsignia(datos: unknown) { return this.api.post('/docente/insignias/asignar', datos); }
}
