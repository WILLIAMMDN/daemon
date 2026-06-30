import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { EmailVerificationBanner } from '../../../shared/componentes/email-verification-banner/email-verification-banner';
import { SidebarPortal } from '../../../shared/componentes/sidebar-portal/sidebar-portal';
import { Autenticacion } from '../../servicios/autenticacion';
import { Sesion } from '../../servicios/sesion';
import { alumnoSidebarSections } from '../portal-sidebar.config';

@Component({
  selector: 'app-layout-alumno',
  imports: [RouterOutlet, NzButtonModule, EmailVerificationBanner, SidebarPortal],
  templateUrl: './layout-alumno.html',
  styleUrl: './layout-alumno.scss',
})
export class LayoutAlumno {
  readonly seccionesSidebar = alumnoSidebarSections;

  constructor(public sesion: Sesion, private auth: Autenticacion, private router: Router) {}

  perfilDetalle(): string {
    const usuario = this.sesion.usuario();
    return `${usuario?.nivel || 'Nivel'} - ${usuario?.tokens || 0} tokens`;
  }

  salir(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => {
        this.sesion.limpiar();
        this.router.navigateByUrl('/login');
      },
    });
  }
}
