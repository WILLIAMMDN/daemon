import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { EmailVerificationBanner } from '../../../shared/componentes/email-verification-banner/email-verification-banner';
import { SidebarPortal } from '../../../shared/componentes/sidebar-portal/sidebar-portal';
import { Autenticacion } from '../../servicios/autenticacion';
import { Sesion } from '../../servicios/sesion';
import { docenteSidebarSections } from '../portal-sidebar.config';

@Component({
  selector: 'app-layout-docente',
  imports: [RouterOutlet, EmailVerificationBanner, SidebarPortal],
  templateUrl: './layout-docente.html',
  styleUrl: './layout-docente.scss',
})
export class LayoutDocente {
  readonly seccionesSidebar = docenteSidebarSections;

  constructor(public sesion: Sesion, private auth: Autenticacion, private router: Router) {}

  perfilDetalle(): string {
    const rol = this.sesion.usuario()?.rol === 'admin' ? 'Administrador académico' : 'Administración académica';
    return rol;
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
