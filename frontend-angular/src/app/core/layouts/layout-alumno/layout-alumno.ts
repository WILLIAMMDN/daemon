import { Component, ChangeDetectionStrategy, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import '../../../../../node_modules/ng-zorro-antd/descriptions/style/index.min.css';
import '../../../../../node_modules/ng-zorro-antd/statistic/style/index.min.css';
import '../../../../../node_modules/ng-zorro-antd/table/style/index.min.css';
import '../../../../../node_modules/ng-zorro-antd/upload/style/index.min.css';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBookOpenReader,
  faHouse,
  faRankingStar,
  faRocket,
  faStore,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { EmailVerificationBanner } from '../../componentes/email-verification-banner/email-verification-banner';
import { SidebarPortal } from '../sidebar-portal/sidebar-portal';
import { Autenticacion } from '../../servicios/autenticacion';
import { CargaGlobal } from '../../servicios/carga-global';
import { BienestarDigital, EstadoBienestarDigital } from '../../servicios/bienestar-digital';
import { Sesion } from '../../servicios/sesion';
import { NotificacionesService } from '../../servicios/notificaciones.service';
import { alumnoSidebarSections } from '../portal-sidebar.config';
import { temaPortalAlumno } from '../../dominio/tema-portal-alumno';

import { TourService } from '../../servicios/tour.service';
import { TopbarAlumno } from '../topbar-alumno/topbar-alumno';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-layout-alumno',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FontAwesomeModule, EmailVerificationBanner, SidebarPortal, TopbarAlumno],
  templateUrl: './layout-alumno.html',
  styleUrl: './layout-alumno.scss',
})
export class LayoutAlumno implements OnInit, OnDestroy {
  public readonly sesion = inject(Sesion);
  private readonly autenticacion = inject(Autenticacion);
  private readonly notificacionesService = inject(NotificacionesService);
  private readonly tourService = inject(TourService);
  private readonly router = inject(Router);
  private readonly cargaGlobal = inject(CargaGlobal);
  private readonly titleService = inject(Title);
  private readonly bienestarService = inject(BienestarDigital);
  private latidoId: number | null = null;
  readonly bienestar = signal<EstadoBienestarDigital | null>(null);

  readonly seccionesSidebar = alumnoSidebarSections;
  readonly temaPortal = computed(() => temaPortalAlumno(this.sesion.usuario()?.nivel));
  readonly iconos = {
    descanso: faBookOpenReader,
    inicio: faHouse,
    misiones: faRocket,
    tienda: faStore,
    ranking: faRankingStar,
    perfil: faUser,
  };

  constructor() {
    this.titleService.setTitle('Portal Alumno | DAEMON');
  }

  ngOnInit(): void {
    this.notificacionesService.cargarNotificaciones().subscribe();
    this.tourService.iniciarTourAlumno();
    this.cargarBienestar();
    this.latidoId = window.setInterval(() => this.registrarLatido(), 60000);
  }

  ngOnDestroy(): void {
    if (this.latidoId !== null) window.clearInterval(this.latidoId);
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

  private cargarBienestar(): void {
    this.bienestarService.estado().subscribe({
      next: ({ bienestar_digital }) => this.bienestar.set(bienestar_digital),
      error: () => this.bienestar.set(null),
    });
  }

  private registrarLatido(): void {
    const estado = this.bienestar();
    if (document.visibilityState !== 'visible' || !estado?.activo || estado.bloqueado) return;

    this.bienestarService.latido().subscribe({
      next: ({ bienestar_digital }) => this.bienestar.set(bienestar_digital),
      error: () => { /* El control falla abierto para no cortar una clase por un error de red. */ },
    });
  }

  private volverAlLogin(carga: symbol): void {
    this.cargaGlobal.cambiarMensaje('Volviendo al login...');
    setTimeout(() => {
      void this.router.navigateByUrl('/login').finally(() => this.cargaGlobal.ocultar(carga));
    }, 420);
  }
}
