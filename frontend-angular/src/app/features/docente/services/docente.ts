import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

@Injectable({
  providedIn: 'root',
})
export class Docente {
  constructor(private api: Api) {}
  panel() { return this.api.get('/docente/panel'); }
  alumnos() { return this.api.get('/docente/alumnos'); }
  docentes() { return this.api.get('/docente/docentes'); }
  aulas() { return this.api.get('/docente/aulas'); }
  crearAula(datos: unknown) { return this.api.post('/docente/aulas', datos); }
  actualizarAula(id: number, datos: unknown) { return this.api.put(`/docente/aulas/${id}`, datos); }
  eliminarAula(id: number) { return this.api.delete(`/docente/aulas/${id}`); }
  asignarAulaUsuario(idUsuario: number, datos: unknown) { return this.api.patch(`/docente/usuarios/${idUsuario}/aula`, datos); }
  asignarTokens(datos: unknown) { return this.api.post('/docente/tokens', datos); }
  historialTokens() { return this.api.get('/docente/historial-tokens'); }
  insignias() { return this.api.get('/docente/insignias'); }
  crearInsignia(datos: unknown) { return this.api.post('/docente/insignias', datos); }
  actualizarInsignia(id: number, datos: unknown) { 
    if (datos instanceof FormData) {
      datos.append('_method', 'PUT');
      return this.api.post(`/docente/insignias/${id}`, datos);
    }
    return this.api.put(`/docente/insignias/${id}`, datos); 
  }
  eliminarInsignia(id: number) { return this.api.delete(`/docente/insignias/${id}`); }
  asignarInsignia(datos: unknown) { return this.api.post('/docente/insignias/asignar', datos); }
}
