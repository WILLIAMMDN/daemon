import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ActividadAlumno, EstadoActividad } from '../../services/actividades';

const COLOR_ESTADO: Record<EstadoActividad, string> = {
  porHacer: 'processing',
  enRevision: 'warning',
  requiereCorreccion: 'error',
  completada: 'success',
};

/** Lista de actividades reales del estudiante, compartida por Aprender y Agenda. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lista-actividades',
  imports: [DatePipe, RouterLink, NzListModule, NzTagModule],
  templateUrl: './lista-actividades.html',
  styleUrl: './lista-actividades.scss',
})
export class ListaActividades {
  readonly actividades = input.required<ActividadAlumno[]>();
  /** Muestra la fecha registrada por la plataforma (entrega o publicación). */
  readonly mostrarFecha = input(false);

  color(estado: EstadoActividad): string {
    return COLOR_ESTADO[estado];
  }
}
