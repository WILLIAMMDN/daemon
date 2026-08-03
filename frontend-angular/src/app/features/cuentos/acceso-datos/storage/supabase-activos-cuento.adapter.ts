import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Api } from '../../../../core/servicios/api';
import { Activos } from '../../../../core/servicios/activos';
import { crearClaveIdempotencia } from '../../aplicacion/identificadores-cuento';
import { normalizarErrorCuento } from '../../dominio/errores-cuento';
import { CuentosImagenService } from '../../services/cuentos-imagen.service';
import { ActivosCuentoRepositorio } from '../activos-cuento.repositorio';

interface RespuestaActivo {
  readonly referencia: string;
  readonly url_lectura: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseActivosCuentoAdapter implements ActivosCuentoRepositorio {
  private readonly api = inject(Api);
  private readonly activos = inject(Activos);
  private readonly imagenes = inject(CuentosImagenService);
  private readonly urlsTemporales = new Map<string, string>();

  subirPortada(cuentoId: string, archivo: File | Blob): Promise<string> {
    return this.subir(cuentoId, archivo, 'portada', null);
  }

  subirIlustracion(cuentoId: string, paginaId: string, archivo: File | Blob): Promise<string> {
    return this.subir(cuentoId, archivo, 'ilustracion', paginaId);
  }

  async eliminarActivo(cuentoId: string, referencia: string | null): Promise<void> {
    if (!referencia?.startsWith('storage://')) return;
    try {
      await firstValueFrom(this.api.post(
        `/cuentos-v2/${encodeURIComponent(cuentoId)}/activos/eliminacion`,
        { referencia },
      ));
      this.urlsTemporales.delete(referencia);
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async obtenerUrlLectura(cuentoId: string, referencia: string | null): Promise<string> {
    if (!referencia) return '';
    if (!referencia.startsWith('storage://')) return this.activos.url(referencia);
    const cache = this.urlsTemporales.get(referencia);
    if (cache) return cache;
    try {
      const respuesta = await firstValueFrom(this.api.get<{ url_lectura: string }>(
        `/cuentos-v2/${encodeURIComponent(cuentoId)}/activos/url?referencia=${encodeURIComponent(referencia)}`,
        { fresh: true },
      ));
      this.urlsTemporales.set(referencia, respuesta.url_lectura);
      return respuesta.url_lectura;
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  validarArchivo(archivo: File): Promise<string | null> {
    return Promise.resolve(this.imagenes.validarImagen(archivo));
  }

  async limpiarActivosHuerfanos(cuentoId: string, referencias: readonly string[]): Promise<void> {
    const privadas = referencias.filter((referencia) => referencia.startsWith('storage://'));
    if (privadas.length === 0) return;
    try {
      await firstValueFrom(this.api.post(
        `/cuentos-v2/${encodeURIComponent(cuentoId)}/activos/limpieza`,
        { referencias: privadas },
      ));
      privadas.forEach((referencia) => this.urlsTemporales.delete(referencia));
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  resolverUrl(referencia: string | null): string {
    if (!referencia) return '';
    return referencia.startsWith('storage://')
      ? this.urlsTemporales.get(referencia) ?? ''
      : this.activos.url(referencia);
  }

  private async subir(
    cuentoId: string,
    archivo: File | Blob,
    tipo: 'portada' | 'ilustracion',
    paginaId: string | null,
  ): Promise<string> {
    const datos = new FormData();
    datos.append('archivo', archivo, 'imagen.webp');
    datos.append('tipo', tipo);
    if (paginaId) datos.append('pagina_id', paginaId);
    datos.append('idempotencia', crearClaveIdempotencia(`activo_${tipo}`));
    try {
      const respuesta = await firstValueFrom(
        this.api.post<RespuestaActivo>(`/cuentos-v2/${encodeURIComponent(cuentoId)}/activos`, datos),
      );
      this.urlsTemporales.set(respuesta.referencia, respuesta.url_lectura);
      return respuesta.referencia;
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }
}
