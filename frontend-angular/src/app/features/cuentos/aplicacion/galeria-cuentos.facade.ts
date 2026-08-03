import { Injectable, computed, inject, signal } from '@angular/core';
import { ACTIVOS_CUENTO_REPOSITORIO } from '../acceso-datos/activos-cuento.repositorio';
import { COMANDOS_CUENTO_GATEWAY } from '../acceso-datos/comandos-cuento.gateway';
import { CUENTO_REPOSITORIO, CursorCuentos } from '../acceso-datos/cuento.repositorio';
import { Cuento } from '../dominio/cuento.modelo';
import { normalizarErrorCuento } from '../dominio/errores-cuento';
import { EliminarCuentoCasoUso } from './eliminar-cuento.caso-uso';

@Injectable()
export class GaleriaCuentosFacade {
  private readonly repositorio = inject(CUENTO_REPOSITORIO);
  private readonly activos = inject(ACTIVOS_CUENTO_REPOSITORIO);
  private readonly eliminarCuento = inject(EliminarCuentoCasoUso);
  private readonly comandos = inject(COMANDOS_CUENTO_GATEWAY);

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
      const [galeria, propios] = await Promise.all([
        this.repositorio.listarGaleria(undefined, 24),
        this.repositorio.listarPropios(20),
      ]);
      const porId = new Map(galeria.elementos.map((cuento) => [cuento.id, cuento]));
      propios.forEach((cuento) => porId.set(cuento.id, cuento));
      this.cuentos.set([...porId.values()]);
      this.propios.set(propios);
      void this.cargarReaccionesPropias(propios);
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

  private async cargarReaccionesPropias(cuentos: readonly Cuento[]): Promise<void> {
    const publicados = cuentos.filter((cuento) => cuento.estado === 'publicado');
    const resultados = await Promise.allSettled(
      publicados.map((cuento) => this.comandos.obtenerEstadisticas(cuento.id)),
    );
    this.reaccionesPropiasTotal.set(resultados.reduce((total, resultado) =>
      resultado.status === 'fulfilled' ? total + resultado.value.reacciones.total : total, 0));
  }
}
