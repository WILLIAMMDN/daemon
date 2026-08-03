import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faBookOpen,
  faCalendarDays,
  faChartLine,
  faCircleUser,
  faEllipsis,
  faMagnifyingGlass,
  faPen,
  faPlus,
  faQuoteLeft,
  faStar,
  faTimes,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Sesion } from '../../../../core/servicios/sesion';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { HeaderBannerComponent } from '../../../../shared/componentes/header-banner/header-banner';
import { GaleriaCuentosFacade } from '../../aplicacion/galeria-cuentos.facade';
import { PROVEEDORES_CUENTOS } from '../../acceso-datos/proveedores-cuentos';
import { Cuento } from '../../dominio/cuento.modelo';
import { CuentoVista } from '../../presentacion/cuento-vista.modelo';
import { GaleriaAsideComponent } from './components/galeria-aside/galeria-aside.component';
import { GaleriaCuentoCardComponent } from './components/galeria-cuento-card/galeria-cuento-card.component';
import { GaleriaToolbarComponent } from './components/galeria-toolbar/galeria-toolbar.component';

type FiltroCuento = 'todos' | 'mio';
type OrdenCuento = 'recientes' | 'antiguos' | 'titulo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-galeria-proyectos',
  imports: [
    RouterLink,
    FontAwesomeModule,
    NzButtonModule,
    EstadoVacio,
    HeaderBannerComponent,
    GaleriaToolbarComponent,
    GaleriaCuentoCardComponent,
    GaleriaAsideComponent,
  ],
  providers: [...PROVEEDORES_CUENTOS, GaleriaCuentosFacade],
  templateUrl: './galeria-proyectos.html',
  styleUrl: './galeria-proyectos.scss',
})
export class GaleriaProyectos {
  readonly galeria = inject(GaleriaCuentosFacade);
  private readonly sesion = inject(Sesion);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(NzMessageService);
  private readonly fecha = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  readonly cuentos = this.galeria.cuentos;
  readonly cargando = this.galeria.cargando;
  readonly refrescando = this.galeria.refrescando;
  readonly error = this.galeria.error;
  readonly datosConservados = this.galeria.datosConservados;
  readonly hayMas = this.galeria.hayMas;
  readonly filtro = signal<FiltroCuento>('todos');
  readonly orden = signal<OrdenCuento>('recientes');
  readonly busqueda = signal('');
  readonly portadasInvalidas = signal<ReadonlySet<string>>(new Set());
  readonly asideAbierto = signal(false);

  readonly plantillasRecomendadas = [
    { id: '1', titulo: 'Aventura en el espacio', imagen: '/img/cuentos/template-1.png' },
    { id: '2', titulo: 'Amigos del bosque', imagen: '/img/cuentos/template-2.png' },
    { id: '3', titulo: 'Viaje en el tiempo', imagen: '/img/cuentos/template-3.png' },
  ];
  readonly inspiracionDiaria = {
    frase: 'La imaginación es el comienzo de la creación.',
    autor: 'George Bernard Shaw',
  };

  readonly cuentosVista = computed(() => this.cuentos().map((cuento) => this.construirVista(cuento)));
  readonly miCuentoVista = computed(() => {
    const propio = this.galeria.propios()[0];
    return propio ? this.construirVista(propio) : null;
  });
  readonly cuentosFiltrados = computed(() => {
    const consulta = this.normalizar(this.busqueda());
    const filtrados = this.cuentosVista().filter((cuento) =>
      (this.filtro() !== 'mio' || cuento.esMio)
      && (!consulta || cuento.textoBusqueda.includes(consulta)),
    );
    return [...filtrados].sort((a, b) => {
      if (this.orden() === 'antiguos') return a.timestamp - b.timestamp;
      if (this.orden() === 'titulo') return a.tituloVista.localeCompare(b.tituloVista, 'es');
      return b.timestamp - a.timestamp;
    });
  });
  readonly hayFiltros = computed(() => this.filtro() !== 'todos' || Boolean(this.busqueda().trim()));
  readonly progresoCreativo = computed(() => {
    const paginas = this.miCuentoVista()?.escenasConContenido ?? 0;
    return Math.min(100, Math.round((paginas / 6) * 100));
  });
  readonly reaccionesRecibidas = this.galeria.reaccionesPropiasTotal;

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
  readonly faPen = faPen;
  readonly faTrash = faTrash;

  constructor() {
    void this.galeria.cargar();
    effect(() => {
      if (typeof document === 'undefined') return;
      document.body.classList.toggle('story-aside-scroll-lock', this.asideAbierto());
    });
    this.destroyRef.onDestroy(() => document?.body.classList.remove('story-aside-scroll-lock'));
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.cerrarAside();
  }

  abrirAside(): void { this.asideAbierto.set(true); }
  cerrarAside(): void { this.asideAbierto.set(false); }
  toggleAside(): void { this.asideAbierto.update((valor) => !valor); }
  cargar(refrescar = false): void { void this.galeria.cargar(refrescar); }
  cargarMas(): void { void this.galeria.cargarMas(); }
  seleccionarFiltro(valor: FiltroCuento): void { this.filtro.set(valor); }
  actualizarBusqueda(valor: string): void { this.busqueda.set(valor); }
  actualizarOrden(valor: OrdenCuento): void { this.orden.set(valor); }
  limpiarFiltros(): void { this.filtro.set('todos'); this.busqueda.set(''); }
  registrarPortadaFallida(id: string): void {
    this.portadasInvalidas.update((actuales) => new Set([...actuales, id]));
  }
  portadaDisponible(cuento: CuentoVista): boolean {
    return Boolean(cuento.portadaUrl) && !this.portadasInvalidas().has(cuento.id);
  }
  onTemplateClick(evento: MouseEvent): void {
    if (evento.button === 0 && !evento.metaKey && !evento.ctrlKey && !evento.shiftKey && !evento.altKey) {
      this.cerrarAside();
    }
  }

  async eliminarCuento(id: string): Promise<void> {
    if (!confirm('¿Eliminar esta historia? La operación es idempotente y se procesa en el servidor.')) return;
    if (await this.galeria.eliminar(id)) this.toast.success('Historia eliminada.');
  }

  private construirVista(cuento: Cuento): CuentoVista {
    const esMio = this.galeria.propios().some((propio) => propio.id === cuento.id);
    const usuario = this.sesion.usuario();
    const autorVista = cuento.autor?.nombre
      || (esMio ? usuario?.nombre_completo || usuario?.usuario : null)
      || 'Autor DAEMON';
    const categoria = cuento.categoria || 'Sin clasificar';
    const timestamp = cuento.actualizadoEn.milisegundos;
    const clases = [
      'bg-emerald-100 text-emerald-800', 'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800', 'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800', 'bg-orange-100 text-orange-800',
    ];
    return {
      ...cuento,
      tituloVista: cuento.titulo.trim() || 'Historia sin título',
      autorVista,
      inicialAutor: autorVista.charAt(0).toLocaleUpperCase('es'),
      avatar: this.galeria.resolverActivo(cuento.autor?.avatarRef ?? (esMio ? usuario?.avatar ?? null : null)),
      portadaUrl: cuento.portadaRef ? this.galeria.resolverActivo(cuento.portadaRef) : null,
      fechaVista: timestamp ? this.fecha.format(new Date(timestamp)) : 'Fecha no disponible',
      timestamp,
      esMio,
      escenasConContenido: cuento.paginasBorrador,
      textoBusqueda: this.normalizar(`${cuento.titulo} ${autorVista}`),
      colorAutor: 'var(--daemon-primary)',
      tagNombre: categoria,
      tagClase: clases[Math.abs(this.hash(categoria)) % clases.length],
      reaccionesCount: cuento.estadisticas.reacciones,
    };
  }

  private hash(valor: string): number {
    return [...valor].reduce((hash, caracter) => caracter.charCodeAt(0) + ((hash << 5) - hash), 0);
  }

  private normalizar(valor: string): string {
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es');
  }
}
