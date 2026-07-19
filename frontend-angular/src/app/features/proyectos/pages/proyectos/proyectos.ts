import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowRight,
  faBookOpen,
  faDiagramProject,
  faFlask,
  faRotateRight,
  faRobot,
} from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ApiError } from '../../../../core/servicios/api';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { IllustrationSlot } from '../../../../shared/componentes/illustration-slot/illustration-slot';
import { TarjetaCategoriaProyecto } from '../../componentes/tarjeta-categoria-proyecto/tarjeta-categoria-proyecto';
import { CategoriaProyecto, ProyectosResponse } from '../../models/proyecto.models';
import { Proyecto } from '../../services/proyecto';

interface CategoriaProyectoVista extends CategoriaProyecto {
  icono: IconDefinition;
  imagen: string | null;
  assetName: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-proyectos',
  imports: [
    RouterLink,
    FontAwesomeModule,
    NzButtonModule,
    EstadoVacio,
    IllustrationSlot,
    TarjetaCategoriaProyecto,
  ],
  templateUrl: './proyectos.html',
  styleUrl: './proyectos.scss',
})
export class Proyectos {
  private readonly proyectos = inject(Proyecto);

  readonly faArrowRight = faArrowRight;
  readonly faDiagramProject = faDiagramProject;
  readonly faRotateRight = faRotateRight;
  readonly datos = signal<ProyectosResponse | null>(null);
  readonly cargando = signal(true);
  readonly refrescando = signal(false);
  readonly error = signal('');
  readonly datosConservados = signal(false);

  readonly categorias = computed<CategoriaProyectoVista[]>(() =>
    (this.datos()?.categorias ?? []).map((categoria) => ({
      ...categoria,
      ...this.presentacion(categoria.slug),
    })),
  );

  constructor() {
    this.cargar();
  }

  cargar(fresh = false): void {
    const conservaDatos = Boolean(this.datos());
    this.cargando.set(!conservaDatos);
    this.refrescando.set(conservaDatos);
    this.error.set('');
    this.datosConservados.set(false);

    this.proyectos.catalogo(fresh)
      .pipe(finalize(() => {
        this.cargando.set(false);
        this.refrescando.set(false);
      }))
      .subscribe({
        next: (datos) => {
          const eraCargaInicial = this.cargando();
          this.datos.set(datos);
          this.cargando.set(false);
          this.refrescando.set(eraCargaInicial);
          this.datosConservados.set(false);
        },
        error: (error: unknown) => {
          this.datosConservados.set(Boolean(this.datos()));
          this.error.set(error instanceof ApiError && error.kind === 'offline'
            ? 'No pudimos conectar con DAEMON. Revisa tu conexión e inténtalo nuevamente.'
            : 'No pudimos cargar tus áreas de proyecto. Inténtalo nuevamente.');
        },
      });
  }

  private presentacion(slug: string): Pick<CategoriaProyectoVista, 'icono' | 'imagen' | 'assetName'> {
    const presentaciones: Record<string, Pick<CategoriaProyectoVista, 'icono' | 'imagen' | 'assetName'>> = {
      cuentos: {
        icono: faBookOpen,
        imagen: '/img/hero-monster.png',
        assetName: 'projects-stories-cover.webp',
      },
      'ia-aplicada': {
        icono: faRobot,
        imagen: '/img/robot-mision.png',
        assetName: 'projects-ai-assistant-cover.webp',
      },
      'laboratorio-ia': {
        icono: faFlask,
        imagen: '/img/monstruo-racha.png',
        assetName: 'projects-lab-cover.webp',
      },
    };

    return presentaciones[slug] ?? {
      icono: faDiagramProject,
      imagen: null,
      assetName: `projects-${slug}-cover.webp`,
    };
  }
}
