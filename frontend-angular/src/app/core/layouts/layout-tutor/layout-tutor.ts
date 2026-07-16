import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRightFromBracket, faShieldHeart } from '@fortawesome/free-solid-svg-icons';
import { EmailVerificationBanner } from '../../componentes/email-verification-banner/email-verification-banner';
import { Autenticacion } from '../../servicios/autenticacion';
import { CargaGlobal } from '../../servicios/carga-global';
import { Sesion } from '../../servicios/sesion';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-layout-tutor',
  imports: [RouterOutlet, RouterLink, FontAwesomeModule, EmailVerificationBanner],
  templateUrl: './layout-tutor.html',
  styleUrl: './layout-tutor.scss',
})
export class LayoutTutor {
  readonly sesion = inject(Sesion);
  readonly iconos = { escudo: faShieldHeart, salir: faArrowRightFromBracket };
  private readonly autenticacion = inject(Autenticacion);
  private readonly router = inject(Router);
  private readonly carga = inject(CargaGlobal);

  salir(): void {
    const operacion = this.carga.mostrar('Cerrando el portal familiar...');
    this.autenticacion.logout().subscribe({
      next: () => this.volver(operacion),
      error: () => { this.sesion.limpiar(); this.volver(operacion); },
    });
  }

  private volver(operacion: symbol): void {
    void this.router.navigateByUrl('/familias/acceso').finally(() => this.carga.ocultar(operacion));
  }
}
