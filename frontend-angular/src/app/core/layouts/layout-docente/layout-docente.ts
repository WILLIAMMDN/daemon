import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
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
import { NotificacionesService } from '../../servicios/notificaciones.service';

import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faChevronDown, faUser, faGear, faArrowRightFromBracket, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-layout-docente',
  imports: [RouterOutlet, RouterLink, NzAvatarModule, NzBadgeModule, NzButtonModule, NzDropDownModule, FontAwesomeModule, EmailVerificationBanner, SidebarPortal, DatePipe],
  templateUrl: './layout-docente.html',
  styleUrl: './layout-docente.scss',
})
export class LayoutDocente implements OnInit {
  public readonly sesion = inject(Sesion);
  private readonly autenticacion = inject(Autenticacion);
  private readonly router = inject(Router);
  private readonly activos = inject(Activos);
  private readonly cargaGlobal = inject(CargaGlobal);
  private readonly titleService = inject(Title);
  private readonly notificacionesService = inject(NotificacionesService);

  readonly seccionesSidebar = docenteSidebarSections;
  readonly iconos = {
    buscar: faMagnifyingGlass,
    campana: faBell,
    desplegar: faChevronDown,
    perfil: faUser,
    config: faGear,
    salir: faArrowRightFromBracket
  };

  busqueda = signal('');
  notificaciones = this.notificacionesService.notificaciones;
  notificacionesNoLeidas = this.notificacionesService.noLeidas;

  constructor() {
    this.titleService.setTitle('Panel Docente | DAEMON');
  }

  ngOnInit(): void {
    this.notificacionesService.cargarNotificaciones().subscribe();
  }

  marcarComoLeidas(): void {
    if (this.notificacionesNoLeidas() > 0) {
      this.notificacionesService.marcarTodasComoLeidas().subscribe();
    }
  }

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

    this.autenticacion.logout().subscribe({
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
