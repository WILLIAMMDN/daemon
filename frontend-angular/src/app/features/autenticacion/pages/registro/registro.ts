import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';
import { Autenticacion } from '../../../../core/servicios/autenticacion';
import { Sesion } from '../../../../core/servicios/sesion';
import { AuthValidators, validarRegistro } from '../../../../shared/validadores/auth-validadores';
import { CompletarPerfilGoogle } from '../../components/completar-perfil-google/completar-perfil-google';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GoogleSigninButtonModule, CompletarPerfilGoogle],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro implements OnInit {
  readonly nombreMinLength = AuthValidators.NOMBRE_MIN_LENGTH;
  readonly usuarioMinLength = AuthValidators.USUARIO_MIN_LENGTH;
  readonly passwordMinLength = AuthValidators.REGISTRO_PASSWORD_MIN_LENGTH;

  datos = { nombre_completo: '', email: '', usuario: '', password: '', nivel: 'TEENS' };
  passwordVisible = signal(false);
  perfilGooglePendiente = signal(false);
  enviando = signal(false);
  error = signal('');

  constructor(
    private auth: Autenticacion,
    private router: Router,
    public sesion: Sesion,
    private socialAuthService: SocialAuthService,
  ) {}

  ngOnInit(): void {
    this.socialAuthService.authState.subscribe((googleUser) => {
      if (!googleUser) {
        return;
      }

      this.enviando.set(true);
      this.error.set('');

      this.auth.loginGoogle(googleUser.idToken, true).subscribe({
        next: () => {
          if (!this.sesion.esDocente() && this.sesion.usuario()?.perfil_completo === false) {
            this.perfilGooglePendiente.set(true);
            this.enviando.set(false);
            return;
          }

          this.router.navigateByUrl(this.sesion.esDocente() ? '/docente' : '/alumno');
        },
        error: (error) => {
          this.error.set(error.error?.message ?? 'No se pudo crear la cuenta con Google.');
          this.enviando.set(false);
        },
      });
    });
  }

  alternarPassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  perfilGoogleCompletado(): void {
    this.perfilGooglePendiente.set(false);
    this.enviando.set(false);
    this.router.navigateByUrl('/alumno');
  }

  cancelarPerfilGoogle(): void {
    this.perfilGooglePendiente.set(false);
    this.enviando.set(false);

    this.auth.logout().subscribe({
      next: () => undefined,
      error: () => this.sesion.limpiar(),
    });
  }

  registrar(form: NgForm): void {
    const payload = {
      nombre_completo: this.datos.nombre_completo.trim(),
      email: this.datos.email.trim(),
      usuario: this.datos.usuario.trim(),
      password: this.datos.password,
      nivel: this.datos.nivel,
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

    this.auth.registro(payload).subscribe({
      next: () => this.router.navigateByUrl('/alumno'),
      error: (error) => {
        this.error.set(error.error?.message ?? 'No se pudo crear la cuenta.');
        this.enviando.set(false);
      },
    });
  }
}
