import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Sesion, UsuarioSesion } from '../../../../core/servicios/sesion';
import { Alumno } from '../../services/alumno';

@Component({
  selector: 'app-editar-perfil',
  imports: [FormsModule, RouterLink],
  templateUrl: './editar-perfil.html',
  styleUrl: './editar-perfil.scss',
})
export class EditarPerfil {
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  formulario = {
    nombre_completo: '',
    email: '',
    biografia: '',
    genero: '',
  };

  constructor(private alumno: Alumno, private sesion: Sesion) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.alumno.perfil().subscribe({
      next: (datos: any) => {
        const usuario = datos.usuario ?? {};
        this.formulario = {
          nombre_completo: usuario.nombre_completo ?? '',
          email: usuario.email ?? '',
          biografia: usuario.biografia ?? '',
          genero: usuario.genero ?? '',
        };
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar el perfil.');
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.alumno.actualizarPerfil(this.formulario).subscribe({
      next: (usuario) => {
        this.sesion.actualizarUsuario(usuario as UsuarioSesion);
        this.mensaje.set('Perfil actualizado.');
        this.guardando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo guardar el perfil.');
        this.guardando.set(false);
      },
    });
  }
}
