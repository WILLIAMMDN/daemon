import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';
import {
  Canje,
  ConfiguracionMascota,
  EspecieMascota,
  PremioForm,
  RespuestaAdministracionTienda,
  RespuestaCanje,
  RespuestaTienda,
} from '../../../core/modelos/dto';

@Injectable({
  providedIn: 'root',
})
export class Tienda {
  constructor(private api: Api) {}
  premios() { return this.api.get<RespuestaTienda>('/tienda'); }
  canjes() { return this.api.get<Canje[]>('/tienda/canjes'); }
  canjear(id: number) { return this.api.post<RespuestaCanje>(`/tienda/canjear/${id}`, {}); }
  administrar() { return this.api.get<RespuestaAdministracionTienda>('/tienda/administrar'); }
  crearPremio(datos: PremioForm | Omit<PremioForm, 'cosmetico'>) { return this.api.post('/tienda/premios', datos); }
  actualizarPremio(id: number, datos: PremioForm | Omit<PremioForm, 'cosmetico'>) { return this.api.put(`/tienda/premios/${id}`, datos); }
  eliminarPremio(id: number) { return this.api.delete(`/tienda/premios/${id}`); }
  entregarCanje(id: number) { return this.api.post(`/tienda/canjes/${id}/entregar`, {}); }
  crearEspecie(datos: EspecieMascota) { return this.api.post('/mascota/admin/especies', datos); }
  actualizarEspecie(id: number, datos: EspecieMascota) { return this.api.put(`/mascota/admin/especies/${id}`, datos); }
}
