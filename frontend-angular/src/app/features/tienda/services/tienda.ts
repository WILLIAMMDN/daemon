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
}
