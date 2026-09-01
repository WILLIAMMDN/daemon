import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { Proyecto } from '../../../../proyectos/services/proyecto';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

interface PuntoDePartida {
  titulo: string;
  descripcion: string;
  ruta: string;
  etiqueta: string;
}

/**
 * Estudio — el punto de entrada a los flujos de creación que la plataforma ya
 * tiene implementados. No es un editor nuevo: cada tarjeta abre la herramienta
 * real que corresponde.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-estudio',
  imports: [RouterLink, NzSkeletonModule, NzTagModule, ArcSection],
  templateUrl: './estudio.html',
  styleUrl: './estudio.scss',
})
export class Estudio {
  private readonly proyectos = inject(Proyecto);

  readonly puntosDePartida: PuntoDePartida[] = [
    {
      titulo: 'Nueva historia',
      descripcion: 'Escribe e ilustra un cuento por escenas y publícalo cuando esté listo.',
      ruta: '/alumno/crear/historias/crear',
      etiqueta: 'Narrativa',
    },
    {
      titulo: 'Nuevo asistente',
      descripcion: 'Define la personalidad y las instrucciones de tu bot conversacional.',
      ruta: '/alumno/crear/bot',
      etiqueta: 'IA',
    },
    {
      titulo: 'Entrenar el cerebro IA',
      descripcion: 'Ajusta la matriz de aprendizaje por refuerzo del laboratorio.',
      ruta: '/alumno/crear/laboratorio',
      etiqueta: 'Laboratorio',
    },
  ];

  private readonly catalogo = toSignal(this.proyectos.catalogo().pipe(catchError(() => of(null))), {
    initialValue: undefined,
  });

  readonly cargando = computed(() => this.catalogo() === undefined);
  readonly areasConActividad = computed(
    () => this.catalogo()?.categorias.filter((categoria) => categoria.tiene_actividad) ?? [],
  );
}
