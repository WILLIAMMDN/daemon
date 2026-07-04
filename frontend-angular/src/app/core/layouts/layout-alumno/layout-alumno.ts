import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faChevronDown, faMagnifyingGlass, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { EmailVerificationBanner } from '../../../shared/componentes/email-verification-banner/email-verification-banner';
import { MonedaDaemon } from '../../../shared/componentes/moneda-daemon/moneda-daemon';
import { SidebarPortal } from '../../../shared/componentes/sidebar-portal/sidebar-portal';
import { Activos } from '../../servicios/activos';
import { Autenticacion } from '../../servicios/autenticacion';
import { CargaGlobal } from '../../servicios/carga-global';
import { Sesion } from '../../servicios/sesion';
import { alumnoSidebarSections } from '../portal-sidebar.config';

@Component({
  selector: 'app-layout-alumno',
  imports: [RouterOutlet, RouterLink, FontAwesomeModule, NzAvatarModule, NzBadgeModule, NzButtonModule, EmailVerificationBanner, MonedaDaemon, SidebarPortal],
  templateUrl: './layout-alumno.html',
  styleUrl: './layout-alumno.scss',
})
export class LayoutAlumno {
  readonly seccionesSidebar = alumnoSidebarSections;
  readonly iconos = {
    buscar: faMagnifyingGlass,
    campana: faBell,
    rango: faShieldHalved,
    desplegar: faChevronDown,
  };

  constructor(
    public sesion: Sesion,
    private auth: Autenticacion,
    private router: Router,
    private activos: Activos,
    private cargaGlobal: CargaGlobal,
  ) {}

  perfilDetalle(): string {
    const usuario = this.sesion.usuario();
    return `${usuario?.nivel || 'Nivel'} - ${usuario?.tokens || 0} tokens`;
  }

  perfilNivel(): string | null {
    const usuario = this.sesion.usuario();
    if (!usuario?.nivel) {
      return null;
    }
    return usuario.nivel.startsWith('Nivel') ? usuario.nivel : `Nivel ${usuario.nivel}`;
  }

  perfilTokens(): number | null {
    return this.sesion.usuario()?.tokens ?? null;
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
    const carga = this.cargaGlobal.mostrar('Cerrando sesion...');

    this.auth.logout().subscribe({
      next: () => this.volverAlLogin(carga),
      error: () => {
        this.sesion.limpiar();
        this.volverAlLogin(carga);
      },
    });
  }

  private volverAlLogin(carga: symbol): void {
    this.cargaGlobal.cambiarMensaje('Volviendo al login...');
    setTimeout(() => {
      void this.router.navigateByUrl('/login').finally(() => this.cargaGlobal.ocultar(carga));
    }, 420);
  }
}
