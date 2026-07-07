import { Component , ChangeDetectionStrategy} from '@angular/core';
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

import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { faUser, faGear, faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-layout-alumno',
  imports: [RouterOutlet, RouterLink, FontAwesomeModule, NzAvatarModule, NzBadgeModule, NzButtonModule, NzDropDownModule, EmailVerificationBanner, MonedaDaemon, SidebarPortal],
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
    perfil: faUser,
    config: faGear,
    salir: faArrowRightFromBracket
  };

  // Mock notifications to show a functional dropdown
  notificaciones = [
    { id: 1, titulo: 'Insignia ganada', mensaje: '¡Felicidades! Has ganado la insignia "Primeros Pasos".', leida: false, tiempo: 'Hace 10 min' },
    { id: 2, titulo: 'Misión revisada', mensaje: 'Tu profesor ha revisado tu entrega. ¡Revisa tu feedback!', leida: false, tiempo: 'Hace 2 horas' },
    { id: 3, titulo: 'Nueva misión', mensaje: 'Hay una nueva misión disponible en tu aula.', leida: true, tiempo: 'Hace 1 día' }
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
