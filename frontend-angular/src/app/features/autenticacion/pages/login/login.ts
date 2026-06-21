import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticacion } from '../../../../core/servicios/autenticacion';
import { Sesion } from '../../../../core/servicios/sesion';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  usuario = '';
  password = '';
  enviando = signal(false);
  error = signal('');

  constructor(private auth: Autenticacion, private sesion: Sesion, private router: Router) {}

  entrar(): void {
    this.enviando.set(true); this.error.set('');
    this.auth.login({ usuario: this.usuario, password: this.password }).subscribe({
      next: () => this.router.navigateByUrl(this.sesion.esDocente() ? '/docente' : '/alumno'),
      error: (error) => { this.error.set(error.error?.message ?? 'No se pudo iniciar sesión.'); this.enviando.set(false); },
    });
  }
}
