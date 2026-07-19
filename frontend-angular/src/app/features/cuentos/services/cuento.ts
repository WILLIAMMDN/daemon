import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';
import { CuentoRegistro } from '../models/cuento.models';

@Injectable({
  providedIn: 'root',
})
export class Cuento {
  constructor(private api: Api) {}
  listar(fresh = false) { return this.api.get<CuentoRegistro[]>('/cuentos', { fresh }); }
  detalle(id: number) { return this.api.get<{ cuento: CuentoRegistro; autor: unknown }>(`/cuentos/${id}`); }
  mio(fresh = false) { return this.api.get<CuentoRegistro | null>('/cuentos/mio/actual', { fresh }); }
  guardar(datos: unknown) { return this.api.post<CuentoRegistro>('/cuentos', datos); }
}
