import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificacionesService } from '../../../../core/servicios/notificaciones.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckCircle, faCircle, faTrash, faBell } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, DatePipe, FontAwesomeModule],
  templateUrl: './notificaciones.html'
})
export class NotificacionesPage implements OnInit {
  private readonly notificacionesService = inject(NotificacionesService);
  
  notificaciones = this.notificacionesService.notificaciones;
  cargando = signal(false);
  filtroActual = signal<'todas' | 'no_leidas'>('todas');
  busqueda = signal('');

  iconos = {
    check: faCheckCircle,
    uncheck: faCircle,
    trash: faTrash,
    bell: faBell
  };

  constructor() {}

  ngOnInit(): void {
    this.notificacionesService.cargarNotificaciones().subscribe();
  }

  marcarComoLeida(id: number): void {
    this.notificacionesService.marcarComoLeida(id).subscribe();
  }

  marcarTodasComoLeidas(): void {
    this.notificacionesService.marcarTodasComoLeidas().subscribe();
  }
}
