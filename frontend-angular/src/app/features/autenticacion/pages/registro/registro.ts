import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticacion, RegistroFirebaseDatos } from '../../../../core/servicios/autenticacion';
import { CargaGlobal } from '../../../../core/servicios/carga-global';
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
    private cargaGlobal: CargaGlobal,
  ) {}

  alternarPassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  continuarConGoogle(): void {
    this.enviando.set(true);
    this.error.set('');
    const carga = this.cargaGlobal.mostrar('Creando tu cuenta con Google...');

    this.auth.loginGoogleFirebase(true).subscribe({
      next: () => {
        this.cargaGlobal.cambiarMensaje('Preparando tu espacio DAEMON...');

        if (!this.sesion.esDocente() && this.sesion.usuario()?.perfil_completo === false) {
          void this.router.navigateByUrl('/bienvenida').finally(() => this.cargaGlobal.ocultar(carga));
          return;
        }

        void this.router.navigateByUrl(this.sesion.esDocente() ? '/docente' : '/alumno')
          .finally(() => this.cargaGlobal.ocultar(carga));
      },
      error: (error) => {
        this.error.set(error.error?.message ?? error.message ?? 'No se pudo crear la cuenta con Google.');
        this.enviando.set(false);
        this.cargaGlobal.ocultar(carga);
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
    const carga = this.cargaGlobal.mostrar('Registrando tu cuenta DAEMON...');

    this.auth.registroFirebase(payload).subscribe({
      next: () => {
        this.cargaGlobal.cambiarMensaje('Abriendo tu bienvenida...');
        void this.router.navigateByUrl(
          this.sesion.usuario()?.perfil_completo === false ? '/bienvenida' : '/alumno',
        ).finally(() => this.cargaGlobal.ocultar(carga));
      },
      error: (error) => {
        this.error.set(error.error?.message ?? error.message ?? 'No se pudo crear la cuenta en Firebase.');
        this.enviando.set(false);
        this.cargaGlobal.ocultar(carga);
      },
    });
  }
}
