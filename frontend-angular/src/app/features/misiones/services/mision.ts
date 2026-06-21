import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

@Injectable({
  providedIn: 'root',
})
export class Mision {
  constructor(private api: Api) {}
  listar() { return this.api.get('/misiones'); }
  detalle(id: number) { return this.api.get(`/misiones/${id}`); }
  crear(datos: unknown) { return this.api.post('/misiones', datos); }
  actualizar(id: number, datos: unknown) { return this.api.put(`/misiones/${id}`, datos); }
  eliminar(id: number) { return this.api.delete(`/misiones/${id}`); }
  entregar(id: number, datos: unknown) { return this.api.post(`/misiones/${id}/entregar`, datos); }
  entregas() { return this.api.get('/misiones/entregas'); }
  revisar(id: number, datos: unknown) { return this.api.post(`/misiones/entregas/${id}/revisar`, datos); }
}
