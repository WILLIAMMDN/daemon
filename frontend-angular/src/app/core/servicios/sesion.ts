import { Injectable, computed, signal } from '@angular/core';

export interface UsuarioSesion {
  id: number;
  nombre_completo: string;
  usuario: string;
  rol: 'alumno' | 'docente' | 'admin';
  nivel: string;
  tokens: number;
  avatar?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class Sesion {
  private readonly claveToken = 'yachayia_token';
  private readonly claveUsuario = 'yachayia_usuario';
  readonly token = signal<string | null>(localStorage.getItem(this.claveToken));
  readonly usuario = signal<UsuarioSesion | null>(this.leerUsuario());
  readonly autenticado = computed(() => Boolean(this.token() && this.usuario()));
  readonly esDocente = computed(() => ['docente', 'admin'].includes(this.usuario()?.rol ?? ''));

  guardar(token: string, usuario: UsuarioSesion): void {
    localStorage.setItem(this.claveToken, token);
    localStorage.setItem(this.claveUsuario, JSON.stringify(usuario));
    this.token.set(token); this.usuario.set(usuario);
  }

  actualizarUsuario(usuario: UsuarioSesion): void {
    localStorage.setItem(this.claveUsuario, JSON.stringify(usuario)); this.usuario.set(usuario);
  }

  limpiar(): void {
    localStorage.removeItem(this.claveToken); localStorage.removeItem(this.claveUsuario);
    this.token.set(null); this.usuario.set(null);
  }

  private leerUsuario(): UsuarioSesion | null {
    try { return JSON.parse(localStorage.getItem(this.claveUsuario) ?? 'null'); } catch { return null; }
  }
}
