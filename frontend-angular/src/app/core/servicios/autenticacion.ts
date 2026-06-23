import { Injectable } from '@angular/core';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { tap } from 'rxjs';
import { Api } from './api';
import { Sesion, UsuarioSesion } from './sesion';

export interface AuthRespuesta {
  token: string;
  usuario: UsuarioSesion;
}

export interface CompletarPerfilGoogleDatos {
  nombre_completo: string;
  usuario: string;
  nivel: 'KIDS' | 'TEENS' | 'PRO';
}

@Injectable({
  providedIn: 'root',
})
export class Autenticacion {
  constructor(private api: Api, private sesion: Sesion, private socialAuth: SocialAuthService) {}

  login(datos: { usuario: string; password: string }) {
    return this.api.post<AuthRespuesta>('/auth/login', datos)
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.token, respuesta.usuario)));
  }

  registro(datos: Record<string, unknown>) {
    return this.api.post<AuthRespuesta>('/auth/registro', datos)
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.token, respuesta.usuario)));
  }

  loginGoogle(idToken: string, crearCuenta = false) {
    this.sesion.limpiar();

    return this.api.post<AuthRespuesta>('/auth/google', { id_token: idToken, crear_cuenta: crearCuenta })
      .pipe(tap((respuesta) => this.sesion.guardar(respuesta.token, respuesta.usuario)));
  }

  completarPerfilGoogle(datos: CompletarPerfilGoogleDatos) {
    return this.api.post<{ usuario: UsuarioSesion }>('/auth/google/perfil', datos)
      .pipe(tap((respuesta) => this.sesion.actualizarUsuario(respuesta.usuario)));
  }

  cerrarSesionGoogle(): void {
    try {
      void this.socialAuth.signOut().catch(() => {});
    } catch {
      // Algunos navegadores no mantienen una sesion social activa.
    }
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
      // Tambien cerrar sesion en proveedores sociales (Google).
      try { this.socialAuth.signOut().catch(() => {}); } catch { /* ignore */ }
    }));
  }
}
