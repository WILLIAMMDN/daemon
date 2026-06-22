import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticacion } from '../../../../core/servicios/autenticacion';
import { Sesion } from '../../../../core/servicios/sesion';
import { GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';
import { validarCredenciales } from '../../../../shared/validadores/auth-validadores';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GoogleSigninButtonModule],
  templateUrl: './login.html'
})
export class Login implements OnInit { // <-- Agregamos OnInit
  usuario = '';
  password = '';
  enviando = signal(false);
  error = signal('');

  constructor(
    private auth: Autenticacion, 
    private sesion: Sesion, 
    private router: Router,
    private socialAuthService: SocialAuthService // <-- ¡LA PIEZA QUE FALTABA!
  ) {}

  ngOnInit(): void {
    // Aquí Angular "escucha" lo que responde el botón de Google
    this.socialAuthService.authState.subscribe((googleUser) => {
      if (googleUser) {
        this.enviando.set(true);
        this.error.set('');
        
        // Llamamos a tu servicio enviando el token
        // NOTA: Si en tu servicio 'Autenticacion' el método se llama distinto a 'loginGoogle', cámbialo aquí.
        this.auth.loginGoogle(googleUser.idToken).subscribe({
          next: () => {
            if (this.sesion.esDocente()) {
              this.error.set('Este acceso es solo para estudiantes. Usa el login docente si eres profesor.');
              this.sesion.limpiar();
              this.enviando.set(false);
            } else {
              this.router.navigateByUrl('/alumno');
            }
          },
          error: (err) => {
            this.error.set(err.error?.message ?? 'No se pudo iniciar sesión con Google en el servidor.');
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
          this.error.set('Este acceso es solo para estudiantes. Usa el login docente si eres profesor.');
          this.sesion.limpiar();
          this.enviando.set(false);
        } else {
          this.router.navigateByUrl('/alumno');
        }
      },
      error: (error) => {
        this.error.set(error.error?.message ?? 'Credenciales incorrectas.');
        this.enviando.set(false);
      },
    });
  }
}