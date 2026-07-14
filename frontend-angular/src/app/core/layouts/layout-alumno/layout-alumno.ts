import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faChevronDown, faMagnifyingGlass, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { EmailVerificationBanner } from '../../../shared/componentes/email-verification-banner/email-verification-banner';
import { MonedaDaemon } from '../../../shared/componentes/moneda-daemon/moneda-daemon';
import { SidebarPortal } from '../../../shared/componentes/sidebar-portal/sidebar-portal';
import { Activos } from '../../servicios/activos';
import { Autenticacion } from '../../servicios/autenticacion';
import { CargaGlobal } from '../../servicios/carga-global';
import { Sesion } from '../../servicios/sesion';
import { NotificacionesService } from '../../servicios/notificaciones.service';
import { alumnoSidebarSections } from '../portal-sidebar.config';

import { TourService } from '../../servicios/tour.service';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { faUser, faGear, faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-layout-alumno',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FontAwesomeModule, NzAvatarModule, NzBadgeModule, NzButtonModule, NzDropDownModule, NzProgressModule, EmailVerificationBanner, MonedaDaemon, SidebarPortal, DatePipe],
  templateUrl: './layout-alumno.html',
  styleUrl: './layout-alumno.scss',
})
export class LayoutAlumno implements OnInit {
  public readonly sesion = inject(Sesion);
  private readonly autenticacion = inject(Autenticacion);
  private readonly notificacionesService = inject(NotificacionesService);
  private readonly tourService = inject(TourService);
  private readonly router = inject(Router);
  private readonly activos = inject(Activos);
  private readonly cargaGlobal = inject(CargaGlobal);
  private readonly titleService = inject(Title);

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

  // Servicio de Notificaciones
  notificaciones = this.notificacionesService.notificaciones;
  notificacionesNoLeidas = this.notificacionesService.noLeidas;

  constructor() {
    this.titleService.setTitle('Portal Alumno | DAEMON');
  }

  ngOnInit(): void {
    this.notificacionesService.cargarNotificaciones().subscribe();
    this.tourService.iniciarTourAlumno();
  }

  marcarComoLeidas(): void {
    if (this.notificacionesNoLeidas() > 0) {
      this.notificacionesService.marcarTodasComoLeidas().subscribe();
    }
  }

  perfilDetalle(): string {
    const usuario = this.sesion.usuario();
    return `Nivel ${this.nivelGamificacion()} - ${usuario?.tokens || 0} DAEMONS`;
  }

  perfilNivel(): string | null {
    const usuario = this.sesion.usuario();
    if (!usuario?.nivel) {
      return null;
    }
    return `Nivel ${this.nivelGamificacion()} · ${usuario.nivel}`;
  }

  perfilTokens(): number | null {
    return this.sesion.usuario()?.tokens ?? null;
  }

  nivelGamificacion(): number {
    return this.sesion.usuario()?.nivel_gamificacion ?? 1;
  }

  progresoNivel(): number {
    return this.sesion.usuario()?.progreso_nivel?.progreso_porcentaje ?? 0;
  }

  xpRestante(): number {
    return this.sesion.usuario()?.progreso_nivel?.experiencia_restante ?? 100;
  }

  readonly formatoNivel = (): string => `${this.nivelGamificacion()}`;

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
