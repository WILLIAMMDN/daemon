import { Component, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticacion } from '../../../../core/servicios/autenticacion';
import { validarRegistro } from '../../../../shared/validadores/auth-validadores';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    GoogleSigninButtonModule,
    CommonModule,
    FormsModule,
    RouterLink,
    ...HlmCardImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmButtonImports,
  ],schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './registro.html'
})
export class Registro {
  datos = { nombre_completo: '', email: '', usuario: '', password: '', nivel: 'TEENS' };
  enviando = signal(false); 
  error = signal('');
  
  constructor(private auth: Autenticacion, private router: Router) {}
  
  registrar(form: NgForm): void {
    const validacion = validarRegistro(this.datos);
    if (validacion) {
      this.error.set(validacion);
      return;
    }

    if (form.invalid) {
      this.error.set('Por favor completa todos los campos correctamente.');
      return;
    }

    this.enviando.set(true); 
    this.error.set('');
    
    this.auth.registro(this.datos).subscribe({
      next: () => this.router.navigateByUrl('/alumno'),
      error: (e) => { 
        this.error.set(e.error?.message ?? 'No se pudo crear la cuenta.'); 
        this.enviando.set(false); 
      },
    });
  }
}