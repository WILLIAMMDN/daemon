import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Api } from '../../../core/servicios/api';
import { UsuarioSesion } from '../../../core/servicios/sesion';

type UsuarioResourceRespuesta = UsuarioSesion | { data?: UsuarioSesion; usuario?: UsuarioSesion };

@Injectable({
  providedIn: 'root',
})
export class Alumno {
  constructor(private api: Api) {}
  panel() { return this.api.get('/alumno/panel'); }
  perfil<T = unknown>(usuarioId?: number | string | null) {
    return this.api.get<T>(usuarioId ? `/alumno/perfil/${usuarioId}` : '/alumno/perfil');
  }
  actualizarPerfil(datos: unknown) {
    return this.api.post<UsuarioResourceRespuesta>('/alumno/perfil', datos).pipe(
      map((respuesta) => {
        const posible = respuesta as { data?: UsuarioSesion; usuario?: UsuarioSesion };
        return posible.usuario ?? posible.data ?? (respuesta as UsuarioSesion);
      }),
    );
  }
  comunidad<T = unknown>() { return this.api.get<T>('/comunidad'); }
}
