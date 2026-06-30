import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { EmailVerificationBanner } from '../../../shared/componentes/email-verification-banner/email-verification-banner';
import { SidebarPortal } from '../../../shared/componentes/sidebar-portal/sidebar-portal';
import { Activos } from '../../servicios/activos';
import { Autenticacion } from '../../servicios/autenticacion';
import { Sesion } from '../../servicios/sesion';
import { docenteSidebarSections } from '../portal-sidebar.config';

@Component({
  selector: 'app-layout-docente',
  imports: [RouterOutlet, NzAvatarModule, NzBadgeModule, NzButtonModule, EmailVerificationBanner, SidebarPortal],
  templateUrl: './layout-docente.html',
  styleUrl: './layout-docente.scss',
})
export class LayoutDocente {
  readonly seccionesSidebar = docenteSidebarSections;

  constructor(public sesion: Sesion, private auth: Autenticacion, private router: Router, private activos: Activos) {}

  perfilDetalle(): string {
    const rol = this.sesion.usuario()?.rol === 'admin' ? 'Administrador académico' : 'Administración académica';
    return rol;
  }

  avatarUrl(): string {
    return this.activos.url(this.sesion.usuario()?.avatar);
  }

  iniciales(): string {
    const usuario = this.sesion.usuario();
    const base = usuario?.nombre_completo || usuario?.usuario || 'DAEMON';
    return base
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('') || 'D';
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
