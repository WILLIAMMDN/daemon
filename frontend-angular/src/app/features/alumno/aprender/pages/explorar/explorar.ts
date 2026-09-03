import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { RutaDisponibleDto } from '../../../models/contexto-alumno.model';
import { Aprendizaje } from '../../../services/aprendizaje';

/**
 * Explorar — Oportunidades de aprendizaje elegibles para el estudiante.
 *
 * Su responsabilidad NO es duplicar "Mis cursos". Muestra rutas publicadas
 * elegibles para la audiencia del alumno (KIDS, TEENS, TODOS) dentro de su
 * institución. Si no hay ofertas adicionales de autoinscripción, presenta un
 * estado vacío transparente y honesto.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-explorar',
  imports: [RouterLink, NzAlertModule, NzButtonModule, NzSkeletonModule, NzTagModule, ArcSection, EstadoVacio],
  templateUrl: './explorar.html',
  styleUrl: './explorar.scss',
})
export class Explorar {
  private readonly aprendizaje = inject(Aprendizaje);

  readonly rutas = signal<RutaDisponibleDto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly sinRutas = computed(() => !this.cargando() && this.rutas().length === 0);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.aprendizaje.rutasDisponibles().subscribe({
      next: (respuesta) => {
        this.rutas.set(respuesta?.paths ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar las oportunidades de aprendizaje en este momento.');
        this.cargando.set(false);
      },
    });
  }

  etiquetaDificultad(etapa: string): string {
    switch (etapa?.toLowerCase()) {
      case 'inicial':
        return 'Nivel Inicial';
      case 'intermedia':
        return 'Nivel Intermedio';
      case 'avanzada':
        return 'Nivel Avanzado';
      default:
        return etapa || 'General';
    }
  }
}
