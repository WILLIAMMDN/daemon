import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

@Injectable({
  providedIn: 'root',
})
export class Tienda {
  constructor(private api: Api) {}
  premios() { return this.api.get('/tienda'); }
  canjes() { return this.api.get('/tienda/canjes'); }
  canjear(id: number) { return this.api.post(`/tienda/canjear/${id}`, {}); }
  administrar() { return this.api.get('/tienda/administrar'); }
  crearPremio(datos: unknown) { return this.api.post('/tienda/premios', datos); }
  actualizarPremio(id: number, datos: unknown) { return this.api.put(`/tienda/premios/${id}`, datos); }
  eliminarPremio(id: number) { return this.api.delete(`/tienda/premios/${id}`); }
  entregarCanje(id: number) { return this.api.post(`/tienda/canjes/${id}/entregar`, {}); }
  crearEspecie(datos: unknown) { return this.api.post('/mascota/admin/especies', datos); }
  actualizarEspecie(id: number, datos: unknown) { return this.api.put(`/mascota/admin/especies/${id}`, datos); }
}
