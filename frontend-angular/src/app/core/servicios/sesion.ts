import { Injectable, computed, signal } from '@angular/core';
import { NivelAlumno } from '../dominio/nivel-alumno';

export interface UsuarioSesion {
  id: number;
  nombre_completo?: string | null;
  email?: string | null;
  email_verificado?: boolean;
  email_verified_at?: string | null;
  telefono?: string | null;
  usuario?: string | null;
  rol: 'alumno' | 'docente' | 'admin';
  nivel?: NivelAlumno | null;
  tokens: number;
  experiencia?: number;
  nivel_gamificacion?: number;
  progreso_nivel?: {
    nivel: number;
    nivel_maximo: number;
    experiencia_total: number;
    experiencia_nivel: number;
    experiencia_meta: number;
    experiencia_restante: number;
    progreso_porcentaje: number;
  };
  pro_tokens?: number | null;
  rango?: string | null;
  biografia?: string | null;
  avatar?: string | null;
  fondo?: string | null;
  heroe?: string | null;
  genero?: string | null;
  perfil_completo?: boolean;
  tour_completado?: boolean;
  fecha_registro?: string | null;
  id_institucion?: number | null;
  id_aula?: number | null;
}

type UsuarioSesionEntrada = UsuarioSesion | { data?: UsuarioSesion; usuario?: UsuarioSesion };

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

  actualizarUsuario(usuario: UsuarioSesionEntrada): void {
    const posible = usuario as { data?: UsuarioSesion; usuario?: UsuarioSesion };
    const usuarioLimpio = posible.usuario ?? posible.data ?? (usuario as UsuarioSesion);
    const usuarioActualizado = { ...(this.usuario() ?? {}), ...usuarioLimpio } as UsuarioSesion;
    localStorage.setItem(this.claveUsuario, JSON.stringify(usuarioActualizado));
    this.usuario.set(usuarioActualizado);
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
