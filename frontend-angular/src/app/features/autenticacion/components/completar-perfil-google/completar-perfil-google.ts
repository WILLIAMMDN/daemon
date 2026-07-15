import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { OPCIONES_NIVEL_ALUMNO, normalizarNivelAlumno } from '../../../../core/dominio/nivel-alumno';
import { Autenticacion, CompletarPerfilGoogleDatos } from '../../../../core/servicios/autenticacion';
import { UsuarioSesion } from '../../../../core/servicios/sesion';
import { AuthValidators } from '../../../../shared/validadores/auth-validadores';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-completar-perfil-google',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './completar-perfil-google.html',
  styleUrl: './completar-perfil-google.scss',
})
export class CompletarPerfilGoogle implements OnChanges {
  @Input() usuario: UsuarioSesion | null = null;
  @Output() completado = new EventEmitter<UsuarioSesion>();
  @Output() cancelado = new EventEmitter<void>();

  readonly nombreMinLength = AuthValidators.NOMBRE_MIN_LENGTH;
  readonly usuarioMinLength = AuthValidators.USUARIO_MIN_LENGTH;
  readonly patronUsuario = /^[A-Za-z0-9_-]+$/;
  readonly nivelesAlumno = OPCIONES_NIVEL_ALUMNO;

  datos: CompletarPerfilGoogleDatos = {
    nombre_completo: '',
    usuario: '',
    nivel: 'TEENS',
  };

  guardando = signal(false);
  error = signal('');

  constructor(private auth: Autenticacion) {}

  get correoGoogle(): string | null {
    return this.usuario?.email ?? null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['usuario']) {
      return;
    }

    this.datos = {
      nombre_completo: '',
      usuario: '',
      nivel: normalizarNivelAlumno(this.usuario?.nivel),
    };
  }

  guardar(form: NgForm): void {
    const payload: CompletarPerfilGoogleDatos = {
      nombre_completo: this.datos.nombre_completo.trim(),
      usuario: this.datos.usuario.trim(),
      nivel: this.datos.nivel,
    };

    const validacion = this.validar(payload, form);
    if (validacion) {
      this.error.set(validacion);
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    this.auth.completarPerfilGoogle(payload).subscribe({
      next: (respuesta) => {
        this.guardando.set(false);
        this.completado.emit(respuesta.usuario);
      },
      error: (error) => {
        const errores = error.error?.errors;
        const primerError = errores ? Object.values(errores).flat()[0] : null;
        this.error.set(String(primerError ?? error.error?.message ?? 'No se pudo completar tu perfil.'));
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    if (this.guardando()) {
      return;
    }

    this.cancelado.emit();
  }

  private validar(payload: CompletarPerfilGoogleDatos, form: NgForm): string | null {
    if (!payload.nombre_completo || payload.nombre_completo.length < this.nombreMinLength) {
      return `Ingresa tu nombre completo con al menos ${this.nombreMinLength} caracteres.`;
    }

    if (!payload.usuario || payload.usuario.length < this.usuarioMinLength) {
      return `El usuario debe tener al menos ${this.usuarioMinLength} caracteres.`;
    }

    if (!this.patronUsuario.test(payload.usuario)) {
      return 'El usuario solo puede usar letras, números, guiones y guiones bajos.';
    }

    if (form.invalid) {
      return AuthValidators.generalFormError;
    }

    return null;
  }

}
