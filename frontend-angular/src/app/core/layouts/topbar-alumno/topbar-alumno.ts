import { ChangeDetectionStrategy, Component, computed, inject, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faChevronDown, faHouse } from '@fortawesome/free-solid-svg-icons';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { DatePipe } from '@angular/common';
import { MonedaDaemon } from '../../../shared/componentes/moneda-daemon/moneda-daemon';
import { Activos } from '../../servicios/activos';
import { Sesion } from '../../servicios/sesion';
import { NotificacionesService } from '../../servicios/notificaciones.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-topbar-alumno',
  imports: [RouterLink, FontAwesomeModule, NzAvatarModule, NzBadgeModule, NzDropDownModule, MonedaDaemon, DatePipe],
  templateUrl: './topbar-alumno.html',
  styleUrl: './topbar-alumno.scss',
})
export class TopbarAlumno {
  @Output() abrirMenuMovil = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  public readonly sesion = inject(Sesion);
  private readonly activos = inject(Activos);
  private readonly notificacionesService = inject(NotificacionesService);

  readonly iconos = {
    campana: faBell,
    desplegar: faChevronDown,
    inicio: faHouse,
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
}
