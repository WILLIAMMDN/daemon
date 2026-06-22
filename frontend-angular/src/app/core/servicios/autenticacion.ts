import { Injectable } from '@angular/core';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { tap } from 'rxjs';
import { Api } from './api';
import { Sesion, UsuarioSesion } from './sesion';

@Injectable({
  providedIn: 'root',
})
export class Autenticacion {
  constructor(private api: Api, private sesion: Sesion, private socialAuth: SocialAuthService) {}

  login(datos: { usuario: string; password: string }) {
    return this.api.post<{ token: string; usuario: UsuarioSesion }>('/auth/login', datos)
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.token, respuesta.usuario)));
  }

  registro(datos: Record<string, unknown>) {
    return this.api.post<{ token: string; usuario: UsuarioSesion }>('/auth/registro', datos)
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.token, respuesta.usuario)));
  }

  loginGoogle(idToken: string) {
    this.sesion.limpiar();

    return this.api.post<{ token: string; usuario: UsuarioSesion }>('/auth/google', { id_token: idToken })
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.token, respuesta.usuario)));
  }

  crearUsuario(datos: Record<string, unknown>) {
    return this.api.post('/auth/usuarios', datos);
  }

  solicitarRecuperacion(datos: { usuario?: string; email?: string }) {
    return this.api.post<{ message: string }>('/auth/recuperar', datos);
  }

  cambiarClave(datos: { password_actual: string; password: string; password_confirmation: string }) {
    return this.api.post<{ message: string }>('/auth/cambiar-clave', datos);
  }

  logout() {
    return this.api.post('/auth/logout', {}).pipe(tap(() => {
      this.sesion.limpiar();
      // También cerrar sesión en proveedores sociales (Google)
      try { this.socialAuth.signOut().catch(() => {}); } catch { /* ignore */ }
    }));
  }
}
