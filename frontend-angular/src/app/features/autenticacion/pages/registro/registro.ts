import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticacion } from '../../../../core/servicios/autenticacion';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {
  datos = { nombre_completo: '', email: '', usuario: '', password: '', nivel: 'TEENS' };
  enviando = signal(false); error = signal('');
  constructor(private auth: Autenticacion, private router: Router) {}
  registrar(): void {
    this.enviando.set(true); this.error.set('');
    this.auth.registro(this.datos).subscribe({
      next: () => this.router.navigateByUrl('/alumno'),
      error: (e) => { this.error.set(e.error?.message ?? 'No se pudo crear la cuenta.'); this.enviando.set(false); },
    });
  }
}
