import { Injectable, computed, inject, signal } from '@angular/core';
import { ACTIVOS_CUENTO_REPOSITORIO } from '../acceso-datos/activos-cuento.repositorio';
import { CUENTO_REPOSITORIO, CursorCuentos } from '../acceso-datos/cuento.repositorio';
import { Cuento } from '../dominio/cuento.modelo';
import { normalizarErrorCuento } from '../dominio/errores-cuento';
import { EliminarCuentoCasoUso } from './eliminar-cuento.caso-uso';

@Injectable()
export class GaleriaCuentosFacade {
  private readonly repositorio = inject(CUENTO_REPOSITORIO);
  private readonly activos = inject(ACTIVOS_CUENTO_REPOSITORIO);
  private readonly eliminarCuento = inject(EliminarCuentoCasoUso);

  /** Cuentos publicados de la comunidad (lectura pública). */
  readonly cuentos = signal<readonly Cuento[]>([]);
  /** Cuentos del propio usuario (borradores y publicados). */
  readonly propios = signal<readonly Cuento[]>([]);
  readonly cargando = signal(true);
  readonly cargandoPropios = signal(false);
  readonly refrescando = signal(false);
  readonly error = signal('');
  readonly datosConservados = signal(false);
  readonly reaccionesPropiasTotal = signal(0);
  readonly hayMas = computed(() => this.cursor() !== null);
  private readonly cursor = signal<CursorCuentos | null>(null);
  private propiosCargados = false;

  /**
   * Carga la galería de la comunidad (una sola lectura de Firestore). Los
   * cuentos propios NO se mezclan aquí: se cargan aparte con cargarPropios()
   * cuando el usuario abre "Mis historias", para que la vista principal sea
   * rápida y solo muestre lo publicado por los demás.
   */
  async cargar(refrescar = false): Promise<void> {
    const conservaDatos = this.cuentos().length > 0;
    this.cargando.set(!conservaDatos);
    this.refrescando.set(conservaDatos);
    this.error.set('');
    try {
      const galeria = await this.repositorio.listarGaleria(undefined, 24);
      this.cuentos.set(galeria.elementos);
      this.cursor.set(galeria.siguienteCursor);
      this.datosConservados.set(false);
    } catch (error) {
      this.datosConservados.set(conservaDatos);
      this.error.set(normalizarErrorCuento(error).message);
    } finally {
      this.cargando.set(false);
      this.refrescando.set(false);
    }
  }

  /**
   * Carga los cuentos propios bajo demanda (tab "Mis historias"). Es
   * idempotente: solo hace la lectura la primera vez. Si no hay sesión de
   * Firebase, devuelve vacío sin lanzar (login local con usuario/contraseña).
   */
  async cargarPropios(refrescar = false): Promise<void> {
    if (this.propiosCargados && !refrescar) return;
    this.cargandoPropios.set(true);
    this.error.set('');
    try {
      const propios = await this.repositorio.listarPropios(50);
      this.propios.set(propios);
      this.propiosCargados = true;
      this.reaccionesPropiasTotal.set(propios.reduce(
        (total, cuento) => total + (cuento.estadisticas.reacciones ?? 0),
        0,
      ));
    } catch (error) {
      this.error.set(normalizarErrorCuento(error).message);
    } finally {
      this.cargandoPropios.set(false);
    }
  }

  async cargarMas(): Promise<void> {
    const cursor = this.cursor();
    if (!cursor || this.refrescando()) return;
    this.refrescando.set(true);
    try {
      const pagina = await this.repositorio.listarGaleria(cursor, 24);
      const porId = new Map(this.cuentos().map((cuento) => [cuento.id, cuento]));
      pagina.elementos.forEach((cuento) => porId.set(cuento.id, cuento));
      this.cuentos.set([...porId.values()]);
      this.cursor.set(pagina.siguienteCursor);
    } catch (error) {
      this.error.set(normalizarErrorCuento(error).message);
    } finally {
      this.refrescando.set(false);
    }
  }

  async eliminar(id: string): Promise<boolean> {
    try {
      await this.eliminarCuento.ejecutar(id);
      this.cuentos.update((actuales) => actuales.filter((cuento) => cuento.id !== id));
      this.propios.update((actuales) => actuales.filter((cuento) => cuento.id !== id));
      return true;
    } catch (error) {
      this.error.set(normalizarErrorCuento(error).message);
      return false;
    }
  }

  resolverActivo(referencia: string | null): string {
    return this.activos.resolverUrl(referencia);
  }
}
