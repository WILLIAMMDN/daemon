import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faBookOpen,
  faCalendarDays,
  faCircleUser,
  faMagnifyingGlass,
  faPenNib,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ApiError } from '../../../../core/servicios/api';
import { Sesion } from '../../../../core/servicios/sesion';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { IllustrationSlot } from '../../../../shared/componentes/illustration-slot/illustration-slot';
import { CuentoRegistro, CuentoVista } from '../../models/cuento.models';
import { Cuento } from '../../services/cuento';

type FiltroCuento = 'todos' | 'mio' | 'portada';
type OrdenCuento = 'recientes' | 'antiguos' | 'titulo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-galeria-proyectos',
  imports: [RouterLink, FontAwesomeModule, NzButtonModule, EstadoVacio, IllustrationSlot],
  templateUrl: './galeria-proyectos.html',
  styleUrl: './galeria-proyectos.scss',
})
export class GaleriaProyectos {
  private readonly cuento = inject(Cuento);
  private readonly sesion = inject(Sesion);
  private readonly fecha = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  readonly faArrowLeft = faArrowLeft;
  readonly faArrowRight = faArrowRight;
  readonly faBookOpen = faBookOpen;
  readonly faCalendarDays = faCalendarDays;
  readonly faCircleUser = faCircleUser;
  readonly faMagnifyingGlass = faMagnifyingGlass;
  readonly faPenNib = faPenNib;
  readonly faRotateRight = faRotateRight;
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
      const coincideFiltro = filtro === 'todos'
        || (filtro === 'mio' && cuento.esMio)
        || (filtro === 'portada' && Boolean(cuento.portadaUrl));
      return coincideFiltro && (!busqueda || cuento.textoBusqueda.includes(busqueda));
    });

    return [...resultado].sort((a, b) => {
      if (orden === 'antiguos') return a.timestamp - b.timestamp;
      if (orden === 'titulo') return a.tituloVista.localeCompare(b.tituloVista, 'es', { sensitivity: 'base' });
      return b.timestamp - a.timestamp;
    });
  });
  readonly hayFiltros = computed(() => this.filtro() !== 'todos' || Boolean(this.busqueda().trim()));

  constructor() {
    this.cargar();
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

    return {
      ...cuento,
      tituloVista,
      autorVista,
      inicialAutor: autorVista.charAt(0).toLocaleUpperCase('es'),
      portadaUrl,
      fechaVista: timestamp ? this.fecha.format(fecha!) : 'Fecha no disponible',
      timestamp,
      esMio: cuento.id_alumno === this.sesion.usuario()?.id,
      escenasConContenido: this.contarEscenas(cuento),
      textoBusqueda: this.normalizar(`${tituloVista} ${autorVista}`),
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
