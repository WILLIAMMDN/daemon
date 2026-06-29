import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticacion, CompletarPerfilGoogleDatos } from '../../../../core/servicios/autenticacion';
import { Sesion } from '../../../../core/servicios/sesion';
import { AuthValidators } from '../../../../shared/validadores/auth-validadores';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.scss',
})
export class Bienvenida implements OnInit {
  readonly nombreMinLength = AuthValidators.NOMBRE_MIN_LENGTH;
  readonly usuarioMinLength = AuthValidators.USUARIO_MIN_LENGTH;
  readonly patronUsuario = /^[A-Za-z0-9_-]+$/;

  datos: CompletarPerfilGoogleDatos = {
    nombre_completo: '',
    usuario: '',
    nivel: 'TEENS',
  };

  guardando = signal(false);
  error = signal('');

  constructor(
    private auth: Autenticacion,
    public sesion: Sesion,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const usuario = this.sesion.usuario();

    if (!usuario) {
      this.router.navigateByUrl('/login');
      return;
    }

    if (usuario.perfil_completo !== false) {
      this.router.navigateByUrl(usuario.rol === 'docente' || usuario.rol === 'admin' ? '/docente' : '/alumno');
      return;
    }

    this.datos = {
      nombre_completo: usuario.nombre_completo?.trim() ?? '',
      usuario: usuario.usuario?.trim() ?? '',
      nivel: this.normalizarNivel(usuario.nivel),
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

    this.auth.completarPerfil(payload).subscribe({
      next: () => this.router.navigateByUrl('/alumno'),
      error: (error) => {
        const errores = error.error?.errors;
        const primerError = errores ? Object.values(errores).flat()[0] : null;
        this.error.set(String(primerError ?? error.error?.message ?? 'No se pudo completar tu perfil.'));
        this.guardando.set(false);
      },
    });
  }

  salir(): void {
    if (this.guardando()) {
      return;
    }

    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => {
        this.sesion.limpiar();
        this.router.navigateByUrl('/login');
      },
    });
  }

  private validar(payload: CompletarPerfilGoogleDatos, form: NgForm): string | null {
    if (!payload.nombre_completo || payload.nombre_completo.length < this.nombreMinLength) {
      return `Ingresa tu nombre completo con al menos ${this.nombreMinLength} caracteres.`;
    }

    if (!payload.usuario || payload.usuario.length < this.usuarioMinLength) {
      return `El usuario debe tener al menos ${this.usuarioMinLength} caracteres.`;
    }

    if (!this.patronUsuario.test(payload.usuario)) {
      return 'El usuario solo puede usar letras, numeros, guiones y guiones bajos.';
    }

    if (form.invalid) {
      return AuthValidators.generalFormError;
    }

    return null;
  }

  private normalizarNivel(nivel: string | null | undefined): 'KIDS' | 'TEENS' | 'PRO' {
    return nivel === 'KIDS' || nivel === 'PRO' ? nivel : 'TEENS';
  }
}
