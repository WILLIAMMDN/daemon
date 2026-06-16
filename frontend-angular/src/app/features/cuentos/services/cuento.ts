import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

@Injectable({
  providedIn: 'root',
})
export class Cuento {
  constructor(private api: Api) {}
  listar() { return this.api.get('/cuentos'); }
    mio() { return this.api.get('/cuentos/mio/actual'); }
    guardar(datos: unknown) { return this.api.post('/cuentos', datos); }
}
