import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faBookOpen,
  faCalendarDays,
  faChartLine,
  faCircleUser,
  faMagnifyingGlass,
  faEllipsis,
  faStar,
  faQuoteLeft,
  faTimes,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ApiError } from '../../../../core/servicios/api';
import { Sesion } from '../../../../core/servicios/sesion';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { IllustrationSlot } from '../../../../shared/componentes/illustration-slot/illustration-slot';
import { CuentoRegistro, CuentoVista } from '../../models/cuento.models';
import { Cuento } from '../../services/cuento';
import { HeaderBannerComponent } from '../../../../shared/componentes/header-banner/header-banner';
import { NgClass } from '@angular/common';

type FiltroCuento = 'todos' | 'mio';
type OrdenCuento = 'recientes' | 'antiguos' | 'titulo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-galeria-proyectos',
  imports: [RouterLink, FontAwesomeModule, NzButtonModule, EstadoVacio, NgClass, HeaderBannerComponent],
  templateUrl: './galeria-proyectos.html',
  styleUrl: './galeria-proyectos.scss',
})
export class GaleriaProyectos {
  private readonly cuento = inject(Cuento);
  private readonly sesion = inject(Sesion);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fecha = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  readonly faArrowLeft = faArrowLeft;
  readonly faBookOpen = faBookOpen;
  readonly faCalendarDays = faCalendarDays;
  readonly faChartLine = faChartLine;
  readonly faCircleUser = faCircleUser;
  readonly faMagnifyingGlass = faMagnifyingGlass;
  readonly faEllipsis = faEllipsis;
  readonly faStar = faStar;
  readonly faQuoteLeft = faQuoteLeft;
  readonly faTimes = faTimes;
  readonly faPlus = faPlus;
  readonly cuentos = signal<CuentoRegistro[]>([]);
  readonly miCuento = signal<CuentoRegistro | null>(null);
  readonly miCuentoCargado = signal(false);
  readonly cargando = signal(true);
  readonly refrescando = signal(false);
  readonly error = signal('');
  readonly datosConservados = signal(false);
  readonly filtro = signal<FiltroCuento>('todos');
  readonly orden = signal<OrdenCuento>('recientes');
  readonly busqueda = signal('');
  readonly portadasInvalidas = signal<ReadonlySet<number>>(new Set());
  /** Mobile bottom-sheet state. Desktop ignores it entirely. */
  readonly asideAbierto = signal(false);

  readonly plantillasRecomendadas = signal([
    { id: '1', titulo: 'Aventura en el espacio', imagen: '/img/cuentos/template-1.png' },
    { id: '2', titulo: 'Amigos del bosque', imagen: '/img/cuentos/template-2.png' },
    { id: '3', titulo: 'Viaje en el tiempo', imagen: '/img/cuentos/template-3.png' }
  ]);

  readonly inspiracionDiaria = signal({
    frase: "La imaginación es el comienzo de la creación.",
    autor: "George Bernard Shaw"
  });

  readonly cuentosVista = computed<CuentoVista[]>(() =>
    this.cuentos().map((cuento) => this.construirVista(cuento)),
  );
  readonly miCuentoVista = computed<CuentoVista | null>(() => {
    const propio = this.miCuento()
      ?? this.cuentos().find((cuento) => cuento.id_alumno === this.sesion.usuario()?.id)
      ?? null;
    return propio ? this.construirVista(propio) : null;
  });
  readonly cuentosConPortada = computed(() => this.cuentosVista().filter((cuento) => Boolean(cuento.portadaUrl)).length);
  readonly cuentosFiltrados = computed(() => {
    const filtro = this.filtro();
    const busqueda = this.normalizar(this.busqueda());
    const orden = this.orden();
    const resultado = this.cuentosVista().filter((cuento) => {
      const coincideFiltro = filtro === 'mio' ? cuento.esMio : true;
      return coincideFiltro && (!busqueda || cuento.textoBusqueda.includes(busqueda));
    });

    return [...resultado].sort((a, b) => {
      if (orden === 'antiguos') return a.timestamp - b.timestamp;
      if (orden === 'titulo') return a.tituloVista.localeCompare(b.tituloVista, 'es', { sensitivity: 'base' });
      return b.timestamp - a.timestamp;
    });
  });
  readonly hayFiltros = computed(() => this.filtro() !== 'todos' || Boolean(this.busqueda().trim()));

  readonly progresoCreativo = computed(() => {
    const miCuento = this.miCuentoVista();
    if (!miCuento) return 0;
    return Math.round((miCuento.escenasConContenido / 6) * 100);
  });

  readonly reaccionesRecibidas = computed(() => {
    return this.cuentosVista().filter(c => c.esMio).reduce((sum, c) => sum + (c.reacciones_count || 0), 0);
  });

  constructor() {
    this.cargar();

    // Lock body scroll while the mobile bottom sheet is open so the page
    // behind doesn't scroll when the user drags the sheet. We DO NOT rely on
    // component teardown to remove the class — if the user navigates while
    // the sheet is open (e.g. tapping a recommended template), the component
    // is destroyed and any effect that only reads asideAbierto() can leave
    // the body class behind, freezing the next page. We belt-and-suspenders
    // this: the effect toggles the class, and DestroyRef guarantees it is
    // cleared even if the effect is torn down mid-flight.
    effect(() => {
      if (typeof document === 'undefined') return;
      if (this.asideAbierto()) {
        document.body.classList.add('story-aside-scroll-lock');
      } else {
        document.body.classList.remove('story-aside-scroll-lock');
      }
    });

    this.destroyRef.onDestroy(() => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('story-aside-scroll-lock');
      }
    });
  }

  /** Close the mobile aside when the user presses Escape. */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.asideAbierto()) {
      this.cerrarAside();
    }
  }

  abrirAside(): void {
    this.asideAbierto.set(true);
  }

  cerrarAside(): void {
    this.asideAbierto.set(false);
  }

  toggleAside(): void {
    this.asideAbierto.update((abierto) => !abierto);
  }

  /**
   * Runs BEFORE the [routerLink] on the template <a> navigates. We close the
   * mobile bottom sheet first so the body scroll-lock is released in the same
   * tick as the navigation — otherwise iOS / Android can briefly show the
   * next page with `body { overflow: hidden }` and look frozen.
   *
   * We respect modifier keys (cmd/ctrl/shift/middle-click) so users can still
   * "open in new tab" without the sheet collapsing under their cursor.
   */
  onTemplateClick(event: MouseEvent): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    this.cerrarAside();
  }

  cargar(fresh = false): void {
    const conservaDatos = this.cuentos().length > 0;
    this.cargando.set(!conservaDatos);
    this.refrescando.set(conservaDatos);
    this.error.set('');
    this.datosConservados.set(false);

    this.cuento.listar(fresh)
      .pipe(finalize(() => {
        this.cargando.set(false);
        this.refrescando.set(false);
      }))
      .subscribe({
        next: (cuentos) => {
          const eraCargaInicial = this.cargando();
          this.cuentos.set(cuentos);
          this.cargando.set(false);
          this.refrescando.set(eraCargaInicial);
          this.datosConservados.set(false);
        },
        error: (error: unknown) => {
          this.datosConservados.set(this.cuentos().length > 0);
          this.error.set(error instanceof ApiError && error.kind === 'offline'
            ? 'No pudimos conectar con DAEMON. Revisa tu conexión e inténtalo nuevamente.'
            : 'No pudimos cargar la galería de historias. Inténtalo nuevamente.');
        },
      });

    this.miCuentoCargado.set(false);
    this.cuento.mio(fresh).subscribe({
      next: (cuento) => {
        this.miCuento.set(cuento);
        this.miCuentoCargado.set(true);
      },
      error: () => this.miCuentoCargado.set(true),
    });
  }

  seleccionarFiltro(filtro: FiltroCuento): void {
    this.filtro.set(filtro);
  }

  actualizarBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  actualizarOrden(event: Event): void {
    this.orden.set((event.target as HTMLSelectElement).value as OrdenCuento);
  }

  limpiarFiltros(): void {
    this.filtro.set('todos');
    this.busqueda.set('');
  }

  registrarPortadaFallida(id: number): void {
    this.portadasInvalidas.update((actuales) => new Set([...actuales, id]));
  }

  portadaDisponible(cuento: CuentoVista): boolean {
    return Boolean(cuento.portadaUrl) && !this.portadasInvalidas().has(cuento.id);
  }

  private construirVista(cuento: CuentoRegistro): CuentoVista {
    const tituloVista = cuento.titulo?.trim() || 'Historia sin título';
    const autorVista = cuento.autor?.trim() || 'Autor registrado';
    const fecha = cuento.fecha_creacion ? new Date(cuento.fecha_creacion) : null;
    const timestamp = fecha && Number.isFinite(fecha.getTime()) ? fecha.getTime() : 0;
    const portadaUrl = this.portada(cuento);
    const inicial = autorVista.charAt(0).toLocaleUpperCase('es');
    
    // Generar tags reales basados en el campo categoría
    const categoriaReal = cuento.categoria || 'Sin clasificar';
    
    // Hash simple para asignar un color de tag basado en el nombre de la categoría
    let hash = 0;
    for (let i = 0; i < categoriaReal.length; i++) {
      hash = categoriaReal.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const idNum = cuento.id || 0;
    const clases = ['bg-emerald-100 text-emerald-800', 'bg-blue-100 text-blue-800', 'bg-purple-100 text-purple-800', 'bg-pink-100 text-pink-800', 'bg-indigo-100 text-indigo-800', 'bg-orange-100 text-orange-800'];
    const indexTag = Math.abs(hash) % clases.length;
    
    // Colores para el avatar
    const coloresAvatar = ['#1d4f91', '#0d9488', '#e11d48', '#9333ea', '#ca8a04', '#2563eb'];
    const colorAutor = coloresAvatar[idNum % coloresAvatar.length];

    return {
      ...cuento,
      tituloVista,
      autorVista,
      inicialAutor: inicial,
      colorAutor,
      portadaUrl,
      fechaVista: timestamp ? this.fecha.format(fecha!) : 'Fecha no disponible',
      timestamp,
      esMio: cuento.id_alumno === this.sesion.usuario()?.id,
      escenasConContenido: this.contarEscenas(cuento),
      textoBusqueda: this.normalizar(`${tituloVista} ${autorVista}`),
      tagNombre: categoriaReal,
      tagClase: clases[indexTag],
    };
  }

  private portada(cuento: CuentoRegistro): string | null {
    const ruta = [cuento.img_1, cuento.img_2, cuento.img_3, cuento.img_4, cuento.img_5, cuento.img_6]
      .find((imagen) => Boolean(imagen?.trim()))?.trim();
    if (!ruta) return null;
    return /^https?:\/\//i.test(ruta) || ruta.startsWith('/') ? ruta : `/${ruta}`;
  }

  private contarEscenas(cuento: CuentoRegistro): number {
    return [cuento.data_1, cuento.data_2, cuento.data_3, cuento.data_4, cuento.data_5, cuento.data_6]
      .filter((escena) => this.tieneContenido(escena)).length;
  }

  private tieneContenido(valor: unknown): boolean {
    if (valor === null || valor === undefined) return false;
    if (typeof valor === 'object') return Object.keys(valor as object).length > 0;
    const texto = String(valor).trim();
    if (!texto) return false;

    try {
      const escena = JSON.parse(texto) as { bubbles?: unknown[]; chars?: unknown[] };
      if (Array.isArray(escena.bubbles) || Array.isArray(escena.chars)) {
        return Boolean(escena.bubbles?.length || escena.chars?.length);
      }
    } catch {
      return true;
    }

    return true;
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase('es');
  }
}
