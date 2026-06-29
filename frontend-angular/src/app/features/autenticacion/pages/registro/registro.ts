import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticacion, RegistroFirebaseDatos } from '../../../../core/servicios/autenticacion';
import { Sesion } from '../../../../core/servicios/sesion';
import { AuthValidators, validarRegistro } from '../../../../shared/validadores/auth-validadores';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {
  readonly passwordMinLength = AuthValidators.REGISTRO_PASSWORD_MIN_LENGTH;

  datos: RegistroFirebaseDatos = { email: '', password: '' };
  passwordVisible = signal(false);
  enviando = signal(false);
  error = signal('');

  constructor(
    private auth: Autenticacion,
    private router: Router,
    public sesion: Sesion,
  ) {}

  alternarPassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  continuarConGoogle(): void {
    this.enviando.set(true);
    this.error.set('');

    this.auth.loginGoogleFirebase(true).subscribe({
      next: () => {
        if (!this.sesion.esDocente() && this.sesion.usuario()?.perfil_completo === false) {
          this.router.navigateByUrl('/bienvenida');
          return;
        }

        this.router.navigateByUrl(this.sesion.esDocente() ? '/docente' : '/alumno');
      },
      error: (error) => {
        this.error.set(error.error?.message ?? error.message ?? 'No se pudo crear la cuenta con Google.');
        this.enviando.set(false);
      },
    });
  }

  registrar(form: NgForm): void {
    const payload = {
      email: this.datos.email.trim(),
      password: this.datos.password,
    };

    const validacion = validarRegistro(payload);
    if (validacion) {
      this.error.set(validacion);
      return;
    }

    if (form.invalid) {
      this.error.set(AuthValidators.generalFormError);
      return;
    }

    this.enviando.set(true);
    this.error.set('');

    this.auth.registroFirebase(payload).subscribe({
      next: () => this.router.navigateByUrl(
        this.sesion.usuario()?.perfil_completo === false ? '/bienvenida' : '/alumno',
      ),
      error: (error) => {
        this.error.set(error.error?.message ?? error.message ?? 'No se pudo crear la cuenta en Firebase.');
        this.enviando.set(false);
      },
    });
  }
}
