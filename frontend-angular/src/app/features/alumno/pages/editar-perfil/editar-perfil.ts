import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Activos } from '../../../../core/servicios/activos';
import { Sesion, UsuarioSesion } from '../../../../core/servicios/sesion';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { MediaUploader } from '../../../../shared/componentes/media-uploader/media-uploader';
import { Alumno } from '../../services/alumno';

@Component({
  selector: 'app-editar-perfil',
  imports: [
    FormsModule,
    RouterLink,
    NzAlertModule,
    NzAvatarModule,
    NzButtonModule,
    NzProgressModule,
    NzTagModule,
    Cargando,
    MediaUploader,
  ],
  templateUrl: './editar-perfil.html',
  styleUrl: './editar-perfil.scss',
})
export class EditarPerfil {
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  avatarActual = signal('');
  avatarPreview = signal('');
  fondoPreview = signal('');
  heroePreview = signal('');
  uploadResetKey = signal(0);
  formulario = {
    nombre_completo: '',
    email: '',
    biografia: '',
    genero: '',
  };
  private archivoAvatar: File | null = null;
  private archivoFondo: File | null = null;
  private archivoHeroe: File | null = null;

  constructor(private alumno: Alumno, public sesion: Sesion, private activos: Activos) {
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
        this.avatarActual.set(usuario.avatar ?? this.sesion.usuario()?.avatar ?? '');
        this.limpiarArchivos();
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

    const datos = new FormData();
    datos.append('nombre_completo', this.formulario.nombre_completo);
    datos.append('email', this.formulario.email ?? '');
    datos.append('biografia', this.formulario.biografia ?? '');
    datos.append('genero', this.formulario.genero ?? '');
    if (this.archivoAvatar) datos.append('avatar', this.archivoAvatar);
    if (this.archivoFondo) datos.append('fondo', this.archivoFondo);
    if (this.archivoHeroe) datos.append('heroe', this.archivoHeroe);

    this.alumno.actualizarPerfil(datos).subscribe({
      next: (usuario) => {
        this.sesion.actualizarUsuario(usuario as UsuarioSesion);
        this.avatarActual.set((usuario as UsuarioSesion).avatar ?? this.avatarActual());
        this.limpiarArchivos();
        this.mensaje.set('Perfil actualizado.');
        this.guardando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo guardar el perfil.');
        this.guardando.set(false);
      },
    });
  }

  seleccionarAvatar(archivo: File | null): void {
    this.archivoAvatar = archivo;
    this.previsualizar(archivo, (valor) => this.avatarPreview.set(valor));
  }

  seleccionarFondo(archivo: File | null): void {
    this.archivoFondo = archivo;
    this.previsualizar(archivo, (valor) => this.fondoPreview.set(valor));
  }

  seleccionarHeroe(archivo: File | null): void {
    this.archivoHeroe = archivo;
    this.previsualizar(archivo, (valor) => this.heroePreview.set(valor));
  }

  avatarVisible(): string {
    return this.avatarPreview() || this.activos.url(this.avatarActual());
  }

  iniciales(): string {
    const base = this.formulario.nombre_completo || this.sesion.usuario()?.usuario || 'DAEMON';
    return base
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('') || 'D';
  }

  progresoPerfil(): number {
    const puntos = [
      this.formulario.nombre_completo.trim(),
      this.formulario.email.trim(),
      this.formulario.biografia.trim(),
      this.formulario.genero.trim(),
      this.avatarVisible(),
    ].filter(Boolean).length;

    return Math.round((puntos / 5) * 100);
  }

  estadoProgreso(): 'active' | 'success' {
    return this.progresoPerfil() >= 80 ? 'success' : 'active';
  }

  private previsualizar(archivo: File | null, asignar: (valor: string) => void): void {
    if (!archivo) {
      asignar('');
      return;
    }

    const lector = new FileReader();
    lector.onload = () => asignar(String(lector.result ?? ''));
    lector.readAsDataURL(archivo);
  }

  private limpiarArchivos(): void {
    this.archivoAvatar = null;
    this.archivoFondo = null;
    this.archivoHeroe = null;
    this.avatarPreview.set('');
    this.fondoPreview.set('');
    this.heroePreview.set('');
    this.uploadResetKey.update((valor) => valor + 1);
  }
}
