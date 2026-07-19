import { ChangeDetectionStrategy, Component, computed, inject, Output, EventEmitter, signal } from '@angular/core';
import '../../../../../node_modules/ng-zorro-antd/dropdown/style/index.min.css';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faChevronDown, faHouse, faRightFromBracket, faTriangleExclamation, faUser } from '@fortawesome/free-solid-svg-icons';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { DatePipe } from '@angular/common';
import { EstadoVacio } from '../../../shared/componentes/estado-vacio/estado-vacio';
import { MonedaDaemon } from '../../../shared/componentes/moneda-daemon/moneda-daemon';
import { Activos } from '../../servicios/activos';
import { Sesion } from '../../servicios/sesion';
import { NotificacionesService } from '../../servicios/notificaciones.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-topbar-alumno',
  imports: [RouterLink, FontAwesomeModule, NzAvatarModule, NzBadgeModule, NzDropDownModule, EstadoVacio, MonedaDaemon, DatePipe],
  templateUrl: './topbar-alumno.html',
  styleUrl: './topbar-alumno.scss',
})
export class TopbarAlumno {
  @Output() abrirMenuMovil = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  public readonly sesion = inject(Sesion);
  private readonly activos = inject(Activos);
  private readonly notificacionesService = inject(NotificacionesService);
  private readonly router = inject(Router);

  /**
   * Estado explícito de ambos dropdowns. Así podemos hacerlos mutuamente
   * excluyentes y cerrarlos antes de navegar o cerrar sesión.
   */
  readonly notifMenuAbierto = signal(false);
  readonly perfilMenuAbierto = signal(false);

  readonly iconos = {
    alerta: faTriangleExclamation,
    campana: faBell,
    desplegar: faChevronDown,
    inicio: faHouse,
    perfil: faUser,
    salir: faRightFromBracket,
  };

  notificaciones = this.notificacionesService.notificaciones;
  notificacionesNoLeidas = this.notificacionesService.noLeidas;

  readonly nivelGamificacion = computed(() => this.sesion.usuario()?.nivel_gamificacion ?? 1);
  readonly xpRestante = computed(() => this.sesion.usuario()?.progreso_nivel?.experiencia_restante ?? 100);
  readonly progresoNivel = computed(() => this.sesion.usuario()?.progreso_nivel?.progreso_porcentaje ?? 0);
  readonly perfilTokens = computed(() => this.sesion.usuario()?.tokens ?? 0);

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

  marcarComoLeidas(): void {
    if (this.notificacionesNoLeidas() > 0) {
      this.notificacionesService.marcarTodasComoLeidas().subscribe();
    }
  }

  cambiarVisibilidadNotificaciones(abierto: boolean): void {
    this.notifMenuAbierto.set(abierto);

    if (!abierto) {
      return;
    }

    this.perfilMenuAbierto.set(false);
    this.marcarComoLeidas();
  }

  cambiarVisibilidadPerfil(abierto: boolean): void {
    this.perfilMenuAbierto.set(abierto);

    if (abierto) {
      this.notifMenuAbierto.set(false);
    }
  }

  cerrarSesion(): void {
    this.perfilMenuAbierto.set(false);
    this.logout.emit();
  }

  /**
   * El footer "Ver todas o configurar alertas" vive dentro de un
   * CDK overlay de ng-zorro, donde el `routerLink` directive no se
   * procesa de forma confiable: el navegador termina tratando el
   * `<a>` como un anchor normal, hace reload, y el estado de
   * autenticación se pierde. Hacemos la navegación programática y
   * cerramos el dropdown explícitamente.
   */
  irANotificaciones(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.notifMenuAbierto.set(false);
    this.perfilMenuAbierto.set(false);
    void this.router.navigateByUrl('/alumno/notificaciones');
  }
}
