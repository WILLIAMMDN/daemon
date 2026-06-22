import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

@Injectable({
  providedIn: 'root',
})
export class Alumno {
  constructor(private api: Api) {}
  panel() { return this.api.get('/alumno/panel'); }
  perfil<T = unknown>(usuarioId?: number | string | null) {
    return this.api.get<T>(usuarioId ? `/alumno/perfil/${usuarioId}` : '/alumno/perfil');
  }
  actualizarPerfil(datos: unknown) { return this.api.post('/alumno/perfil', datos); }
  comunidad<T = unknown>() { return this.api.get<T>('/comunidad'); }
}
