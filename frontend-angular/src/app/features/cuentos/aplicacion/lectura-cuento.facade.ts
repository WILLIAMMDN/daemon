import { Injectable, inject, signal } from '@angular/core';
import { reportarError } from '../../../core/servicios/observabilidad';
import { FirebaseAuth } from '../../../core/servicios/firebase-auth';
import { Sesion } from '../../../core/servicios/sesion';
import { ACTIVOS_CUENTO_REPOSITORIO } from '../acceso-datos/activos-cuento.repositorio';
import { COMANDOS_CUENTO_GATEWAY } from '../acceso-datos/comandos-cuento.gateway';
import { CUENTO_REPOSITORIO, CursorCuentos } from '../acceso-datos/cuento.repositorio';
import { ComentarioCuento } from '../dominio/comentario-cuento.modelo';
import { normalizarErrorCuento } from '../dominio/errores-cuento';
import { TIPOS_REACCION_CUENTO, TipoReaccionCuento, esTipoReaccionCuento } from '../dominio/reaccion-cuento.modelo';
import { ComentarioCuentoVista, CuentoDetalleVista } from '../presentacion/cuento-detalle-vista.modelo';
import { AsistenteLecturaCuento } from './asistente-lectura-cuento';
import { ComentarCuentoCasoUso } from './comentar-cuento.caso-uso';
import { ReaccionarCuentoCasoUso } from './reaccionar-cuento.caso-uso';

@Injectable()
export class LecturaCuentoFacade {
  private readonly repositorio = inject(CUENTO_REPOSITORIO);
  private readonly comentar = inject(ComentarCuentoCasoUso);
  private readonly reaccionarCasoUso = inject(ReaccionarCuentoCasoUso);
  private readonly asistente = inject(AsistenteLecturaCuento);
  private readonly activos = inject(ACTIVOS_CUENTO_REPOSITORIO);
  private readonly comandos = inject(COMANDOS_CUENTO_GATEWAY);
  private readonly firebaseAuth = inject(FirebaseAuth);
  private readonly sesion = inject(Sesion);

  readonly datos = signal<CuentoDetalleVista | null>(null);
  readonly comentarios = signal<ComentarioCuentoVista[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly esPropietario = signal(false);
  readonly miUid = signal<string | null>(null);
  readonly enviandoComentario = signal(false);
  readonly cargandoMasComentarios = signal(false);
  readonly hayMasComentarios = signal(false);
  readonly tipAsistente = signal('Leyendo la historia…');
  readonly miReaccion = signal<TipoReaccionCuento | null>(null);
  readonly reaccionando = signal(false);
  readonly reaccionesCount = signal<Record<TipoReaccionCuento, number>>(this.conteosVacios());
  readonly comentariosCount = signal(0);

  private cuentoId = '';
  private cursorComentarios: CursorCuentos | null = null;

  async cargar(id: string): Promise<void> {
    if (!id) {
      this.error.set('ID de cuento no válido.');
      this.cargando.set(false);
      return;
    }
    this.cuentoId = id;
    try {
      const uid = await this.uidOpcional();
      this.miUid.set(uid);
      const detalle = await this.repositorio.obtenerDetalle(id);
      this.esPropietario.set(uid !== null && detalle.cuento.autorUid === uid);
      this.datos.set({
        cuento: {
          id: detalle.cuento.id,
          titulo: detalle.version.titulo,
          descripcion: detalle.version.sinopsis,
          portada: detalle.version.portadaRef ?? detalle.cuento.portadaRef,
          categoria: detalle.version.categoria,
          rango_edad: detalle.version.rangoEdad,
          tiempo_lectura: detalle.version.tiempoLecturaMinutos,
          fecha_creacion: detalle.cuento.publicadoEn?.milisegundos ?? detalle.cuento.creadoEn.milisegundos,
          paginas: detalle.paginas.map((pagina) => ({
            id: pagina.id,
            contenido: pagina.contenido,
            colorFondo: pagina.fondoToken,
            ilustracion: pagina.ilustracionRef,
            textoAlternativo: pagina.textoAlternativo,
          })),
          contenido: detalle.paginas[0]?.contenido ?? '',
        },
        autor: {
          nombre_completo: detalle.cuento.autor?.nombre
            || (this.esPropietario()
              ? this.sesion.usuario()?.nombre_completo || this.sesion.usuario()?.usuario
              : null)
            || 'Autor DAEMON',
          avatar: this.activos.resolverUrl(
            detalle.cuento.autor?.avatarRef
              ?? (this.esPropietario() ? this.sesion.usuario()?.avatar ?? null : null),
          ) || null,
        },
        autorUid: detalle.cuento.autorUid,
      });
      // El cuento ya está listo: se muestra de inmediato. Comentarios,
      // reacciones y el tip IA cargan en paralelo SIN bloquear la lectura
      // (el tip va por HTTP y puede tardar o fallar; la historia no espera).
      this.cargando.set(false);
      void Promise.allSettled([
        this.cargarComentarios(),
        this.cargarReacciones(),
        this.generarTip(detalle.version.titulo, detalle.cuento.audiencia),
      ]);
    } catch (error) {
      this.error.set(normalizarErrorCuento(error).message);
      this.cargando.set(false);
    }
  }

  /**
   * UID de Firebase si hay sesión activa; si no, null. La identidad real
   * del usuario la resuelve Laravel por Sanctum; el UID aquí solo sirve
   * para marcar comentarios y propiedad en la UI.
   */
  private async uidOpcional(): Promise<string | null> {
    try {
      return await this.firebaseAuth.uidActual();
    } catch {
      return null;
    }
  }

  async cargarComentarios(mas = false): Promise<void> {
    if (mas && (!this.cursorComentarios || this.cargandoMasComentarios())) return;
    this.cargandoMasComentarios.set(mas);
    try {
      const pagina = await this.repositorio.listarComentarios(
        this.cuentoId,
        mas ? this.cursorComentarios ?? undefined : undefined,
        20,
      );
      const nuevos = pagina.elementos.map((comentario) => this.mapearComentario(comentario));
      this.comentarios.update((actuales) => mas ? this.sinDuplicados([...actuales, ...nuevos]) : nuevos);
      this.cursorComentarios = pagina.siguienteCursor;
      this.hayMasComentarios.set(Boolean(pagina.siguienteCursor));
    } catch (error) {
      // Los comentarios no bloquean la lectura: un fallo aquí solo deja la
      // sección vacía y se registra para diagnóstico.
      reportarError(error, { area: 'cuentos-lectura-comentarios', recuperable: true });
    } finally {
      this.cargandoMasComentarios.set(false);
    }
  }

  async enviarComentario(cuerpo: string): Promise<void> {
    if (this.enviandoComentario()) return;
    this.enviandoComentario.set(true);
    try {
      const comentario = await this.comentar.ejecutar(this.cuentoId, cuerpo);
      this.comentarios.update((actuales) => this.sinDuplicados([...actuales, this.mapearComentario(comentario)]));
      await this.cargarEstadisticas();
    } catch (error) {
      this.error.set(normalizarErrorCuento(error).message);
    } finally {
      this.enviandoComentario.set(false);
    }
  }

  async editarComentario(id: string, cuerpo: string): Promise<void> {
    try {
      const comentario = await this.comentar.editar(this.cuentoId, id, cuerpo);
      const vista = this.mapearComentario(comentario);
      this.comentarios.update((actuales) => actuales.map((actual) => actual.id === id ? vista : actual));
    } catch (error) {
      this.error.set(normalizarErrorCuento(error).message);
    }
  }

  async eliminarComentario(id: string): Promise<void> {
    try {
      await this.comentar.eliminar(this.cuentoId, id);
      this.comentarios.update((actuales) => actuales.filter((comentario) => comentario.id !== id));
      await this.cargarEstadisticas();
    } catch (error) {
      this.error.set(normalizarErrorCuento(error).message);
    }
  }

  async reaccionar(tipoCrudo: string): Promise<void> {
    if (!esTipoReaccionCuento(tipoCrudo) || this.reaccionando()) return;
    const tipo = this.miReaccion() === tipoCrudo ? null : tipoCrudo;
    this.reaccionando.set(true);
    try {
      await this.reaccionarCasoUso.ejecutar(this.cuentoId, tipo);
      await this.cargarEstadisticas();
    } catch (error) {
      this.error.set(normalizarErrorCuento(error).message);
    } finally {
      this.reaccionando.set(false);
    }
  }

  private async cargarReacciones(): Promise<void> {
    await this.cargarEstadisticas();
  }

  private async cargarEstadisticas(): Promise<void> {
    try {
      const estadisticas = await this.comandos.obtenerEstadisticas(this.cuentoId);
      this.comentariosCount.set(estadisticas.comentarios);
      this.miReaccion.set(estadisticas.reacciones.propia);
      this.reaccionesCount.set({ ...estadisticas.reacciones.porTipo });
    } catch (error) {
      reportarError(error, { area: 'cuentos-lectura-estadisticas', recuperable: true });
    }
  }

  private async generarTip(titulo: string, audiencia: 'KIDS' | 'TEENS'): Promise<void> {
    try {
      this.tipAsistente.set(await this.asistente.generarTip(titulo, audiencia));
    } catch {
      this.tipAsistente.set('Fíjate en los detalles de la historia y en lo que te hacen sentir.');
    }
  }

  private mapearComentario(comentario: ComentarioCuento): ComentarioCuentoVista {
    const esMio = comentario.autorUid === this.miUid();
    return {
      id: comentario.id,
      contenido: comentario.cuerpo,
      autor_id: comentario.autorUid,
      autor_nombre: esMio
        ? this.sesion.usuario()?.nombre_completo || this.sesion.usuario()?.usuario || 'Tú'
        : 'Miembro DAEMON',
      avatar: esMio ? this.activos.resolverUrl(this.sesion.usuario()?.avatar ?? null) || null : null,
      fecha_creacion: comentario.creadoEn.milisegundos,
    };
  }

  private sinDuplicados(comentarios: ComentarioCuentoVista[]): ComentarioCuentoVista[] {
    return [...new Map(comentarios.map((comentario) => [comentario.id, comentario])).values()];
  }

  private conteosVacios(): Record<TipoReaccionCuento, number> {
    return Object.fromEntries(
      TIPOS_REACCION_CUENTO.map((tipo) => [tipo, 0]),
    ) as Record<TipoReaccionCuento, number>;
  }
}
