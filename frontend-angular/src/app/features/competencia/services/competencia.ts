import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

@Injectable({
  providedIn: 'root',
})
export class Competencia {
  constructor(private api: Api) {}
  estado() { return this.api.get('/competencia/estado'); }
    votar(datos: unknown) { return this.api.post('/competencia/votar', datos); }
    controlar(datos: unknown) { return this.api.post('/competencia/control', datos); }
}
