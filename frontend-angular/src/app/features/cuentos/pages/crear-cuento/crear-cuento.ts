import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faAlignCenter,
  faAlignJustify,
  faAlignLeft,
  faAlignRight,
  faArrowLeft,
  faArrowRight,
  faBold,
  faCheck,
  faCheckCircle,
  faChevronRight,
  faCircle,
  faCirclePlay,
  faClose,
  faCloudArrowUp,
  faCopy,
  faEraser,
  faEye,
  faFileLines,
  faGear,
  faHighlighter,
  faImage,
  faItalic,
  faLightbulb,
  faLink,
  faListCheck,
  faListOl,
  faListUl,
  faPalette,
  faQuoteLeft,
  faRedo,
  faSave,
  faShareNodes,
  faSpinner,
  faStar,
  faTimes,
  faTrash,
  faUnderline,
  faUndo,
  faUpload,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { QuillModule } from 'ngx-quill';
import Quill from 'quill';
import { PALETA_QUILL_CUENTOS } from '../../../../core/dominio/tema-portal-alumno';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EditorCuentoFacade } from '../../aplicacion/editor-cuento.facade';
import { PROVEEDORES_CUENTOS } from '../../acceso-datos/proveedores-cuentos';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-crear-cuento',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    Cargando,
    NzAlertModule,
    QuillModule,
    FontAwesomeModule,
    NzButtonModule,
    NzTooltipModule,
  ],
  providers: [...PROVEEDORES_CUENTOS, EditorCuentoFacade],
  templateUrl: './crear-cuento.html',
  styleUrl: './crear-cuento.scss',
})
export class CrearCuento implements OnInit {
  readonly editor = inject(EditorCuentoFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(NzMessageService);

  readonly cargando = this.editor.cargando;
  readonly error = this.editor.error;
  readonly guardando = this.editor.guardando;
  readonly guardadoOk = this.editor.guardadoOk;
  readonly errorGuardado = this.editor.errorGuardado;
  readonly ultimaEdicion = this.editor.ultimaEdicion;
  readonly cuentoId = this.editor.cuentoId;
  readonly titulo = this.editor.titulo;
  readonly descripcion = this.editor.descripcion;
  readonly categoria = this.editor.categoria;
  readonly rangoEdad = this.editor.rangoEdad;
  readonly portada = this.editor.portada;
  readonly paginas = this.editor.paginas;
  readonly paginaActivaIndex = this.editor.paginaActivaIndex;
  readonly paginaActiva = this.editor.paginaActiva;
  readonly contenido = this.editor.contenido;
  readonly ilustracionActiva = this.editor.ilustracionActiva;
  readonly ideaActiva = this.editor.ideaActiva;
  readonly tituloIA = this.editor.tituloIA;
  readonly cargandoIdea = this.editor.cargandoIdea;
  readonly cargandoContinuacion = this.editor.cargandoContinuacion;
  readonly cargandoTitulo = this.editor.cargandoTitulo;
  readonly subiendoPortada = this.editor.subiendoPortada;
  readonly subiendoIlustracion = this.editor.subiendoIlustracion;
  readonly portadaDisplayUrl = this.editor.portadaDisplayUrl;
  readonly ilustracionDisplayUrl = this.editor.ilustracionDisplayUrl;
  readonly tiempoLectura = this.editor.tiempoLectura;
  readonly progresoPorcentaje = this.editor.progresoPorcentaje;
  readonly listoParaPublicar = this.editor.listoParaPublicar;

  readonly mostrarSidebarMovil = signal(false);
  readonly asistenteExpandido = signal(true);
  readonly detallesExpandido = signal(true);
  readonly publicacionExpandido = signal(true);
  readonly progresoExpandido = signal(true);

  /** Arrastrar y soltar imágenes (drag & drop nativo) */
  readonly arrastrandoPortada = signal(false);
  readonly arrastrandoIlustracion = signal(false);

  readonly faCheckCircle = faCheckCircle;
  readonly faCircle = faCircle;
  readonly faCloudArrowUp = faCloudArrowUp;
  readonly faEye = faEye;
  readonly faImage = faImage;
  readonly faSave = faSave;
  readonly faTimes = faTimes;
  readonly faClose = faClose;
  readonly faUpload = faUpload;
  readonly faFileLines = faFileLines;
  readonly faCopy = faCopy;
  readonly faGear = faGear;
  readonly faCheck = faCheck;
  readonly faStar = faStar;
  readonly faListCheck = faListCheck;
  readonly faCirclePlay = faCirclePlay;
  readonly faSpinner = faSpinner;
  readonly faShareNodes = faShareNodes;
  readonly faTrash = faTrash;
  readonly faArrowLeft = faArrowLeft;
  readonly faArrowRight = faArrowRight;
  readonly faChevronRight = faChevronRight;
  readonly faLightbulb = faLightbulb;
  readonly faWandMagicSparkles = faWandMagicSparkles;
  readonly faUndo = faUndo;
  readonly faRedo = faRedo;
  readonly faBold = faBold;
  readonly faItalic = faItalic;
  readonly faUnderline = faUnderline;
  readonly faListUl = faListUl;
  readonly faListOl = faListOl;
  readonly faQuoteLeft = faQuoteLeft;
  readonly faLink = faLink;
  readonly faEraser = faEraser;
  readonly faPalette = faPalette;
  readonly faHighlighter = faHighlighter;
  readonly faAlignLeft = faAlignLeft;
  readonly faAlignCenter = faAlignCenter;
  readonly faAlignRight = faAlignRight;
  readonly faAlignJustify = faAlignJustify;

  // La toolbar vive FUERA del editor, a ancho completo arriba del
  // libro (patrón de la referencia). Quill 2 la toma por selector.
  readonly quillModules = {
    history: { delay: 1000, maxStack: 100, userOnly: true },
    toolbar: {
      container: '#cuento-toolbar',
      handlers: {
        undo(this: { quill: Quill }) { this.quill.history.undo(); },
        redo(this: { quill: Quill }) { this.quill.history.redo(); },
      },
    },
  };

  // ── Drag & drop nativo para imágenes ────────────────────────────

  onDragOverPortada(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrandoPortada.set(true);
  }

  onDragLeavePortada(): void {
    this.arrastrandoPortada.set(false);
  }

  onDropPortada(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrandoPortada.set(false);
    const archivo = evento.dataTransfer?.files?.[0];
    if (!archivo || this.subiendoPortada()) return;
    void this.editor.onSubirPortada({ target: { files: [archivo], value: '' } } as unknown as Event);
  }

  onDragOverIlustracion(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrandoIlustracion.set(true);
  }

  onDragLeaveIlustracion(): void {
    this.arrastrandoIlustracion.set(false);
  }

  onDropIlustracion(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrandoIlustracion.set(false);
    const archivo = evento.dataTransfer?.files?.[0];
    if (!archivo || this.subiendoIlustracion()) return;
    void this.editor.onSubirIlustracion({ target: { files: [archivo], value: '' } } as unknown as Event);
  }

  ngOnInit(): void {
    void this.editor.inicializar(
      this.route.snapshot.queryParamMap.get('id'),
      this.route.snapshot.queryParamMap.get('plantilla'),
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  advertirCambios(evento: BeforeUnloadEvent): void {
    if (!this.editor.tieneCambiosSinGuardar()) return;
    evento.preventDefault();
    evento.returnValue = '';
  }

  async guardar(estado: 'borrador' | 'publicado'): Promise<void> {
    if (estado === 'publicado') {
      if (await this.editor.solicitarPublicacion()) {
        this.toast.success('Tu cuento fue enviado a revisión.');
        await this.router.navigate(['/alumno/proyectos/cuentos']);
      }
      return;
    }
    await this.editor.guardar(true);
  }

  async vistaPrevia(): Promise<void> {
    if (await this.editor.guardar(true)) {
      await this.router.navigate(['/alumno/proyectos/cuentos', this.cuentoId()]);
    }
  }

  async compartir(): Promise<void> {
    const id = this.cuentoId();
    if (!id || this.editor.tieneCambiosSinGuardar()) {
      this.toast.warning('Guarda el borrador antes de compartir el enlace.');
      return;
    }
    const url = `${globalThis.location.origin}/alumno/proyectos/cuentos/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: this.titulo() || 'Mi historia', url });
      } else {
        await navigator.clipboard.writeText(url);
        this.toast.success('Enlace copiado.');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        this.toast.error('No pudimos compartir el enlace.');
      }
    }
  }

  async eliminarCuento(): Promise<void> {
    if (!globalThis.confirm('¿Eliminar este cuento? La solicitud se puede reintentar sin duplicarse.')) return;
    if (await this.editor.eliminar()) {
      this.toast.success('Cuento eliminado.');
      await this.router.navigate(['/alumno/crear/historias']);
    }
  }

  onEditorCreated(quill: Quill): void {
    quill.root.addEventListener('click', (evento: MouseEvent) => {
      const objetivo = evento.target;
      if (!(objetivo instanceof HTMLElement) || objetivo.tagName !== 'BLOCKQUOTE') return;
      const rect = objetivo.getBoundingClientRect();
      if (evento.clientX < rect.right - 25 || evento.clientY > rect.top + 20) return;
      const blot = Quill.find(objetivo);
      if (!blot || blot instanceof Quill) return;
      const indice = quill.getIndex(blot);
      quill.formatText(indice, blot.length(), 'blockquote', false);
    });

    // Quill no rellena los selectores de color cuando la toolbar es un
    // contenedor externo (#cuento-toolbar). Los poblamos con la paleta
    // oficial de DAEMON para que el autor elija colores de la marca.
    this.rellenarPaletaQuill();
  }

  /** Puebla los selectores de color/fondo de la toolbar con la paleta DAEMON. */
  private rellenarPaletaQuill(): void {
    const contenedor = document.getElementById('cuento-toolbar');
    if (!(contenedor instanceof HTMLElement)) return;
    contenedor
      .querySelectorAll<HTMLSelectElement>('select.ql-color, select.ql-background')
      .forEach((select) => {
        if (select.options.length > 0) return; // no duplicar si se re-crea
        PALETA_QUILL_CUENTOS.forEach((color) => {
          const opcion = document.createElement('option');
          if (color) {
            opcion.value = color;
            opcion.style.backgroundColor = color;
            opcion.style.color = color;
          } else {
            opcion.setAttribute('selected', 'selected');
          }
          select.appendChild(opcion);
        });
      });
  }

  readonly onTituloChange = (valor: string) => this.editor.onTituloChange(valor);
  readonly onDescripcionChange = (valor: string) => this.editor.onDescripcionChange(valor);
  readonly onContentChange = (valor: string) => this.editor.onContentChange(valor);
  readonly onCategoriaChange = (valor: string) => this.editor.onCategoriaChange(valor);
  readonly onRangoEdadChange = (valor: string) => this.editor.onRangoEdadChange(valor);
  readonly seleccionarPagina = (indice: number) => this.editor.seleccionarPagina(indice);
  readonly agregarPagina = () => this.editor.agregarPagina();
  readonly eliminarPagina = (indice: number) => this.editor.eliminarPagina(indice);
  readonly onSubirPortada = (evento: Event) => this.editor.onSubirPortada(evento);
  readonly onDragOverPortadaB = (evento: DragEvent) => this.onDragOverPortada(evento);
  readonly onDragLeavePortadaB = () => this.onDragLeavePortada();
  readonly onDropPortadaB = (evento: DragEvent) => this.onDropPortada(evento);
  readonly onDragOverIlustracionB = (evento: DragEvent) => this.onDragOverIlustracion(evento);
  readonly onDragLeaveIlustracionB = () => this.onDragLeaveIlustracion();
  readonly onDropIlustracionB = (evento: DragEvent) => this.onDropIlustracion(evento);
  readonly eliminarPortada = () => this.editor.eliminarPortada();
  readonly onSubirIlustracion = (evento: Event) => this.editor.onSubirIlustracion(evento);
  readonly quitarIlustracion = () => this.editor.quitarIlustracion();
  readonly generarIdeas = () => this.editor.generarIdeas();
  readonly continuarHistoria = () => this.editor.continuarHistoria();
  readonly sugerirTitulo = () => this.editor.sugerirTitulo();
  readonly aplicarIdeaIA = () => this.editor.aplicarIdeaIA();
  readonly aplicarTitulo = (valor: string) => this.editor.aplicarTitulo(valor);
  readonly cerrarIdea = () => this.editor.cerrarIdea();
  readonly cerrarTituloIA = () => this.editor.cerrarTituloIA();
  readonly limpiarErrorGuardado = () => this.editor.limpiarErrorGuardado();
  readonly resolverActivo = (referencia: string | null) => this.editor.resolverActivo(referencia);
}
