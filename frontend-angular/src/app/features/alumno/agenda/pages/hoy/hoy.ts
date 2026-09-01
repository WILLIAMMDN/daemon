import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { Actividades } from '../../../services/actividades';
import { ListaActividades } from '../../../componentes/lista-actividades/lista-actividades';

/**
 * Hoy — lo que está abierto ahora mismo.
 *
 * La plataforma no publica todavía fechas de vencimiento ni sesiones
 * programadas, así que “hoy” se construye con lo único que sí tiene un estado
 * temporal real: la ronda de competencia en vivo, las evaluaciones activas y
 * las entregas devueltas para corregir.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hoy',
  imports: [RouterLink, NzAlertModule, NzButtonModule, NzSkeletonModule, ArcSection, EstadoVacio, ListaActividades],
  templateUrl: './hoy.html',
  styleUrl: './hoy.scss',
})
export class Hoy {
  readonly actividades = inject(Actividades);

  readonly evaluacionesAbiertas = computed(() =>
    this.actividades.actividades().filter((actividad) => actividad.tipo === 'evaluacion'),
  );
  readonly correcciones = computed(() =>
    this.actividades.actividades().filter((actividad) => actividad.estado === 'requiereCorreccion'),
  );
  readonly sinNadaHoy = computed(
    () => !this.actividades.eventoEnVivo() && !this.evaluacionesAbiertas().length && !this.correcciones().length,
  );

  constructor() {
    this.actividades.asegurarCargado();
  }
}
