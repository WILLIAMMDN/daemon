import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

@Injectable({
  providedIn: 'root',
})
export class Alumno {
  constructor(private api: Api) {}
  panel() { return this.api.get('/alumno/panel'); }
    perfil() { return this.api.get('/alumno/perfil'); }
    comunidad() { return this.api.get('/comunidad'); }
}
