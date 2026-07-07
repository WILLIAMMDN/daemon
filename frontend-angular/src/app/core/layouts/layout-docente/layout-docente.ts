import { Component , ChangeDetectionStrategy} from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { EmailVerificationBanner } from '../../../shared/componentes/email-verification-banner/email-verification-banner';
import { SidebarPortal } from '../../../shared/componentes/sidebar-portal/sidebar-portal';
import { Activos } from '../../servicios/activos';
import { Autenticacion } from '../../servicios/autenticacion';
import { CargaGlobal } from '../../servicios/carga-global';
import { Sesion } from '../../servicios/sesion';
import { docenteSidebarSections } from '../portal-sidebar.config';

import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faChevronDown, faUser, faGear, faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-layout-docente',
  imports: [RouterOutlet, RouterLink, NzAvatarModule, NzBadgeModule, NzButtonModule, NzDropDownModule, FontAwesomeModule, EmailVerificationBanner, SidebarPortal],
  templateUrl: './layout-docente.html',
  styleUrl: './layout-docente.scss',
})
export class LayoutDocente {
  readonly seccionesSidebar = docenteSidebarSections;
  readonly iconos = {
    campana: faBell,
    desplegar: faChevronDown,
    perfil: faUser,
    config: faGear,
    salir: faArrowRightFromBracket
  };

  // Mock notifications to show a functional dropdown
  notificaciones = [
    { id: 1, titulo: 'Nueva entrega', mensaje: 'El alumno Juan Pérez ha entregado la misión "Cerebro de Oro".', leida: false, tiempo: 'Hace 5 min' },
    { id: 2, titulo: 'Canje solicitado', mensaje: 'María Gómez solicitó canjear "Lápiz 3D" por 50 tokens.', leida: false, tiempo: 'Hace 1 hora' },
    { id: 3, titulo: 'Sistema actualizado', mensaje: 'El portal ha sido actualizado a la última versión.', leida: true, tiempo: 'Hace 1 día' }
  ];

  get notificacionesNoLeidas(): number {
    return this.notificaciones.filter(n => !n.leida).length;
  }

  marcarComoLeidas(): void {
    this.notificaciones = this.notificaciones.map(n => ({ ...n, leida: true }));
  }

  constructor(
    public sesion: Sesion,
    private auth: Autenticacion,
    private router: Router,
    private activos: Activos,
    private cargaGlobal: CargaGlobal,
  ) {}

  perfilDetalle(): string {
    const rol = this.sesion.usuario()?.rol === 'admin' ? 'Administrador académico' : 'Administración académica';
    return rol;
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
