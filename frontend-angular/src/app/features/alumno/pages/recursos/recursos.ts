import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowRight,
  faBookOpen,
  faCheck,
  faCircleCheck,
  faCircleInfo,
  faCirclePlay,
  faClock,
  faFlag,
  faGrip,
  faLayerGroup,
  faMagnifyingGlass,
  faPersonChalkboard,
  faRotateRight,
  faRocket,
  faStar,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { Api, ApiError } from '../../../../core/servicios/api';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { IllustrationSlot } from '../../../../shared/componentes/illustration-slot/illustration-slot';

type EstadoCurso = 'notStarted' | 'inProgress' | 'completed';
type FiltroCurso = 'all' | EstadoCurso;
type TipoProblema = 'generic' | 'offline' | 'permission' | 'timeout';

interface ProgresoLeccion {
  estado: EstadoCurso;
  porcentaje: number;
}

interface Leccion {
  id: number;
  titulo: string;
  resumen?: string | null;
  duracion_minutos?: number | null;
  progresos: ProgresoLeccion[];
}

interface Unidad {
  id: number;
  titulo: string;
  descripcion?: string | null;
  lecciones: Leccion[];
}

interface Curso {
  id: number;
  titulo: string;
  descripcion?: string | null;
  nivel?: string | null;
  ilustracion_url?: string | null;
  unidades: Unidad[];
}

interface AprendizajeResponse {
  cursos: Curso[];
  resumen: { cursos: number; lecciones: number; completadas: number; porcentaje: number };
}

interface LeccionVista extends Leccion {
  progresoActual: ProgresoLeccion;
}

interface UnidadVista extends Omit<Unidad, 'lecciones'> {
  orden: number;
  lecciones: LeccionVista[];
}

interface CursoVista extends Omit<Curso, 'unidades'> {
  unidades: UnidadVista[];
  totalLecciones: number;
  leccionesCompletadas: number;
  porcentaje: number;
  estado: EstadoCurso;
  estadoLabel: string;
  textoBusqueda: string;
  ilustracionUrl: string | null;
}

interface OpcionFiltro {
  value: FiltroCurso;
  label: string;
  count: number;
  icon: IconDefinition;
}

interface ProblemaCarga {
  titulo: string;
  detalle: string;
  accion: 'retry' | 'home';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recursos',
  imports: [RouterLink, FontAwesomeModule, NzButtonModule, EstadoVacio, IllustrationSlot],
  templateUrl: './recursos.html',
  styleUrl: './recursos.scss',
})
export class Recursos {
  private readonly api = inject(Api);

  readonly faArrowRight = faArrowRight;
  readonly faBookOpen = faBookOpen;
  readonly faCheck = faCheck;
  readonly faCircleCheck = faCircleCheck;
  readonly faCircleInfo = faCircleInfo;
  readonly faCirclePlay = faCirclePlay;
  readonly faClock = faClock;
  readonly faFlag = faFlag;
  readonly faGrip = faGrip;
  readonly faLayerGroup = faLayerGroup;
  readonly faMagnifyingGlass = faMagnifyingGlass;
  readonly faPersonChalkboard = faPersonChalkboard;
  readonly faRotateRight = faRotateRight;
  readonly faRocket = faRocket;
  readonly faStar = faStar;
  readonly faTriangleExclamation = faTriangleExclamation;

  readonly datos = signal<AprendizajeResponse | null>(null);
  readonly cargando = signal(true);
  readonly refrescando = signal(false);
  readonly actualizando = signal<number | null>(null);
  readonly error = signal('');
  readonly errorAccion = signal('');
  readonly feedback = signal('');
  readonly tipoProblema = signal<TipoProblema>('generic');
  readonly contenidoDesactualizado = signal(false);
  readonly filtro = signal<FiltroCurso>('all');
  readonly busqueda = signal('');

  readonly cursosVista = computed<CursoVista[]>(() =>
    (this.datos()?.cursos ?? []).map((curso) => this.construirCursoVista(curso)),
  );

  readonly filtros = computed<OpcionFiltro[]>(() => {
    const cursos = this.cursosVista();
    return [
      { value: 'all', label: 'Todos', count: cursos.length, icon: this.faGrip },
      { value: 'notStarted', label: 'Por iniciar', count: cursos.filter((curso) => curso.estado === 'notStarted').length, icon: this.faFlag },
      { value: 'inProgress', label: 'En progreso', count: cursos.filter((curso) => curso.estado === 'inProgress').length, icon: this.faCirclePlay },
      { value: 'completed', label: 'Completados', count: cursos.filter((curso) => curso.estado === 'completed').length, icon: this.faCircleCheck },
    ];
  });

  readonly cursosFiltrados = computed(() => {
    const filtro = this.filtro();
    const termino = this.normalizar(this.busqueda());

    return this.cursosVista().filter((curso) => {
      const coincideEstado = filtro === 'all' || curso.estado === filtro;
      const coincideBusqueda = !termino || curso.textoBusqueda.includes(termino);
      return coincideEstado && coincideBusqueda;
    });
  });

  readonly hayFiltrosActivos = computed(() => this.filtro() !== 'all' || Boolean(this.busqueda().trim()));
  readonly cursosEnProgreso = computed(() => this.cursosVista().filter((curso) => curso.estado === 'inProgress').length);
  readonly cursosCompletados = computed(() => this.cursosVista().filter((curso) => curso.estado === 'completed').length);
  readonly cursosPorIniciar = computed(() => this.cursosVista().filter((curso) => curso.estado === 'notStarted').length);
  readonly problemaCarga = computed<ProblemaCarga>(() => {
    const conservaDatos = Boolean(this.datos());

    if (this.tipoProblema() === 'offline') {
      return {
        titulo: 'Sin conexión con DAEMON',
        detalle: conservaDatos
          ? 'Mostramos la última versión disponible. Cuando recuperes conexión, vuelve a actualizar.'
          : 'Comprueba tu conexión y vuelve a intentarlo para abrir tus cursos.',
        accion: 'retry',
      };
    }

    if (this.tipoProblema() === 'permission') {
      return {
        titulo: 'Acceso no disponible',
        detalle: 'Tu cuenta no tiene permiso para consultar esta ruta. Vuelve al inicio o comunícate con tu docente.',
        accion: 'home',
      };
    }

    if (this.tipoProblema() === 'timeout') {
      return {
        titulo: 'La conexión está tardando',
        detalle: conservaDatos
          ? 'Conservamos tus cursos visibles. Puedes continuar y actualizar nuevamente en unos momentos.'
          : 'DAEMON tardó más de lo esperado. Inténtalo nuevamente en unos momentos.',
        accion: 'retry',
      };
    }

    return {
      titulo: 'Ocurrió un problema',
      detalle: this.error() || 'La ruta de aprendizaje no está disponible por el momento.',
      accion: 'retry',
    };
  });

  constructor() {
    this.cargar();
  }

  cargar(fresh = false): void {
    const conservaDatos = Boolean(this.datos());
    this.cargando.set(!conservaDatos);
    this.refrescando.set(conservaDatos);
    this.error.set('');
    this.errorAccion.set('');
    this.feedback.set('');

    this.api.get<AprendizajeResponse>('/alumno/aprendizaje', { fresh })
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
          this.contenidoDesactualizado.set(false);
          this.tipoProblema.set('generic');
        },
        error: (problema: unknown) => {
          this.tipoProblema.set(this.clasificarProblema(problema));
          this.contenidoDesactualizado.set(Boolean(this.datos()));
          this.error.set('No pudimos cargar tus cursos. Revisa tu conexión e inténtalo nuevamente.');
        },
      });
  }

  seleccionarFiltro(filtro: FiltroCurso): void {
    this.filtro.set(filtro);
  }

  actualizarBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  limpiarFiltros(): void {
    this.filtro.set('all');
    this.busqueda.set('');
  }

  completar(leccion: LeccionVista): void {
    if (leccion.progresoActual.estado === 'completed' || this.actualizando() !== null) {
      return;
    }

    this.actualizando.set(leccion.id);
    this.errorAccion.set('');
    this.feedback.set('');
    this.api.put<ProgresoLeccion>(`/alumno/aprendizaje/lecciones/${leccion.id}/progreso`, {
      estado: 'completed',
      porcentaje: 100,
    }).pipe(finalize(() => this.actualizando.set(null))).subscribe({
      next: (progreso) => {
        const datos = this.datos();
        if (!datos) return;

        const cursos = datos.cursos.map((curso) => ({
          ...curso,
          unidades: curso.unidades.map((unidad) => ({
            ...unidad,
            lecciones: unidad.lecciones.map((item) =>
              item.id === leccion.id ? { ...item, progresos: [progreso] } : item,
            ),
          })),
        }));
        const lecciones = cursos.flatMap((curso) => curso.unidades).flatMap((unidad) => unidad.lecciones);
        const completadas = lecciones.filter((item) => this.progresoActual(item).estado === 'completed').length;

        this.datos.set({
          cursos,
          resumen: {
            ...datos.resumen,
            completadas,
            porcentaje: lecciones.length ? Math.round(completadas * 100 / lecciones.length) : 0,
          },
        });
        this.api.post('/telemetria/eventos', {
          nombre: 'lesson_completed',
          propiedades: { lesson_id: leccion.id, module: 'cursos' },
        }).subscribe({ error: () => undefined });
        this.feedback.set(`La lección ${leccion.titulo} quedó completada y tu progreso ya está actualizado.`);
      },
      error: () => this.errorAccion.set('No se pudo guardar el avance. Tu contenido permanece disponible y puedes volver a intentarlo desde la lección.'),
    });
  }

  cerrarErrorAccion(): void {
    this.errorAccion.set('');
  }

  private construirCursoVista(curso: Curso): CursoVista {
    const unidades = curso.unidades.map<UnidadVista>((unidad, index) => ({
      ...unidad,
      orden: index + 1,
      lecciones: unidad.lecciones.map((leccion) => ({
        ...leccion,
        progresoActual: this.progresoActual(leccion),
      })),
    }));
    const lecciones = unidades.flatMap((unidad) => unidad.lecciones);
    const leccionesCompletadas = lecciones.filter((leccion) => leccion.progresoActual.estado === 'completed').length;
    const tieneProgreso = lecciones.some((leccion) => leccion.progresoActual.estado === 'inProgress') || leccionesCompletadas > 0;
    const estado: EstadoCurso = lecciones.length > 0 && leccionesCompletadas === lecciones.length
      ? 'completed'
      : tieneProgreso
        ? 'inProgress'
        : 'notStarted';
    const porcentaje = lecciones.length ? Math.round(leccionesCompletadas * 100 / lecciones.length) : 0;
    const textoBusqueda = this.normalizar([
      curso.titulo,
      curso.descripcion,
      curso.nivel,
      ...unidades.flatMap((unidad) => [
        unidad.titulo,
        unidad.descripcion,
        ...unidad.lecciones.map((leccion) => leccion.titulo),
      ]),
    ].filter(Boolean).join(' '));

    return {
      ...curso,
      unidades,
      totalLecciones: lecciones.length,
      leccionesCompletadas,
      porcentaje,
      estado,
      estadoLabel: estado === 'completed' ? 'Completado' : estado === 'inProgress' ? 'En progreso' : 'Por iniciar',
      textoBusqueda,
      ilustracionUrl: curso.ilustracion_url ?? null,
    };
  }

  private progresoActual(leccion: Leccion): ProgresoLeccion {
    return leccion.progresos[0] ?? { estado: 'notStarted', porcentaje: 0 };
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase('es');
  }

  private clasificarProblema(problema: unknown): TipoProblema {
    if (problema instanceof ApiError) {
      return problema.kind === 'offline' ? 'offline' : 'timeout';
    }

    if (problema instanceof HttpErrorResponse && [401, 403].includes(problema.status)) {
      return 'permission';
    }

    return 'generic';
  }
}
