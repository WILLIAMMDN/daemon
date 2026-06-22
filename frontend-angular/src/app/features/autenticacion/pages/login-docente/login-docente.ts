import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticacion } from '../../../../core/servicios/autenticacion';
import { Sesion } from '../../../../core/servicios/sesion';
import { GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';
import { validarCredenciales } from '../../../../shared/validadores/auth-validadores';

@Component({
  selector: 'app-login-docente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GoogleSigninButtonModule],
  templateUrl: './login-docente.html'
})
export class LoginDocente implements OnInit {
  usuario = '';
  password = '';
  enviando = signal(false);
  error = signal('');

  constructor(
    private auth: Autenticacion,
    private sesion: Sesion,
    private router: Router,
    private socialAuthService: SocialAuthService
  ) {}

  ngOnInit(): void {
    this.socialAuthService.authState.subscribe((googleUser) => {
      if (googleUser) {
        this.enviando.set(true);
        this.error.set('');

        this.auth.loginGoogle(googleUser.idToken).subscribe({
          next: () => {
            if (this.sesion.esDocente()) {
              this.router.navigateByUrl('/docente');
            } else {
              this.error.set('Este usuario no tiene permiso docente.');
              this.enviando.set(false);
            }
          },
          error: (err) => {
            this.error.set(err.error?.message ?? 'No se pudo iniciar sesión con Google.');
            this.enviando.set(false);
          }
        });
      }
    });
  }

  entrar(form: NgForm): void {
    const validacion = validarCredenciales(this.usuario, this.password);
    if (validacion) {
      this.error.set(validacion);
      return;
    }

    this.enviando.set(true);
    this.error.set('');

    this.auth.login({ usuario: this.usuario, password: this.password }).subscribe({
      next: () => {
        if (this.sesion.esDocente()) {
          this.router.navigateByUrl('/docente');
        } else {
          this.error.set('Este usuario no tiene permiso docente.');
          this.sesion.limpiar();
          this.enviando.set(false);
        }
      },
      error: (error) => {
        this.error.set(error.error?.message ?? 'Credenciales incorrectas.');
        this.enviando.set(false);
      },
    });
  }
}
