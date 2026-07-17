import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificacionesService } from '../../../../core/servicios/notificaciones.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckCircle, faCircle, faBell } from '@fortawesome/free-solid-svg-icons';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { finalize } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-notificaciones',
  imports: [DatePipe, FontAwesomeModule, Cargando, EstadoVacio],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.scss',
})
export class NotificacionesPage implements OnInit {
  private readonly notificacionesService = inject(NotificacionesService);
  
  notificaciones = this.notificacionesService.notificaciones;
  cargando = signal(true);
  error = signal('');
  procesando = signal<number | 'todas' | null>(null);
  filtroActual = signal<'todas' | 'no_leidas'>('todas');
  noLeidas = this.notificacionesService.noLeidas;
  notificacionesFiltradas = computed(() => this.filtroActual() === 'no_leidas'
    ? this.notificaciones().filter((notificacion) => !notificacion.leida)
    : this.notificaciones());

  iconos = {
    check: faCheckCircle,
    uncheck: faCircle,
    bell: faBell
  };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.notificacionesService.cargarNotificaciones().pipe(finalize(() => this.cargando.set(false))).subscribe({
      error: (error) => this.error.set(error.error?.message ?? 'No se pudieron cargar las notificaciones.'),
    });
  }

  marcarComoLeida(id: number): void {
    if (this.procesando() !== null) return;
    this.procesando.set(id);
    this.error.set('');
    this.notificacionesService.marcarComoLeida(id).pipe(finalize(() => this.procesando.set(null))).subscribe({
      error: (error) => this.error.set(error.error?.message ?? 'No se pudo actualizar la notificación.'),
    });
  }

  marcarTodasComoLeidas(): void {
    if (!this.noLeidas() || this.procesando() !== null) return;
    this.procesando.set('todas');
    this.error.set('');
    this.notificacionesService.marcarTodasComoLeidas().pipe(finalize(() => this.procesando.set(null))).subscribe({
      error: (error) => this.error.set(error.error?.message ?? 'No se pudieron marcar las notificaciones.'),
    });
  }
}
