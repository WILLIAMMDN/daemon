import { Component, signal, ChangeDetectionStrategy, inject, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Chatbot } from '../../../chatbot/services/chatbot';
import { Cuento } from '../../services/cuento';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';
import { QuillModule } from 'ngx-quill';
import Quill from 'quill';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheckCircle, faCircle, faCloudArrowUp, faEye, faImage, faSave,
  faTimes, faUpload, faFileLines, faCopy, faGear, faCheck, faStar, faListCheck,
  faCirclePlay, faSpinner, faShareNodes, faTrash, faClose, faArrowRight, faLightbulb
} from '@fortawesome/free-solid-svg-icons';
import { HeaderBannerComponent } from '../../../../shared/componentes/header-banner/header-banner';
import { AlmacenamientoArchivos } from '../../../../core/servicios/almacenamiento-archivos';
import { Activos } from '../../../../core/servicios/activos';
import { migrarContenidoLegacy } from '../../utils/cuento-legacy';

/**
 * Forma del payload que se envía al guardar un cuento.
 * Refleja los campos que Firestore persiste por documento.
 */
export interface CuentoPayload {
  id?: string | number;
  titulo?: string | null;
  descripcion?: string | null;
  contenido?: string | null;
  data_1?: string | null;
  paginas?: Array<Record<string, unknown>>;
  categoria?: string | null;
  rango_edad?: string | null;
  visibilidad?: 'privado' | 'publico';
  estado?: 'borrador' | 'publicado';
  portada?: string | null;
  img_1?: string | null;
  palabras?: number;
  tiempo_lectura?: number;
}

/**
 * Una página del cuento. La ilustración y la respuesta de la IA viven
 * POR PÁGINA — antes eran signals globales, lo que hacía que la imagen
 * "se repitiera" en cada pestaña nueva.
 */
export interface PaginaCuento {
  id: string;
  contenido: string;
  colorFondo?: string;
  plantilla?: string;
  /** Ilustración (base64) asociada a esta página específica. */
  ilustracion?: string | null;
  /** Última sugerencia que la IA dejó para esta página. */
  ideaIA?: { texto: string; conImagen: boolean; fecha: number; modo: 'ideas' | 'continuar' } | null;
}

// Tamaño de fuente para Quill
const Size = Quill.import('attributors/style/size') as any;
Size.whitelist = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '32px', '48px'];
Quill.register({ 'attributors/style/size': Size }, true);

const PLANTILLAS: Record<string, string> = {
  '1': `
    <h2 style="text-align: center;">Viaje a las Estrellas</h2>
    <p style="text-align: center;"><img src="/img/cuentos/template-1.png" width="400" /></p>
    <p>Era el año 3050 y nuestra nave acababa de aterrizar en el planeta rojo...</p>
    <p><em>(Continúa tu aventura aquí)</em></p>
  `,
  '2': `
    <h2 style="text-align: center;">El Misterio del Bosque Encantado</h2>
    <p style="text-align: center;"><img src="/img/cuentos/template-2.png" width="400" /></p>
    <p>Los árboles parecían susurrar mi nombre mientras me adentraba en la maleza...</p>
    <p><em>(Continúa tu historia aquí)</em></p>
  `,
  '3': `
    <h2 style="text-align: center;">El Reloj de Arena</h2>
    <p style="text-align: center;"><img src="/img/cuentos/template-3.png" width="400" /></p>
    <p>Solo quedaba un grano de arena. Si caía, el universo volvería a empezar...</p>
    <p><em>(Continúa tu historia aquí)</em></p>
  `
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-crear-cuento',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    Cargando,
    NzAlertModule,
    BotonAccion,
    QuillModule,
    FontAwesomeModule,
    HeaderBannerComponent,
    NzButtonModule,
    NzTooltipModule
  ],
  templateUrl: './crear-cuento.html',
  styleUrl: './crear-cuento.scss',
})
export class CrearCuento implements OnInit {
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
  readonly faArrowRight = faArrowRight;
  readonly faLightbulb = faLightbulb;

  // ─── Estado de carga ────────────────────────────────────────────
  cargando = signal(true);
  /** Cargando mientras se generan "ideas" desde la IA. */
  cargandoIdea = signal(false);
  /** Cargando mientras se genera "continuación" de la página actual. */
  cargandoContinuacion = signal(false);
  /** Cargando mientras se sugiere título. */
  cargandoTitulo = signal(false);
  /** True si cualquier acción de IA está corriendo (para UX). */
  readonly cargandoIA = computed(
    () => this.cargandoIdea() || this.cargandoContinuacion() || this.cargandoTitulo()
  );
  guardando = signal(false);
  mensaje = signal('');
  /**
   * Error de CARGA inicial (ngOnInit). Cuando está activo, la página
   * muestra sólo la tarjeta de error — no se puede editar.
   * Distinto de `errorGuardado` que es un error de guardado puntual.
   */
  error = signal('');
  /**
   * Error de GUARDADO. NO reemplaza la página — se muestra como toast
   * y como banner inline. El usuario sigue viendo su editor.
   */
  errorGuardado = signal<string | null>(null);
  /** Resultado del último guardado, para mostrar mensajes de éxito. */
  guardadoOk = signal<boolean>(false);
  ultimaEdicion = signal<string>('Borrador nuevo');

  // ─── Datos del cuento ───────────────────────────────────────────
  cuentoId = signal<string | null>(null);
  titulo = signal('');
  /** Sinopsis / brief que el estudiante escribe. Guía al bot. */
  descripcion = signal('');
  contenido = signal('');
  categoria = signal('Fantasía');
  rangoEdad = signal('9 - 12 años');
  visibilidad = signal<'privado' | 'publico'>('privado');
  portada = signal<string | null>(null);
  estado = signal<'borrador' | 'publicado'>('borrador');

  // ─── Páginas ────────────────────────────────────────────────────
  paginas = signal<PaginaCuento[]>([
    { id: 'portada-interna', contenido: '', colorFondo: '#ffffff', ilustracion: null, ideaIA: null }
  ]);
  paginaActivaIndex = signal<number>(0);

  /** Página actualmente seleccionada (derivada). */
  readonly paginaActiva = computed<PaginaCuento | null>(
    () => this.paginas()[this.paginaActivaIndex()] ?? null
  );
  /** Ilustración de la página activa. Reemplaza al antiguo signal global `imagenIA`. */
  readonly ilustracionActiva = computed<string | null>(
    () => this.paginaActiva()?.ilustracion ?? null
  );
  /** Sugerencia de IA de la página activa. */
  readonly ideaActiva = computed(() => this.paginaActiva()?.ideaIA ?? null);

  // (No usamos cropper: subir = guardar directamente.)

  /**
   * Previews locales (blob URLs) para que el usuario vea su imagen
   * inmediatamente mientras se sube a Supabase. Se limpian cuando la
   * subida termina y la URL remota ya está en el signal correspondiente.
   */
  readonly previewPortada = signal<string | null>(null);
  readonly previewIlustracion = signal<string | null>(null);

  mostrarSidebarMovil = signal<boolean>(false);

  /** Instancia de Quill, expuesta para listeners personalizados (blockquote X). */
  editorInstance: any = null;

  /** Tope de tamaño para archivos de imagen (5MB). */
  readonly MAX_IMAGEN_BYTES = 5 * 1024 * 1024;
  /** Tipos MIME aceptados. */
  readonly TIPOS_IMAGEN = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

  // ─── Estado de las tarjetas del sidebar (colapsables) ───────────
  asistenteExpandido = signal(true);
  detallesExpandido = signal(true);
  publicacionExpandido = signal(true);
  progresoExpandido = signal(true);

  /** URL pública de vista previa (sólo si el cuento ya tiene id). */
  readonly urlVistaPrevia = computed(() => {
    const id = this.cuentoId();
    return id ? `/alumno/proyectos/cuentos/${id}` : null;
  });

  // ─── Métricas / progreso ────────────────────────────────────────
  readonly palabras = computed(() => {
    const text = this.contenido().replace(/<[^>]*>?/gm, ' ');
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  });

  readonly tiempoLectura = computed(() => {
    const p = this.palabras();
    if (p === 0) return '0 min aprox.';
    return `${Math.ceil(p / 150)} min aprox.`;
  });

  readonly progresoPorcentaje = computed(() => {
    let puntos = 0;
    if (this.titulo().trim().length > 0) puntos += 25;
    if (this.portada()) puntos += 25;
    if (this.contenido().trim().length > 50) puntos += 50;
    return puntos;
  });

  readonly progresoTitulo = computed(() => this.titulo().trim().length > 0);
  readonly progresoPortada = computed(() => !!this.portada());
  readonly progresoContenido = computed(() => this.contenido().trim().length > 50);
  readonly listoParaPublicar = computed(
    () => this.progresoTitulo()
  );

  // ─── Inyecciones ────────────────────────────────────────────────
  private cuentos = inject(Cuento);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chatbot = inject(Chatbot);
  private readonly toast = inject(NzMessageService);
  private readonly almacenamiento = inject(AlmacenamientoArchivos);
  private readonly activos = inject(Activos);

  /**
   * URL "display" de la portada. Mientras se está subiendo, muestra el
   * preview local (blob URL). Cuando termina, muestra la URL pública
   * de Supabase resuelta por `Activos`. Si el valor es base64 (legacy),
   * lo pasa tal cual.
   */
  readonly portadaDisplayUrl = computed<string>(() => {
    const local = this.previewPortada();
    if (local) return local;
    return this.activos.url(this.portada());
  });

  /**
   * URL "display" de la ilustración de la página activa. Misma lógica
   * que la portada: preview local durante la subida, URL pública al final.
   */
  readonly ilustracionDisplayUrl = computed<string>(() => {
    const local = this.previewIlustracion();
    if (local) return local;
    return this.activos.url(this.ilustracionActiva());
  });

  /**
   * Indicador de que se está subiendo una imagen a Supabase.
   * `true` mientras dura la subida de portada o ilustración.
   * Bloquea el botón "Publicar" para no guardar un cuento con URLs a
   * media subir.
   */
  readonly subiendoImagen = computed(
    () => this.subiendoPortada() || this.subiendoIlustracion(),
  );

  /** Nuevo cuento o portada sin subir todavía. */
  readonly subiendoPortada = signal(false);
  readonly subiendoIlustracion = signal(false);

  /**
   * Genera (y memoriza) un ID permanente para el cuento ANTES de tener
   * un docId de Firestore. Esto permite que la portada y las
   * ilustraciones se suban a Supabase con un nombre estable desde la
   * primera subida. Si el usuario nunca guarda, el archivo queda
   * huérfano (limpieza pendiente en backend).
   */
  private asegurarCuentoId(): string {
    let id = this.cuentoId();
    if (!id) {
      id = this.generarIdCuento();
      this.cuentoId.set(id);
    }
    return id;
  }

  private generarIdCuento(): string {
    // crypto.randomUUID() está disponible en navegadores modernos.
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    // Fallback por si el navegador es viejísimo
    return 'cnt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  autoSaveSubject = new Subject<void>();

  /**
   * Trigger explícito de autoguardado. Lo expone el componente porque
   * los `<select>` del sidebar lo llaman directo desde el template
   * (no pasan por `onCategoriaChange` / `onRangoEdadChange`).
   */
  protected dispararAutoSave(): void {
    this.autoSaveSubject.next();
  }

  // Configuración de la toolbar de Quill
  readonly quillModules = {
    history: {
      delay: 1000,
      maxStack: 100,
      userOnly: true,
    },
    toolbar: {
      container: [
        ['undo', 'redo'],
        [{ font: [] }, { size: ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '32px', '48px'] }],
        [{ header: [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: {
        undo: function () {
          // @ts-ignore
          this.quill.history.undo();
        },
        redo: function () {
          // @ts-ignore
          this.quill.history.redo();
        },
      },
    },
  };

  // ════════════════════════════════════════════════════════════════
  //  LIFECYCLE
  // ════════════════════════════════════════════════════════════════

  ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('id');
    const plantillaId = this.route.snapshot.queryParamMap.get('plantilla');

    if (id) {
      this.cuentos.detalle(id).subscribe({
        next: (respuesta) => {
          const c = respuesta.cuento as any;
          this.cuentoId.set(c.id);
          this.titulo.set(c.titulo || '');
          this.descripcion.set(c.descripcion || '');
          this.categoria.set(c.categoria || 'Sin clasificar');
          this.rangoEdad.set(c.rango_edad || '9 - 12 años');
          this.visibilidad.set(c.visibilidad || 'privado');
          this.portada.set(c.portada || c.img_1 || null);
          this.estado.set(c.estado || 'borrador');
          this.ultimaEdicion.set('Guardado anteriormente');

          if (Array.isArray(c.paginas) && c.paginas.length > 0) {
            // Mapeo defensivo: aseguro que cada página tiene los nuevos
            // campos y limpio contenido legacy (JSON con bubbles/chars).
            this.paginas.set(
              c.paginas.map((p: any, idx: number) => ({
                id: p.id ?? `page-${idx}`,
                contenido: this.migrarContenidoLegacy(p.contenido),
                colorFondo: p.colorFondo ?? '#ffffff',
                plantilla: p.plantilla,
                ilustracion: p.ilustracion ?? null,
                ideaIA: p.ideaIA ?? null,
              }))
            );
          } else {
            // Migración automática desde el formato antiguo (data_1, img_1)
            this.paginas.set([
              {
                id: 'page-migrada',
                contenido: this.migrarContenidoLegacy(c.data_1 || c.contenido || ''),
                colorFondo: '#ffffff',
                ilustracion: c.img_1 || null,
                ideaIA: null,
              },
            ]);
          }
          this.paginaActivaIndex.set(0);
          this.contenido.set(this.paginas()[0].contenido);

          this.cargando.set(false);
        },
        error: (e) => {
          this.error.set(this.traducirErrorGuardado(e) || 'No se pudo cargar el cuento.');
          this.cargando.set(false);
        },
      });
    } else {
      let initialContent = '';
      if (plantillaId && PLANTILLAS[plantillaId]) {
        initialContent = PLANTILLAS[plantillaId];
        this.titulo.set('Mi nueva historia');
      }
      this.paginas.set([
        {
          id: 'page-1',
          contenido: initialContent,
          colorFondo: '#ffffff',
          ilustracion: null,
          ideaIA: null,
        },
      ]);
      this.paginaActivaIndex.set(0);
      this.contenido.set(initialContent);
      this.cargando.set(false);
    }

    // Autoguardado: 2.5s de inactividad después del último cambio.
    this.autoSaveSubject
      .pipe(
        debounceTime(2500),
        filter(() => this.titulo().trim().length > 0)
      )
      .subscribe(() => this.guardarSilencioso());
  }

  // ════════════════════════════════════════════════════════════════
  //  MUTADORES HELPERS (actualizan la página activa de forma inmutable)
  // ════════════════════════════════════════════════════════════════

  /**
   * Inmutable: clona `paginas`, aplica `mutator` a la página activa
   * y emite. Cualquier cambio a la página activa debe pasar por aquí
   * para que el `computed` `ilustracionActiva` / `ideaActiva` se refresque.
   */
  private actualizarPaginaActiva(mutator: (p: PaginaCuento) => PaginaCuento): void {
    const idx = this.paginaActivaIndex();
    const actuales = this.paginas();
    if (idx < 0 || idx >= actuales.length) return;
    const siguiente = actuales.map((p, i) => (i === idx ? mutator(p) : p));
    this.paginas.set(siguiente);
  }

  // ════════════════════════════════════════════════════════════════
  //  PORTADA (cover del cuento, único)
  //  Flujo: comprimir → subir a Supabase → guardar URL en Firestore
  // ════════════════════════════════════════════════════════════════

  /**
   * Sube la imagen de portada a Supabase Storage y guarda la URL
   * (relativa, prefijo `uploads/`) en el signal `portada`. El signal
   * contiene una URL, NO base64: el documento de Firestore se mantiene
   * ligero.
   */
  async onSubirPortada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const error = this.validarImagen(file);
    if (error) {
      this.toast.error(error);
      input.value = '';
      return;
    }

    this.subiendoPortada.set(true);
    try {
      // 1) Comprimir a un Blob JPEG (target: <500KB, max 1600px ancho).
      const portadaAnterior = this.portada();
      const blobComprimido = await this.comprimirABlob(file, 1600, 1600, 0.85);

      // 2) Mostrar preview LOCAL inmediatamente con el blob comprimido.
      //    El usuario ve su imagen al instante; cuando termine la subida
      //    a Supabase, el signal `portada` se actualiza a la URL remota
      //    y limpiamos este preview.
      const previewAnterior = this.revocarPreview(this.previewPortada());
      this.previewPortada.set(URL.createObjectURL(blobComprimido));

      // 3) Asegurar un cuentoId estable (UUID) y subir a Supabase.
      const cuentoId = this.asegurarCuentoId();
      const resultado = await this.almacenamiento.subirPortada(cuentoId, blobComprimido);

      // 4) Guardar la URL relativa en el signal y limpiar el preview.
      this.portada.set(resultado.rutaRelativa);
      this.revocarPreview(this.previewPortada());
      this.previewPortada.set(null);

      // 5) Limpieza del archivo anterior (si era una URL de Supabase y
      //    NO es la misma — porque el reemplazo usa x-upsert).
      if (portadaAnterior && portadaAnterior !== resultado.rutaRelativa) {
        await this.almacenamiento.eliminar(portadaAnterior);
      }

      this.autoSaveSubject.next();
    } catch (e) {
      console.error('Error subiendo portada:', e);
      this.revocarPreview(this.previewPortada());
      this.previewPortada.set(null);
      // Mostramos el error en el banner de la página (no toast arriba
      // — ver comentario en `guardar`).
      this.errorGuardado.set(
        e instanceof Error
          ? `No pudimos subir la portada: ${e.message}`
          : 'No pudimos subir la portada. Inténtalo de nuevo.',
      );
    } finally {
      this.subiendoPortada.set(false);
      input.value = '';
    }
  }

  async eliminarPortada() {
    const ruta = this.portada();
    this.portada.set(null);
    if (ruta) {
      // Best-effort: si falla, no importa (puede que ya no exista).
      await this.almacenamiento.eliminar(ruta);
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  GESTIÓN DE PÁGINAS
  // ════════════════════════════════════════════════════════════════

  seleccionarPagina(index: number) {
    if (index < 0 || index >= this.paginas().length) return;
    if (index === this.paginaActivaIndex()) return;

    this.paginaActivaIndex.set(index);
    this.contenido.set(this.paginas()[index].contenido);
  }

  agregarPagina() {
    const nuevasPaginas = [
      ...this.paginas(),
      {
        id: `page-${Date.now()}`,
        contenido: '<p></p>',
        colorFondo: '#ffffff',
        ilustracion: null,
        ideaIA: null,
      },
    ];
    this.paginas.set(nuevasPaginas);
    this.seleccionarPagina(nuevasPaginas.length - 1);
    this.autoSaveSubject.next();
  }

  eliminarPagina(index: number) {
    if (this.paginas().length <= 1) return;
    const nuevasPaginas = [...this.paginas()];
    nuevasPaginas.splice(index, 1);
    this.paginas.set(nuevasPaginas);
    const nuevoIndex = Math.min(index, nuevasPaginas.length - 1);
    this.paginaActivaIndex.set(nuevoIndex);
    this.contenido.set(nuevasPaginas[nuevoIndex].contenido);
    this.autoSaveSubject.next();
  }

  cambiarColorFondo(color: string) {
    this.actualizarPaginaActiva((p) => ({ ...p, colorFondo: color }));
    this.autoSaveSubject.next();
  }

  // ════════════════════════════════════════════════════════════════
  //  ILUSTRACIÓN DE PÁGINA (per-page)
  //  Flujo: comprimir → subir a Supabase → guardar URL en la página
  // ════════════════════════════════════════════════════════════════

  /**
   * Sube la imagen para la PÁGINA ACTIVA a Supabase y guarda la URL
   * dentro del objeto `PaginaCuento`. Como cada página puede tener la
   * suya, se organizan en `cuentos/ilustraciones/{cuentoId}/{pageId}.jpg`.
   */
  async onSubirIlustracion(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const error = this.validarImagen(file);
    if (error) {
      this.toast.error(error);
      input.value = '';
      return;
    }

    this.subiendoIlustracion.set(true);
    try {
      // Capturamos la ilustración anterior (si la hay) para limpiar luego
      const paginaActual = this.paginaActiva();
      const ilustracionAnterior = paginaActual?.ilustracion ?? null;

      const blobComprimido = await this.comprimirABlob(file, 1200, 900, 0.78);

      // Preview local inmediato
      this.revocarPreview(this.previewIlustracion());
      this.previewIlustracion.set(URL.createObjectURL(blobComprimido));

      const cuentoId = this.asegurarCuentoId();
      const pageId = paginaActual?.id ?? 'page-0';
      const resultado = await this.almacenamiento.subirIlustracion(
        cuentoId,
        pageId,
        blobComprimido,
      );

      this.actualizarPaginaActiva((p) => ({
        ...p,
        ilustracion: resultado.rutaRelativa,
        // Nueva imagen → la idea multimodal anterior ya no aplica
        ideaIA: null,
      }));

      // Limpiamos el preview (la URL remota ya está en la página).
      this.revocarPreview(this.previewIlustracion());
      this.previewIlustracion.set(null);

      // Si reemplaza, la nueva URL coincide con la anterior (x-upsert
      // sobreescribe). Si es una página nueva con una URL distinta,
      // limpiamos la anterior.
      if (
        ilustracionAnterior &&
        ilustracionAnterior !== resultado.rutaRelativa
      ) {
        await this.almacenamiento.eliminar(ilustracionAnterior);
      }

      this.autoSaveSubject.next();
    } catch (e) {
      console.error('Error subiendo ilustración:', e);
      this.revocarPreview(this.previewIlustracion());
      this.previewIlustracion.set(null);
      // Mostramos el error en el banner de la página (no toast arriba
      // — ver comentario en `guardar`).
      this.errorGuardado.set(
        e instanceof Error
          ? `No pudimos subir la ilustración: ${e.message}`
          : 'No pudimos subir la ilustración. Inténtalo de nuevo.',
      );
    } finally {
      this.subiendoIlustracion.set(false);
      input.value = '';
    }
  }

  /** Quita la ilustración de la página activa (botón X sobre la imagen). */
  async quitarIlustracion() {
    const ruta = this.paginaActiva()?.ilustracion ?? null;
    this.actualizarPaginaActiva((p) => ({
      ...p,
      ilustracion: null,
      // Al quitar la imagen, la sugerencia multimodal anterior pierde
      // contexto. La limpiamos para que el usuario no vea una respuesta
      // basada en una imagen que ya no está.
      ideaIA: null,
    }));
    if (ruta) {
      await this.almacenamiento.eliminar(ruta);
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  EDICIÓN DE TEXTO (sincroniza página activa + autoguarda)
  // ════════════════════════════════════════════════════════════════

  onTituloChange(texto: string) {
    this.titulo.set(texto);
    this.autoSaveSubject.next();
  }

  onDescripcionChange(texto: string) {
    this.descripcion.set(texto);
    this.autoSaveSubject.next();
  }

  onContentChange(texto: string) {
    this.contenido.set(texto);
    this.actualizarPaginaActiva((p) => ({ ...p, contenido: texto }));
    this.autoSaveSubject.next();
  }

  // ════════════════════════════════════════════════════════════════
  //  QUILL — blockquote como "ventana de texto" con X
  // ════════════════════════════════════════════════════════════════

  onEditorCreated(quill: any) {
    this.editorInstance = quill;

    quill.root.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'BLOCKQUOTE') {
        const rect = target.getBoundingClientRect();
        const clickX = e.clientX;
        const clickY = e.clientY;

        if (
          clickX >= rect.right - 25 && clickX <= rect.right + 20 &&
          clickY >= rect.top - 20 && clickY <= rect.top + 20
        ) {
          const QuillClass = (quill as any).constructor;
          const blot = QuillClass.find(target);
          if (blot) {
            const index = quill.getIndex(blot);
            const length = blot.length();
            quill.formatText(index, length, 'blockquote', false);
          }
        }
      }
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  ASISTENTE DAE-BOT (3 acciones)
  // ════════════════════════════════════════════════════════════════

  /**
   * Acción 1 — "Generar ideas".
   * Usa la ilustración de la página activa (si la hay) + brief + categoría.
   * Escribe el resultado en `ideaIA` de la página activa.
   */
  async generarIdeas() {
    this.cargandoIdea.set(true);
    try {
      const titulo = this.titulo().trim() || 'Sin título';
      const contenido = this.contenido().trim() || 'El cuento recién empieza.';
      const imagen = this.ilustracionActiva() ?? null;
      const categoria = this.categoria();
      const rangoEdad = this.rangoEdad();
      const descripcion = this.descripcion().trim();

      const prompt = JSON.stringify({
        modo: 'ideas',
        titulo,
        categoria,
        rango_edad: rangoEdad,
        descripcion,
        contenido_actual: contenido,
        imagen_base64: imagen,
        instruccion:
          'Eres Dae-bot, el asistente creativo de DAEMON. Para esta PÁGINA específica de un cuento, ' +
          'sugiere 2-3 ideas cortas y concretas que el estudiante pueda desarrollar. ' +
          'Reglas: (1) si recibes una imagen, interprétala como contexto visual (personajes, escenario, ' +
          'emoción) y basate en ella; (2) si NO hay imagen, basate sólo en el título, la categoría, ' +
          'el rango de edad, la descripción/brief y el contenido que ya escribió; (3) mantén el tono ' +
          'apropiado para el rango de edad; (4) respeta la categoría/género declarada. ' +
          'Responde en español, sin viñetas, sin numeración, en uno o dos párrafos.'
      });

      const respuesta = (await firstValueFrom(this.chatbot.enviar(prompt))) as any;
      const texto = this.extraerTextoBot(respuesta, imagen);

      this.actualizarPaginaActiva((p) => ({
        ...p,
        ideaIA: { texto, conImagen: Boolean(imagen), fecha: Date.now(), modo: 'ideas' },
      }));
    } catch (e) {
      console.error('Error al generar ideas:', e);
      this.actualizarPaginaActiva((p) => ({
        ...p,
        ideaIA: {
          texto: 'No pude conectar con mi circuito creativo ahora. Inténtalo de nuevo en unos segundos.',
          conImagen: false,
          fecha: Date.now(),
          modo: 'ideas',
        },
      }));
    } finally {
      this.cargandoIdea.set(false);
    }
  }

  /**
   * Acción 2 — "Continuar mi historia".
   * Lee el contenido de la página activa y propone 1-2 párrafos de
   * continuación. La sugerencia queda guardada en la PÁGINA ACTIVA
   * (no contamina las demás).
   */
  async continuarHistoria() {
    this.cargandoContinuacion.set(true);
    try {
      const titulo = this.titulo().trim() || 'Sin título';
      const contenido = this.contenido().trim();
      if (!contenido || contenido.length < 20) {
        this.toast.warning('Escribe al menos un par de líneas antes de pedir una continuación.');
        this.cargandoContinuacion.set(false);
        return;
      }
      const categoria = this.categoria();
      const rangoEdad = this.rangoEdad();
      const descripcion = this.descripcion().trim();
      const imagen = this.ilustracionActiva() ?? null;

      const prompt = JSON.stringify({
        modo: 'continuar',
        titulo,
        categoria,
        rango_edad: rangoEdad,
        descripcion,
        contenido_actual: contenido,
        imagen_base64: imagen,
        instruccion:
          'Eres Dae-bot, el asistente creativo de DAEMON. El estudiante acaba de escribir esta página ' +
          'de un cuento. Tu trabajo es CONTINUAR la historia de forma natural, en 1 o 2 párrafos, ' +
          'manteniendo: (1) el mismo tono y registro; (2) los personajes y escenarios ya introducidos; ' +
          '(3) la categoría/género declarada; (4) el rango de edad del público. ' +
          'Si te paso una imagen, interprétala como el escenario o atmósfera hacia donde debe ir ' +
          'la continuación. NO repitas el contenido que ya está escrito. NO agregues introducciones ' +
          'ni explicaciones: responde SOLO con los párrafos de continuación.'
      });

      const respuesta = (await firstValueFrom(this.chatbot.enviar(prompt))) as any;
      const texto = this.extraerTextoBot(respuesta, imagen);

      this.actualizarPaginaActiva((p) => ({
        ...p,
        ideaIA: { texto, conImagen: Boolean(imagen), fecha: Date.now(), modo: 'continuar' },
      }));
    } catch (e) {
      console.error('Error al continuar historia:', e);
      this.actualizarPaginaActiva((p) => ({
        ...p,
        ideaIA: {
          texto: 'No pude continuar la historia ahora. Inténtalo de nuevo en unos segundos.',
          conImagen: false,
          fecha: Date.now(),
          modo: 'continuar',
        },
      }));
    } finally {
      this.cargandoContinuacion.set(false);
    }
  }

  /**
   * Acción 3 — "Sugerir título".
   * Considera categoría + rango de edad + descripción + primeras letras.
   */
  async sugerirTitulo() {
    this.cargandoTitulo.set(true);
    try {
      const categoria = this.categoria();
      const rangoEdad = this.rangoEdad();
      const descripcion = this.descripcion().trim();
      const muestraContenido = this.contenido().replace(/<[^>]*>?/gm, ' ').slice(0, 600);

      const prompt = JSON.stringify({
        modo: 'titulo',
        categoria,
        rango_edad: rangoEdad,
        descripcion,
        muestra_contenido: muestraContenido,
        instruccion:
          'Eres Dae-bot, el asistente creativo de DAEMON. Genera UN SOLO título para un cuento. ' +
          'Reglas: (1) el título DEBE ser coherente con la categoría/género indicada; (2) el tono ' +
          'y vocabulario deben ser apropiados para el rango de edad; (3) si hay descripción/brief, ' +
          'el título DEBE reflejar esa idea central; (4) si no hay descripción, basate en la ' +
          'muestra de contenido; (5) NO uses comillas, viñetas, números ni explicaciones; ' +
          '(6) máximo 8 palabras. Responde SOLO con el título.'
      });

      const respuesta = (await firstValueFrom(this.chatbot.enviar(prompt))) as any;
      const tituloBot = this.extraerTextoBot(respuesta, null) || 'Una historia por descubrir';
      // Persistimos en `tituloIA` (signal local para mostrar la sugerencia)
      this.tituloIA.set(tituloBot.trim());
    } catch (e) {
      console.error('Error al sugerir título:', e);
      this.tituloIA.set('El Gran Misterio');
    } finally {
      this.cargandoTitulo.set(false);
    }
  }

  /** Signal exclusivo para mostrar la sugerencia de título (es global, no por página). */
  readonly tituloIA = signal<string | null>(null);

  /** Inserta la idea/continuación de la IA al final del contenido de la página activa. */
  aplicarIdeaIA() {
    const idea = this.ideaActiva();
    if (!idea?.texto) return;
    const actual = this.contenido() || '';
    const separador = '<p><br></p>';
    const encabezado = idea.modo === 'continuar'
      ? '<p><strong style="color: #6a4cff;">✍️ Continuación sugerida por Dae-bot:</strong></p>'
      : '<p><strong style="color: #6a4cff;">✨ Inspiración visual de Dae-bot:</strong></p>';
    const nuevo = `${actual}${separador}${encabezado}<p>${this.escaparHtml(idea.texto)}</p>`;
    this.contenido.set(nuevo);
    this.onContentChange(nuevo);
  }

  aplicarTitulo(titulo: string) {
    this.titulo.set(titulo.trim());
    this.tituloIA.set(null);
    this.autoSaveSubject.next();
  }

  cerrarIdea() {
    this.actualizarPaginaActiva((p) => ({ ...p, ideaIA: null }));
  }

  cerrarTituloIA() {
    this.tituloIA.set(null);
  }

  // ════════════════════════════════════════════════════════════════
  //  PERSISTENCIA
  // ════════════════════════════════════════════════════════════════

  guardar(nuevoEstado?: 'borrador' | 'publicado') {
    if (nuevoEstado) this.estado.set(nuevoEstado);

    // No permitir guardar si hay una imagen subiendo: podríamos
    // persistir una URL de la versión vieja y perder la nueva.
    if (this.subiendoImagen()) {
      this.toast.warning('Espera a que termine de subirse la imagen.');
      return;
    }

    this.guardando.set(true);
    this.mensaje.set('');
    this.errorGuardado.set(null);
    this.guardadoOk.set(false);

    const datosGuardar = this.construirPayload();
    const idActual = this.cuentoId();
    if (idActual) datosGuardar.id = idActual;

    this.cuentos.guardar(datosGuardar).subscribe({
      next: (res) => {
        if (!this.cuentoId()) this.cuentoId.set(res.id as unknown as string);
        this.ultimaEdicion.set('Guardado hace unos segundos');
        this.guardando.set(false);
        this.guardadoOk.set(true);
        // No lanzamos toast.success: el banner verde dentro de la página
        // ya muestra el estado. Lanzar ambos es redundante y ruidoso.
        if (nuevoEstado === 'publicado') {
          this.router.navigate(['/alumno/proyectos/cuentos']);
        }
        // Limpia el "ok" después de unos segundos para que el banner no
        // quede pegado.
        setTimeout(() => this.guardadoOk.set(false), 3000);
      },
      error: (e) => {
        this.guardando.set(false);
        const mensaje = this.traducirErrorGuardado(e);
        this.errorGuardado.set(mensaje);
        // Tampoco toast.error aquí: el banner rojo lo muestra y permite
        // cerrar. Lanzar ambos satura la parte superior de la pantalla.
      }
    });
  }

  guardarSilencioso() {
    this.ultimaEdicion.set('Guardando...');
    const datosGuardar = this.construirPayload();
    const idActual = this.cuentoId();
    if (idActual) datosGuardar.id = idActual;

    this.cuentos.guardar(datosGuardar).subscribe({
      next: (res) => {
        if (!this.cuentoId()) this.cuentoId.set(res.id as unknown as string);
        this.ultimaEdicion.set('Guardado hace unos instantes');
      },
      error: (e) => {
        const mensaje = this.traducirErrorGuardado(e);
        this.ultimaEdicion.set('Error al guardar');
        // El silencioso no muestra toast (es muy frecuente por el
        // autoguardado), pero sí actualiza el status.
        console.warn('Autoguardado falló:', e);
      }
    });
  }

  /**
   * Convierte un error de Firestore / red a un mensaje entendible.
   * Cubre los casos típicos: ad-blocker, sin internet, reglas de
   * seguridad, payload inválido.
   */
  private traducirErrorGuardado(e: unknown): string {
    if (!e) return 'Error desconocido al guardar.';
    const err = e as { code?: string; message?: string; name?: string; status?: number };

    // Ad-blocker o firewall: la petición nunca llegó al servidor
    if (err.name === 'FirebaseError' && /blocked|network|fetch/i.test(err.message || '')) {
      return 'Tu navegador bloqueó la conexión con la base de datos. Desactiva el bloqueador de anuncios para localhost o agrega una excepción.';
    }
    if (err.code === 'unavailable' || err.code === 'network-request-failed') {
      return 'Sin conexión a internet. Verifica tu red e inténtalo de nuevo.';
    }
    // Reglas de seguridad de Firestore
    if (err.code === 'permission-denied') {
      return 'No tienes permisos para guardar este cuento. Revisa las reglas de seguridad.';
    }
    if (err.code === 'unauthenticated') {
      return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    }
    if (err.code === 'invalid-argument' || err.code === 'data-loss') {
      return `Los datos enviados no son válidos: ${err.message ?? 'revisa el formulario'}`;
    }
    if (err.code === 'quota-exceeded') {
      return 'Se agotó la cuota de la base de datos. Intenta en unos minutos.';
    }
    // Fallback: mensaje del backend si existe, o uno genérico
    return err.message || 'No pudimos guardar el cuento. Inténtalo nuevamente.';
  }

  /**
   * Construye el payload común. Aquí se serializan TODOS los campos
   * que Firestore debe persistir, incluyendo las ilustraciones por
   * página y la idea de IA. Para mantener compatibilidad con la galería
   * (que todavía lee `img_1` para mostrar la portada), sincronizamos
   * `img_1` con la portada o, en su defecto, con la primera ilustración
   * de página.
   */
  private construirPayload(): CuentoPayload {
    const paginasSerializadas = this.paginas().map((p) => ({ ...p }));
    const primeraIlustracion = paginasSerializadas.find((p) => p.ilustracion)?.ilustracion ?? null;

    return {
      titulo: this.titulo(),
      descripcion: this.descripcion(),
      contenido: this.contenido(),       // legacy proxy = contenido de la página activa
      data_1: this.paginas()[0]?.contenido ?? '', // legacy primera página
      paginas: paginasSerializadas,
      categoria: this.categoria(),
      rango_edad: this.rangoEdad(),
      visibilidad: this.visibilidad(),
      estado: this.estado(),
      portada: this.portada() || primeraIlustracion,
      img_1: this.portada() || primeraIlustracion, // compat galería
      palabras: this.palabras(),
      tiempo_lectura: parseInt(this.tiempoLectura(), 10) || 0,
    };
  }

  // ════════════════════════════════════════════════════════════════
  //  ACCIONES DE PUBLICACIÓN / COMPARTIR / ELIMINAR
  // ════════════════════════════════════════════════════════════════

  async vistaPrevia(): Promise<void> {
    const id = this.cuentoId();
    if (!id) {
      this.toast.info('Guardando borrador antes de la vista previa…');
      const datos = this.construirPayload();
      this.cuentos.guardar(datos).subscribe({
        next: (res) => {
          const nuevoId = (res.id as unknown as string) ?? null;
          if (nuevoId) {
            this.cuentoId.set(nuevoId);
            this.router.navigate(['/alumno/proyectos/cuentos', nuevoId]);
          }
        },
        error: () => this.toast.error('No pudimos guardar el borrador. Intenta de nuevo.'),
      });
      return;
    }
    this.router.navigate(['/alumno/proyectos/cuentos', id]);
  }

  async compartir(): Promise<void> {
    const id = this.cuentoId();
    if (!id) {
      this.toast.warning('Guarda el borrador antes de compartir.');
      return;
    }
    const url = `${window.location.origin}/alumno/proyectos/cuentos/${id}`;
    const titulo = this.titulo() || 'Mi historia';
    const shareData: ShareData = {
      title: titulo,
      text: `Mira mi cuento "${titulo}" en DAEMON.`,
      url,
    };

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        // @ts-ignore — share() no está tipado en todas las versiones de TS.
        await navigator.share(shareData);
        this.toast.success('Compartido.');
        return;
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      this.toast.success('Enlace copiado al portapapeles.');
    } catch {
      this.toast.error('No pudimos compartir. Copia este enlace: ' + url);
    }
  }

  eliminarCuento(): void {
    const id = this.cuentoId();
    if (!id) {
      this.router.navigate(['/alumno/proyectos/cuentos']);
      return;
    }
    const ok = confirm('¿Borrar este cuento? No se puede deshacer.');
    if (!ok) return;
    this.cuentos.eliminar(id).subscribe({
      next: () => {
        this.toast.success('Cuento eliminado.');
        this.router.navigate(['/alumno/proyectos/cuentos']);
      },
      error: () => this.toast.error('No pudimos eliminarlo. Intenta de nuevo.'),
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  MIGRACIÓN DE CONTENIDO LEGACY
  // ════════════════════════════════════════════════════════════════

  /**
   * Convierte el contenido legacy de DAEMON (formato de escenas con
   * `bubbles` y `chars` como JSON) en HTML válido para el editor Quill.
   *
   * - Si el string es HTML normal, lo devuelve tal cual.
   * - Si es JSON con `bubbles` (diálogos), extrae el texto.
   * - Si tiene `chars` (sprites de personajes con coordenadas), los
   *   descarta — el sistema nuevo no soporta escenas interactivas.
   * - Si no se puede parsear, devuelve el string original.
   *
   * Esto evita que el navegador intente cargar `<img src="page-X.jpg">`
   * de recursos que ya no existen y produzcan 404 en consola.
   *
   * Implementación: delega a `migrarContenidoLegacy` en
   * `utils/cuento-legacy.ts` para compartir con el visor.
   */
  private migrarContenidoLegacy(raw: unknown): string {
    return migrarContenidoLegacy(raw);
  }

  // ════════════════════════════════════════════════════════════════
  //  UTILIDADES
  // ════════════════════════════════════════════════════════════════

  /**
   * Libera una URL de blob (usada como preview local) si existe, y la
   * limpia del set. Evita fugas de memoria al subir muchas imágenes.
   */
  private revocarPreview(url: string | null): null {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* noop */
      }
    }
    return null;
  }

  /**
   * Valida que el archivo sea una imagen soportada y no supere el tope
   * de peso. Devuelve un mensaje de error listo para mostrar, o null.
   */
  private validarImagen(file: File): string | null {
    if (!this.TIPOS_IMAGEN.includes(file.type)) {
      return 'Formato no soportado. Usa PNG, JPG, WEBP o GIF.';
    }
    if (file.size > this.MAX_IMAGEN_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      return `La imagen pesa ${mb}MB. El máximo permitido es 5MB.`;
    }
    return null;
  }

  /**
   * Comprime un File de imagen a un Blob JPEG dentro de los límites dados.
   * Mantiene el aspect ratio. Si la imagen ya es más chica que los
   * límites, sólo la re-encodea a JPEG con la calidad indicada.
   *
   * Esto evita pasar archivos gigantes a Supabase y reduce tiempos de
   * subida.
   */
  private comprimirABlob(
    file: File | Blob,
    maxAncho: number,
    maxAlto: number,
    calidad: number,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);

        let { width, height } = img;
        if (width > maxAncho || height > maxAlto) {
          const ratio = Math.min(maxAncho / width, maxAlto / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo crear el contexto 2D del canvas.'));
          return;
        }
        // Fondo blanco para imágenes con transparencia (PNG → JPEG)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('No se pudo comprimir la imagen.'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          calidad,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo cargar la imagen. ¿Formato no soportado?'));
      };

      img.src = url;
    });
  }

  /**
   * Normaliza la respuesta del backend en `texto`. Soporta:
   * - `respuesta.content`
   * - `respuesta.mensaje`
   * - string crudo
   * - objeto `{ texto }`
   */
  private extraerTextoBot(respuesta: any, fallbackImagen: string | null): string {
    if (!respuesta) return '';
    if (typeof respuesta === 'string') return respuesta.trim();
    if (typeof respuesta.content === 'string') return respuesta.content.trim();
    if (typeof respuesta.mensaje === 'string') return respuesta.mensaje.trim();
    if (typeof respuesta.texto === 'string') return respuesta.texto.trim();
    if (typeof respuesta.text === 'string') return respuesta.text.trim();
    return fallbackImagen
      ? 'No pude interpretar la respuesta del bot con imagen. Intenta sin imagen.'
      : 'No pude interpretar la respuesta del bot. Intenta de nuevo.';
  }

  /** Escapa HTML básico para que la sugerencia no rompa el editor. */
  private escaparHtml(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }
}
