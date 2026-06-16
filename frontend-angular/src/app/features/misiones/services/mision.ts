import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

@Injectable({
  providedIn: 'root',
})
export class Mision {
  constructor(private api: Api) {}
  listar() { return this.api.get('/misiones'); }
    entregar(id: number, datos: unknown) { return this.api.post(`/misiones/${id}/entregar`, datos); }
    revisar(id: number, datos: unknown) { return this.api.post(`/misiones/entregas/${id}/revisar`, datos); }
}
