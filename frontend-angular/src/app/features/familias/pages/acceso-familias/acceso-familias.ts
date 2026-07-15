import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faEnvelope, faEye, faEyeSlash, faShieldHeart } from '@fortawesome/free-solid-svg-icons';
import { Autenticacion } from '../../../../core/servicios/autenticacion';
import { CargaGlobal } from '../../../../core/servicios/carga-global';
import { Sesion } from '../../../../core/servicios/sesion';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-acceso-familias',
  imports: [FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './acceso-familias.html',
  styleUrl: './acceso-familias.scss',
})
export class AccesoFamilias {
  readonly modo = signal<'ingresar' | 'crear'>('ingresar');
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly passwordVisible = signal(false);
  email = '';
  password = '';
  aceptaPrivacidad = false;
  readonly iconos = { volver: faArrowLeft, correo: faEnvelope, mostrar: faEye, ocultar: faEyeSlash, escudo: faShieldHeart };

  constructor(
    private readonly auth: Autenticacion,
    private readonly sesion: Sesion,
    private readonly router: Router,
    private readonly carga: CargaGlobal,
  ) {}

  cambiarModo(modo: 'ingresar' | 'crear'): void {
    this.modo.set(modo);
    this.error.set('');
  }

  enviar(form: NgForm): void {
    if (form.invalid || (this.modo() === 'crear' && !this.aceptaPrivacidad)) {
      form.control.markAllAsTouched();
      this.error.set('Revisa el correo, la clave y la confirmacion de privacidad.');
      return;
    }

    this.ejecutarAcceso(
      this.modo() === 'crear'
        ? this.auth.registroTutorFirebase({ email: this.email.trim(), password: this.password })
        : this.auth.loginTutorEmailFirebase(this.email.trim(), this.password),
    );
  }

  continuarGoogle(): void {
    if (this.modo() === 'crear' && !this.aceptaPrivacidad) {
      this.error.set('Acepta la politica de privacidad antes de crear la cuenta familiar.');
      return;
    }

    this.ejecutarAcceso(this.auth.loginTutorGoogleFirebase(this.modo() === 'crear'));
  }

  private ejecutarAcceso(solicitud: ReturnType<Autenticacion['loginTutorEmailFirebase']>): void {
    this.enviando.set(true);
    this.error.set('');
    const operacion = this.carga.mostrar('Protegiendo tu acceso familiar...');

    solicitud.subscribe({
      next: () => {
        if (!this.sesion.esTutor()) {
          this.sesion.limpiar();
          this.error.set('Esta cuenta no pertenece al portal familiar.');
          this.enviando.set(false);
          this.carga.ocultar(operacion);
          return;
        }
        void this.router.navigateByUrl('/familias').finally(() => this.carga.ocultar(operacion));
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? error?.message ?? 'No pudimos abrir el portal familiar.');
        this.enviando.set(false);
        this.carga.ocultar(operacion);
      },
    });
  }
}
