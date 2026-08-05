import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, filter } from 'rxjs';
import { Sesion } from '../../../core/servicios/sesion';
import { ACTIVOS_CUENTO_REPOSITORIO } from '../acceso-datos/activos-cuento.repositorio';
import { ASISTENTE_CUENTO_GATEWAY } from '../acceso-datos/asistente-cuento.gateway';
import { CUENTO_REPOSITORIO } from '../acceso-datos/cuento.repositorio';
import { CuentosImagenService } from '../services/cuentos-imagen.service';
import { AudienciaCuento, DatosBorradorCuento, VERSION_ESQUEMA_CUENTO } from '../dominio/cuento.modelo';
import { ErrorCuento, normalizarErrorCuento } from '../dominio/errores-cuento';
import { PaginaCuento, SugerenciaPaginaCuento, crearPaginaCuento } from '../dominio/pagina-cuento.modelo';
import { contarPalabras, minutosLectura } from '../dominio/politicas-cuento';
import { ActualizarBorradorCasoUso } from './actualizar-borrador.caso-uso';
import { BorradorLocalCuento } from './borrador-local-cuento';
import { CrearBorradorCasoUso } from './crear-borrador.caso-uso';
import { EliminarCuentoCasoUso } from './eliminar-cuento.caso-uso';
import { crearIdPagina } from './identificadores-cuento';
import { PLANTILLAS_CUENTO } from './plantillas-cuento';
import { PublicarCuentoCasoUso } from './publicar-cuento.caso-uso';

export type EstadoPersistenciaEditor =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'listo'; readonly texto: string }
  | { readonly tipo: 'guardando' }
  | { readonly tipo: 'guardado'; readonly texto: string }
  | { readonly tipo: 'error-carga'; readonly mensaje: string }
  | { readonly tipo: 'error-guardado'; readonly error: ErrorCuento };

@Injectable()
export class EditorCuentoFacade {
  private readonly repositorio = inject(CUENTO_REPOSITORIO);
  private readonly crearBorrador = inject(CrearBorradorCasoUso);
  private readonly actualizarBorrador = inject(ActualizarBorradorCasoUso);
  private readonly publicarCuento = inject(PublicarCuentoCasoUso);
  private readonly eliminarCuentoCasoUso = inject(EliminarCuentoCasoUso);
  private readonly borradorLocal = inject(BorradorLocalCuento);
  private readonly sesion = inject(Sesion);
  private readonly activos = inject(ACTIVOS_CUENTO_REPOSITORIO);
  private readonly asistente = inject(ASISTENTE_CUENTO_GATEWAY);
  private readonly imagenes = inject(CuentosImagenService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cambios = new Subject<void>();

  readonly estadoPersistencia = signal<EstadoPersistenciaEditor>({ tipo: 'cargando' });
  readonly cargando = computed(() => this.estadoPersistencia().tipo === 'cargando');
  readonly guardando = computed(() => this.estadoPersistencia().tipo === 'guardando');
  readonly guardadoOk = computed(() => this.estadoPersistencia().tipo === 'guardado');
  readonly error = computed(() => {
    const estado = this.estadoPersistencia();
    return estado.tipo === 'error-carga' ? estado.mensaje : '';
  });
  readonly errorGuardado = computed(() => {
    const estado = this.estadoPersistencia();
    return estado.tipo === 'error-guardado' ? estado.error.message : null;
  });
  readonly ultimaEdicion = computed(() => {
    const estado = this.estadoPersistencia();
    if (estado.tipo === 'guardando') return 'Guardando…';
    if (estado.tipo === 'guardado' || estado.tipo === 'listo') return estado.texto;
    if (estado.tipo === 'error-guardado') return 'Cambios conservados localmente';
    return 'Borrador nuevo';
  });

  readonly cuentoId = signal<string | null>(null);
  readonly versionId = signal<string | null>(null);
  readonly revision = signal(0);
  readonly titulo = signal('');
  readonly descripcion = signal('');
  readonly categoria = signal('Fantasía');
  readonly rangoEdad = signal('9 - 12 años');
  readonly portada = signal<string | null>(null);
  readonly paginas = signal<PaginaCuento[]>([]);
  readonly paginaActivaIndex = signal(0);
  readonly contenido = signal('');
  readonly paginaActiva = computed(() => this.paginas()[this.paginaActivaIndex()] ?? null);
  readonly ilustracionActiva = computed(() => this.paginaActiva()?.ilustracionRef ?? null);
  readonly ideaActiva = computed(() => this.paginaActiva()?.sugerencia ?? null);
  readonly tituloIA = signal<string | null>(null);

  readonly cargandoIdea = signal(false);
  readonly cargandoContinuacion = signal(false);
  readonly cargandoTitulo = signal(false);
  readonly subiendoPortada = signal(false);
  readonly subiendoIlustracion = signal(false);
  readonly previewPortada = signal<string | null>(null);
  readonly previewIlustracion = signal<string | null>(null);
  readonly subiendoImagen = computed(() => this.subiendoPortada() || this.subiendoIlustracion());
  readonly portadaDisplayUrl = computed(() => this.previewPortada() || this.activos.resolverUrl(this.portada()));
  readonly ilustracionDisplayUrl = computed(
    () => this.previewIlustracion() || this.activos.resolverUrl(this.ilustracionActiva()),
  );

  readonly palabras = computed(() => contarPalabras(this.paginas()));
  readonly tiempoLectura = computed(() => `${minutosLectura(this.palabras())} min aprox.`);
  readonly progresoPorcentaje = computed(() => {
    let progreso = 0;
    if (this.titulo().trim()) progreso += 25;
    if (this.portada()) progreso += 25;
    if (this.palabras() >= 10) progreso += 50;
    return progreso;
  });
  readonly listoParaPublicar = computed(() => Boolean(this.titulo().trim()) && this.palabras() > 0);
  readonly tieneCambiosSinGuardar = signal(false);

  private uid = '';
  private audiencia: AudienciaCuento | null = null;
  private persistido = false;
  private secuenciaCambios = 0;
  private guardadoEnCurso: Promise<boolean> | null = null;
  private guardadoPendiente = false;
  private readonly referenciasPendientesEliminar = new Set<string>();

  constructor() {
    this.cambios.pipe(
      debounceTime(2500),
      filter(() => Boolean(this.titulo().trim()) && !this.subiendoImagen()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => void this.guardar(false));

    this.destroyRef.onDestroy(() => {
      this.asistente.cancelar();
      this.revocarPreview(this.previewPortada());
      this.revocarPreview(this.previewIlustracion());
    });
  }

  async inicializar(cuentoId: string | null, plantillaId: string | null): Promise<void> {
    this.estadoPersistencia.set({ tipo: 'cargando' });
    try {
      // El UID local es una clave de caché para el borrador local. No es
      // necesario exigir una sesión de Firebase activa: la autoridad de
      // datos es Laravel (vía API), que identifica al usuario por Sanctum.
      const usuario = this.sesion.usuario();
      this.uid = String(usuario?.id ?? 'anonimo');
      const nivel = usuario?.nivel;
      if (nivel !== 'KIDS' && nivel !== 'TEENS') {
        throw new ErrorCuento('NO_AUTORIZADO', 'Tu cuenta no tiene una audiencia estudiantil válida.', false);
      }
      this.audiencia = nivel;
      if (cuentoId) {
        await this.cargarExistente(cuentoId);
      } else {
        this.prepararNuevo(plantillaId);
      }
    } catch (error) {
      this.estadoPersistencia.set({ tipo: 'error-carga', mensaje: normalizarErrorCuento(error).message });
    }
  }

  onTituloChange(valor: string): void {
    this.titulo.set(valor);
    this.marcarCambio();
  }

  onDescripcionChange(valor: string): void {
    this.descripcion.set(valor);
    this.marcarCambio();
  }

  onCategoriaChange(valor: string): void {
    this.categoria.set(valor);
    this.marcarCambio();
  }

  onRangoEdadChange(valor: string): void {
    this.rangoEdad.set(valor);
    this.marcarCambio();
  }

  onContentChange(valor: string): void {
    this.contenido.set(valor);
    this.actualizarPaginaActiva((pagina) => ({ ...pagina, contenido: valor }));
    this.marcarCambio();
  }

  seleccionarPagina(indice: number): void {
    if (indice < 0 || indice >= this.paginas().length || indice === this.paginaActivaIndex()) return;
    this.paginaActivaIndex.set(indice);
    this.contenido.set(this.paginas()[indice].contenido);
  }

  agregarPagina(): void {
    const pagina = this.conIdentidad(crearPaginaCuento(crearIdPagina(), this.paginas().length + 1));
    this.paginas.update((actuales) => [...actuales, pagina]);
    this.seleccionarPagina(this.paginas().length - 1);
    this.marcarCambio();
  }

  eliminarPagina(indice: number): void {
    if (this.paginas().length <= 1 || indice < 0 || indice >= this.paginas().length) return;
    const eliminada = this.paginas()[indice];
    if (eliminada.ilustracionRef) this.referenciasPendientesEliminar.add(eliminada.ilustracionRef);
    const siguientes = this.paginas()
      .filter((_, posicion) => posicion !== indice)
      .map((pagina, posicion) => ({ ...pagina, orden: posicion + 1 }));
    this.paginas.set(siguientes);
    this.paginaActivaIndex.set(Math.min(indice, siguientes.length - 1));
    this.contenido.set(siguientes[this.paginaActivaIndex()].contenido);
    this.marcarCambio();
  }

  cambiarColorFondo(fondoToken: string): void {
    this.actualizarPaginaActiva((pagina) => ({ ...pagina, fondoToken }));
    this.marcarCambio();
  }

  async onSubirPortada(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    const error = this.imagenes.validarImagen(archivo);
    if (error) {
      this.establecerError(new ErrorCuento('DATOS_INVALIDOS', error, false));
      input.value = '';
      return;
    }
    this.subiendoPortada.set(true);
    try {
      const anterior = this.portada();
      const comprimido = await this.imagenes.comprimirABlob(archivo, 1600, 1600, 0.85);
      this.reemplazarPreview(this.previewPortada, comprimido);
      const referencia = await this.activos.subirPortada(this.requerirCuentoId(), comprimido);
      this.portada.set(referencia);
      this.reemplazarPreview(this.previewPortada, null);
      if (anterior && anterior !== referencia) this.referenciasPendientesEliminar.add(anterior);
      this.marcarCambio();
    } catch (errorSubida) {
      this.reemplazarPreview(this.previewPortada, null);
      this.establecerError(normalizarErrorCuento(errorSubida));
    } finally {
      this.subiendoPortada.set(false);
      input.value = '';
    }
  }

  async onSubirIlustracion(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    const error = this.imagenes.validarImagen(archivo);
    if (error) {
      this.establecerError(new ErrorCuento('DATOS_INVALIDOS', error, false));
      input.value = '';
      return;
    }
    this.subiendoIlustracion.set(true);
    try {
      const pagina = this.paginaActiva();
      if (!pagina) throw new ErrorCuento('DATOS_INVALIDOS', 'Selecciona una página.', false);
      const anterior = pagina.ilustracionRef;
      const comprimido = await this.imagenes.comprimirABlob(archivo, 1200, 900, 0.78);
      this.reemplazarPreview(this.previewIlustracion, comprimido);
      const referencia = await this.activos.subirIlustracion(
        this.requerirCuentoId(),
        pagina.id,
        comprimido,
      );
      this.actualizarPaginaActiva((actual) => ({
        ...actual,
        ilustracionRef: referencia,
        sugerencia: null,
      }));
      this.reemplazarPreview(this.previewIlustracion, null);
      if (anterior && anterior !== referencia) this.referenciasPendientesEliminar.add(anterior);
      this.marcarCambio();
    } catch (errorSubida) {
      this.reemplazarPreview(this.previewIlustracion, null);
      this.establecerError(normalizarErrorCuento(errorSubida));
    } finally {
      this.subiendoIlustracion.set(false);
      input.value = '';
    }
  }

  eliminarPortada(): void {
    const referencia = this.portada();
    if (referencia) this.referenciasPendientesEliminar.add(referencia);
    this.portada.set(null);
    this.marcarCambio();
  }

  quitarIlustracion(): void {
    const referencia = this.paginaActiva()?.ilustracionRef;
    if (referencia) this.referenciasPendientesEliminar.add(referencia);
    this.actualizarPaginaActiva((pagina) => ({ ...pagina, ilustracionRef: null, sugerencia: null }));
    this.marcarCambio();
  }

  async generarIdeas(): Promise<void> {
    this.cargandoIdea.set(true);
    try {
      const texto = await this.asistente.generarIdeas(this.contextoAsistente());
      this.guardarSugerencia({ texto, conImagen: Boolean(this.ilustracionActiva()), generadaEn: 0, modo: 'ideas' });
    } catch {
      this.guardarSugerencia({
        texto: 'No pude conectar con mi circuito creativo. Inténtalo nuevamente.',
        conImagen: false,
        generadaEn: 0,
        modo: 'ideas',
      });
    } finally {
      this.cargandoIdea.set(false);
    }
  }

  async continuarHistoria(): Promise<void> {
    if (this.contenido().trim().length < 20) {
      this.establecerError(new ErrorCuento('DATOS_INVALIDOS', 'Escribe al menos un par de líneas.', false));
      return;
    }
    this.cargandoContinuacion.set(true);
    try {
      const texto = await this.asistente.continuarHistoria(this.contextoAsistente());
      this.guardarSugerencia({ texto, conImagen: Boolean(this.ilustracionActiva()), generadaEn: 0, modo: 'continuar' });
    } catch {
      this.guardarSugerencia({
        texto: 'No pude continuar la historia ahora. Inténtalo nuevamente.',
        conImagen: false,
        generadaEn: 0,
        modo: 'continuar',
      });
    } finally {
      this.cargandoContinuacion.set(false);
    }
  }

  async sugerirTitulo(): Promise<void> {
    this.cargandoTitulo.set(true);
    try {
      this.tituloIA.set((await this.asistente.sugerirTitulo(this.contextoAsistente())).trim());
    } catch {
      this.tituloIA.set('El gran misterio');
    } finally {
      this.cargandoTitulo.set(false);
    }
  }

  aplicarIdeaIA(): void {
    const idea = this.ideaActiva();
    if (!idea?.texto) return;
    const etiqueta = idea.modo === 'continuar' ? 'Continuación sugerida por Dae-bot:' : 'Inspiración de Dae-bot:';
    const nuevo = `${this.contenido()}<p><br></p><p><strong>${etiqueta}</strong></p><p>${this.escaparHtml(idea.texto)}</p>`;
    this.onContentChange(nuevo);
  }

  aplicarTitulo(valor: string): void {
    this.titulo.set(valor.trim());
    this.tituloIA.set(null);
    this.marcarCambio();
  }

  cerrarIdea(): void {
    this.actualizarPaginaActiva((pagina) => ({ ...pagina, sugerencia: null }));
  }

  cerrarTituloIA(): void {
    this.tituloIA.set(null);
  }

  guardar(manual = true): Promise<boolean> {
    if (this.subiendoImagen()) {
      this.establecerError(new ErrorCuento('DATOS_INVALIDOS', 'Espera a que termine la subida de imágenes.', true));
      return Promise.resolve(false);
    }
    if (!this.titulo().trim()) {
      if (manual) this.establecerError(new ErrorCuento('DATOS_INVALIDOS', 'Escribe un título antes de guardar.', false));
      return Promise.resolve(false);
    }
    if (this.guardadoEnCurso) {
      this.guardadoPendiente = true;
      return this.guardadoEnCurso;
    }
    this.guardadoEnCurso = this.ejecutarColaGuardado(manual).finally(() => {
      this.guardadoEnCurso = null;
    });
    return this.guardadoEnCurso;
  }

  async solicitarPublicacion(): Promise<boolean> {
    if (!this.listoParaPublicar()) {
      this.establecerError(new ErrorCuento('DATOS_INVALIDOS', 'Completa el título y el contenido.', false));
      return false;
    }
    if (!(await this.guardar(true))) return false;
    // En modo legacy (PostgreSQL) el cuento ya queda visible en la galería
    // pública al guardarlo; no existe flujo de revisión por moderación.
    if (this.cuentoId()?.startsWith('legacy-')) {
      this.tieneCambiosSinGuardar.set(false);
      this.estadoPersistencia.set({ tipo: 'guardado', texto: 'Publicado en la galería' });
      return true;
    }
    try {
      await this.publicarCuento.ejecutar(this.requerirCuentoId());
      this.tieneCambiosSinGuardar.set(false);
      this.estadoPersistencia.set({ tipo: 'guardado', texto: 'Publicado en la galería' });
      return true;
    } catch (error) {
      this.establecerError(normalizarErrorCuento(error));
      return false;
    }
  }

  async eliminar(): Promise<boolean> {
    if (!this.persistido) return true;
    try {
      await this.eliminarCuentoCasoUso.ejecutar(this.requerirCuentoId());
      this.borradorLocal.limpiar(this.uid, this.requerirCuentoId());
      this.tieneCambiosSinGuardar.set(false);
      return true;
    } catch (error) {
      this.establecerError(normalizarErrorCuento(error));
      return false;
    }
  }

  limpiarErrorGuardado(): void {
    if (this.estadoPersistencia().tipo === 'error-guardado') {
      this.estadoPersistencia.set({ tipo: 'listo', texto: 'Cambios pendientes' });
    }
  }

  resolverActivo(referencia: string | null): string {
    return this.activos.resolverUrl(referencia);
  }

  private prepararNuevo(plantillaId: string | null): void {
    const identidad = this.repositorio.reservarIdentidad();
    this.cuentoId.set(identidad.cuentoId);
    this.versionId.set(identidad.versionId);
    const contenido = plantillaId ? PLANTILLAS_CUENTO[plantillaId] ?? '' : '';
    if (contenido) this.titulo.set('Mi nueva historia');
    this.paginas.set([this.conIdentidad(crearPaginaCuento(crearIdPagina(), 1, contenido))]);
    this.contenido.set(contenido);
    this.estadoPersistencia.set({ tipo: 'listo', texto: 'Borrador nuevo' });
  }

  private async cargarExistente(cuentoId: string): Promise<void> {
    const detalle = await this.repositorio.obtenerDetalle(cuentoId);
    const servidor: DatosBorradorCuento = {
      cuentoId,
      versionId: detalle.version.id,
      titulo: detalle.version.titulo,
      sinopsis: detalle.version.sinopsis,
      categoria: detalle.version.categoria,
      rangoEdad: detalle.version.rangoEdad,
      portadaRef: detalle.cuento.portadaRef,
      paginas: detalle.paginas,
      revisionEsperada: detalle.version.revision,
    };
    const recuperado = this.borradorLocal.recuperar(this.uid, servidor);
    this.aplicarDatos(recuperado ?? servidor);
    this.persistido = true;
    if (recuperado) {
      this.tieneCambiosSinGuardar.set(true);
      this.secuenciaCambios += 1;
      this.estadoPersistencia.set({ tipo: 'listo', texto: 'Borrador local recuperado' });
    } else {
      this.estadoPersistencia.set({ tipo: 'listo', texto: 'Guardado en el servidor' });
    }
  }

  private aplicarDatos(datos: DatosBorradorCuento): void {
    this.cuentoId.set(datos.cuentoId);
    this.versionId.set(datos.versionId);
    this.revision.set(datos.revisionEsperada);
    this.titulo.set(datos.titulo);
    this.descripcion.set(datos.sinopsis);
    this.categoria.set(datos.categoria);
    this.rangoEdad.set(datos.rangoEdad);
    this.portada.set(datos.portadaRef);
    this.paginas.set(datos.paginas.map((pagina, indice) => ({
      ...pagina,
      orden: indice + 1,
      sugerencia: null,
    })));
    this.paginaActivaIndex.set(0);
    this.contenido.set(this.paginas()[0]?.contenido ?? '');
  }

  private marcarCambio(): void {
    this.secuenciaCambios += 1;
    this.tieneCambiosSinGuardar.set(true);
    if (this.uid && this.cuentoId() && this.versionId()) {
      this.borradorLocal.guardar(this.uid, this.construirDatos());
    }
    this.cambios.next();
  }

  private async ejecutarColaGuardado(manual: boolean): Promise<boolean> {
    let todoGuardado = true;
    do {
      this.guardadoPendiente = false;
      const secuencia = this.secuenciaCambios;
      const datos = this.construirDatos();
      this.estadoPersistencia.set({ tipo: 'guardando' });
      try {
        const detalle = this.persistido
          ? await this.actualizarBorrador.ejecutar(datos)
          : await this.crearBorrador.ejecutar(datos, this.requerirAudiencia());
        this.persistido = true;
        this.revision.set(detalle.version.revision);
        // Si el backend degradó al guardado legacy (PostgreSQL), el ID real
        // del cuento es legacy-{n}. Se adopta para que la sesión, la galería
        // y las acciones posteriores apunten al mismo recurso.
        if (detalle.cuento.id.startsWith('legacy-')) {
          this.cuentoId.set(detalle.cuento.id);
        }
        if (secuencia === this.secuenciaCambios) {
          this.tieneCambiosSinGuardar.set(false);
          this.borradorLocal.limpiar(this.uid, datos.cuentoId);
          await this.limpiarReferenciasReemplazadas();
          this.estadoPersistencia.set({ tipo: 'guardado', texto: 'Guardado en el servidor' });
        } else {
          this.guardadoPendiente = true;
        }
      } catch (error) {
        todoGuardado = false;
        this.establecerError(normalizarErrorCuento(error));
        break;
      }
    } while (this.guardadoPendiente);

    if (!manual && this.estadoPersistencia().tipo === 'guardado') {
      this.estadoPersistencia.set({ tipo: 'listo', texto: 'Guardado automáticamente' });
    }
    return todoGuardado;
  }

  private construirDatos(): DatosBorradorCuento {
    const cuentoId = this.requerirCuentoId();
    const versionId = this.versionId();
    if (!versionId) throw new ErrorCuento('DATOS_INVALIDOS', 'Falta la versión del borrador.', false);
    return {
      cuentoId,
      versionId,
      titulo: this.titulo(),
      sinopsis: this.descripcion(),
      categoria: this.categoria(),
      rangoEdad: this.rangoEdad(),
      portadaRef: this.portada(),
      paginas: this.paginas().map((pagina, indice) => ({
        ...pagina,
        cuentoId,
        versionId,
        orden: indice + 1,
        sugerencia: null,
        schemaVersion: VERSION_ESQUEMA_CUENTO,
      })),
      revisionEsperada: this.revision(),
    };
  }

  private actualizarPaginaActiva(transformar: (pagina: PaginaCuento) => PaginaCuento): void {
    const indice = this.paginaActivaIndex();
    this.paginas.update((actuales) => actuales.map((pagina, posicion) =>
      posicion === indice ? transformar(pagina) : pagina,
    ));
  }

  private conIdentidad(pagina: PaginaCuento): PaginaCuento {
    return {
      ...pagina,
      cuentoId: this.requerirCuentoId(),
      versionId: this.versionId() ?? '',
    };
  }

  private contextoAsistente() {
    return {
      audiencia: this.audiencia ?? 'KIDS',
      titulo: this.titulo().trim() || 'Sin título',
      categoria: this.categoria(),
      rangoEdad: this.rangoEdad(),
      descripcion: this.descripcion().trim(),
      contenidoActual: this.contenido().trim() || 'El cuento recién empieza.',
      imagenRef: this.ilustracionActiva(),
      limiteLongitud: 900,
      objetivoPedagogico: 'Practicar narraciÃ³n, coherencia y expresiÃ³n creativa.',
      idioma: 'es-PE' as const,
    };
  }

  private guardarSugerencia(sugerencia: SugerenciaPaginaCuento): void {
    this.actualizarPaginaActiva((pagina) => ({ ...pagina, sugerencia }));
  }

  private establecerError(error: ErrorCuento): void {
    this.estadoPersistencia.set({ tipo: 'error-guardado', error });
  }

  private requerirCuentoId(): string {
    const id = this.cuentoId();
    if (!id) throw new ErrorCuento('DATOS_INVALIDOS', 'Falta el identificador del cuento.', false);
    return id;
  }

  private requerirAudiencia(): AudienciaCuento {
    if (!this.audiencia) throw new ErrorCuento('NO_AUTORIZADO', 'No se pudo determinar la audiencia.', false);
    return this.audiencia;
  }

  private reemplazarPreview(destino: { (): string | null; set(valor: string | null): void }, blob: Blob | null): void {
    this.revocarPreview(destino());
    destino.set(blob ? URL.createObjectURL(blob) : null);
  }

  private revocarPreview(url: string | null): void {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
  }

  private async limpiarReferenciasReemplazadas(): Promise<void> {
    const pendientes = [...this.referenciasPendientesEliminar];
    this.referenciasPendientesEliminar.clear();
    const cuentoId = this.requerirCuentoId();
    await Promise.allSettled(pendientes.map((referencia) => this.activos.eliminarActivo(cuentoId, referencia)));
  }

  private escaparHtml(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }
}
