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

  readonly cuentos = signal<readonly Cuento[]>([]);
  readonly propios = signal<readonly Cuento[]>([]);
  readonly cargando = signal(true);
  readonly refrescando = signal(false);
  readonly error = signal('');
  readonly datosConservados = signal(false);
  readonly reaccionesPropiasTotal = signal(0);
  readonly hayMas = computed(() => this.cursor() !== null);
  private readonly cursor = signal<CursorCuentos | null>(null);

  async cargar(refrescar = false): Promise<void> {
    const conservaDatos = this.cuentos().length > 0;
    this.cargando.set(!conservaDatos);
    this.refrescando.set(conservaDatos);
    this.error.set('');
    try {
      // Todo pasa por el API de Laravel: la galería pública y los cuentos
      // propios se leen sin depender de una sesión de Firebase activa.
      const [galeria, propios] = await Promise.all([
        this.repositorio.listarGaleria(undefined, 24),
        this.cargarPropiosSinFirebase(),
      ]);
      const porId = new Map(galeria.elementos.map((cuento) => [cuento.id, cuento]));
      propios.forEach((cuento) => porId.set(cuento.id, cuento));
      this.cuentos.set([...porId.values()]);
      this.propios.set(propios);
      // Los contadores de reacciones viajan en cada documento (stats), así
      // que no se hacen llamadas extra por cuento: la galería es una sola
      // lectura de Firestore.
      this.reaccionesPropiasTotal.set([...porId.values()].reduce(
        (total, cuento) => total + (cuento.estadisticas.reacciones ?? 0),
        0,
      ));
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
   * Carga los cuentos propios del usuario. Si no hay sesión de Firebase,
   * devuelve un array vacío en lugar de lanzar error. Esto permite que la
   * galería pública se muestre aunque el usuario no tenga sesión de Firebase
   * (login local con usuario/contraseña).
   */
  private async cargarPropiosSinFirebase(): Promise<readonly Cuento[]> {
    try {
      return await this.repositorio.listarPropios(20);
    } catch {
      return [];
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
