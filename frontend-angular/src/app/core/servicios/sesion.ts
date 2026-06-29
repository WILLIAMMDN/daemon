import { Injectable, computed, signal } from '@angular/core';

export interface UsuarioSesion {
  id: number;
  nombre_completo?: string | null;
  email?: string | null;
  email_verificado?: boolean;
  email_verified_at?: string | null;
  telefono?: string | null;
  usuario?: string | null;
  rol: 'alumno' | 'docente' | 'admin';
  nivel?: string | null;
  tokens: number;
  avatar?: string | null;
  perfil_completo?: boolean;
  id_institucion?: number | null;
  id_aula?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class Sesion {
  private readonly claveUsuario = 'daemon_usuario';
  readonly usuario = signal<UsuarioSesion | null>(this.leerUsuario());
  readonly autenticado = computed(() => Boolean(this.usuario()));
  readonly esDocente = computed(() => ['docente', 'admin'].includes(this.usuario()?.rol ?? ''));

  guardar(usuario: UsuarioSesion): void {
    localStorage.setItem(this.claveUsuario, JSON.stringify(usuario));
    localStorage.removeItem('daemon_token');
    localStorage.removeItem('access_token');
    this.usuario.set(usuario);
  }

  actualizarUsuario(usuario: UsuarioSesion): void {
    localStorage.setItem(this.claveUsuario, JSON.stringify(usuario));
    this.usuario.set(usuario);
  }

  limpiar(): void {
    localStorage.removeItem('daemon_token');
    localStorage.removeItem(this.claveUsuario);
    localStorage.removeItem('access_token');
    this.usuario.set(null);
  }

  private leerUsuario(): UsuarioSesion | null {
    try { return JSON.parse(localStorage.getItem(this.claveUsuario) ?? 'null'); } catch { return null; }
  }
}
