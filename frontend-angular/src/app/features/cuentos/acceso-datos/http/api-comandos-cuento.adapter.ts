import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Api } from '../../../../core/servicios/api';
import { reportarError } from '../../../../core/servicios/observabilidad';
import { ComentarioCuento } from '../../dominio/comentario-cuento.modelo';
import { VERSION_ESQUEMA_CUENTO } from '../../dominio/cuento.modelo';
import { ErrorCuento, normalizarErrorCuento } from '../../dominio/errores-cuento';
import {
  TIPOS_REACCION_CUENTO,
  TipoReaccionCuento,
  esTipoReaccionCuento,
} from '../../dominio/reaccion-cuento.modelo';
import {
  ComandosCuentoGateway,
  EstadisticasInteraccionCuento,
  ResultadoComandoCuento,
} from '../comandos-cuento.gateway';

interface RespuestaComando {
  estado: 'en_revision' | 'eliminado';
  repetido?: boolean;
}

interface RespuestaComentario {
  id: string;
  cuento_id: string;
  autor_uid: string;
  cuerpo: string;
  estado: 'visible' | 'oculto' | 'eliminado' | 'spam';
  created_at_ms: number;
  updated_at_ms: number;
}

interface RespuestaEstadisticas {
  comentarios: number;
  reacciones: {
    total: number;
    propia: string | null;
    por_tipo: Record<string, number>;
  };
}

@Injectable({ providedIn: 'root' })
export class ApiComandosCuentoAdapter implements ComandosCuentoGateway {
  private readonly api = inject(Api);

  /**
   * Los cuentos legacy (v1, PostgreSQL) no viven en Firestore y no admiten
   * interacciones v2. Devuelve true para no llamar nunca a los endpoints v2
   * con un ID `legacy-*`, evitando errores 503 en la galería y la lectura.
   */
  private esLegacy(cuentoId: string): boolean {
    return cuentoId.startsWith('legacy-');
  }

  private noDisponibleLegacy(): never {
    throw new ErrorCuento(
      'OPERACION_NO_DISPONIBLE',
      'Las historias antiguas se pueden leer, pero no admiten comentarios ni reacciones en esta versión.',
      false,
    );
  }

  solicitarPublicacion(cuentoId: string, idempotencia: string): Promise<ResultadoComandoCuento> {
    if (this.esLegacy(cuentoId)) return Promise.reject(this.noDisponibleLegacy());
    return this.comando(`/cuentos-v2/${encodeURIComponent(cuentoId)}/publicacion`, idempotencia);
  }

  eliminar(cuentoId: string, idempotencia: string): Promise<ResultadoComandoCuento> {
    if (this.esLegacy(cuentoId)) return Promise.reject(this.noDisponibleLegacy());
    return this.comando(`/cuentos-v2/${encodeURIComponent(cuentoId)}/eliminacion`, idempotencia);
  }

  async comentar(cuentoId: string, cuerpo: string, idempotencia: string): Promise<ComentarioCuento> {
    if (this.esLegacy(cuentoId)) throw this.noDisponibleLegacy();
    try {
      const respuesta = await firstValueFrom(
        this.api.post<RespuestaComentario>(`/cuentos-v2/${encodeURIComponent(cuentoId)}/comentarios`, {
          cuerpo,
          idempotencia,
        }),
      );
      return this.mapearComentario(respuesta);
    } catch (error) {
      reportarError(error, { area: 'cuentos-comandos', recuperable: true });
      throw normalizarErrorCuento(error);
    }
  }

  async editarComentario(cuentoId: string, comentarioId: string, cuerpo: string): Promise<ComentarioCuento> {
    if (this.esLegacy(cuentoId)) throw this.noDisponibleLegacy();
    try {
      const respuesta = await firstValueFrom(
        this.api.patch<RespuestaComentario>(
          `/cuentos-v2/${encodeURIComponent(cuentoId)}/comentarios/${encodeURIComponent(comentarioId)}`,
          { cuerpo },
        ),
      );
      return this.mapearComentario(respuesta);
    } catch (error) {
      reportarError(error, { area: 'cuentos-comandos', recuperable: true });
      throw normalizarErrorCuento(error);
    }
  }

  async eliminarComentario(cuentoId: string, comentarioId: string): Promise<void> {
    if (this.esLegacy(cuentoId)) throw this.noDisponibleLegacy();
    try {
      await firstValueFrom(
        this.api.delete<void>(
          `/cuentos-v2/${encodeURIComponent(cuentoId)}/comentarios/${encodeURIComponent(comentarioId)}`,
        ),
      );
    } catch (error) {
      reportarError(error, { area: 'cuentos-comandos', recuperable: true });
      throw normalizarErrorCuento(error);
    }
  }

  async reaccionar(
    cuentoId: string,
    tipo: TipoReaccionCuento | null,
    idempotencia: string,
  ): Promise<void> {
    if (this.esLegacy(cuentoId)) throw this.noDisponibleLegacy();
    try {
      await firstValueFrom(
        this.api.post(`/cuentos-v2/${encodeURIComponent(cuentoId)}/reaccion`, { tipo, idempotencia }),
      );
    } catch (error) {
      reportarError(error, { area: 'cuentos-comandos', recuperable: true });
      throw normalizarErrorCuento(error);
    }
  }

  async obtenerEstadisticas(cuentoId: string): Promise<EstadisticasInteraccionCuento> {
    if (this.esLegacy(cuentoId)) {
      // Las historias antiguas no tienen interacciones en Firestore; se
      // devuelven contadores en cero sin llamar al servidor.
      const porTipo = Object.fromEntries(
        TIPOS_REACCION_CUENTO.map((tipo) => [tipo, 0]),
      ) as Record<TipoReaccionCuento, number>;
      return { comentarios: 0, reacciones: { total: 0, propia: null, porTipo } };
    }
    try {
      const respuesta = await firstValueFrom(
        this.api.get<RespuestaEstadisticas>(
          `/cuentos-v2/${encodeURIComponent(cuentoId)}/estadisticas`,
          { fresh: true },
        ),
      );
      if (!Number.isInteger(respuesta.comentarios) || respuesta.comentarios < 0
        || !Number.isInteger(respuesta.reacciones?.total) || respuesta.reacciones.total < 0
        || (respuesta.reacciones.propia !== null && !esTipoReaccionCuento(respuesta.reacciones.propia))) {
        throw new ErrorCuento('DATOS_INVALIDOS', 'El servidor devolviÃ³ contadores invÃ¡lidos.', false);
      }
      const porTipo = Object.fromEntries(TIPOS_REACCION_CUENTO.map((tipo) => {
        const cantidad = respuesta.reacciones.por_tipo?.[tipo];
        if (!Number.isInteger(cantidad) || cantidad < 0) {
          throw new ErrorCuento('DATOS_INVALIDOS', 'El servidor devolviÃ³ reacciones invÃ¡lidas.', false);
        }
        return [tipo, cantidad] as const;
      })) as Record<TipoReaccionCuento, number>;
      return {
        comentarios: respuesta.comentarios,
        reacciones: {
          total: respuesta.reacciones.total,
          propia: respuesta.reacciones.propia as TipoReaccionCuento | null,
          porTipo,
        },
      };
    } catch (error) {
      reportarError(error, { area: 'cuentos-comandos', recuperable: true });
      throw normalizarErrorCuento(error);
    }
  }

  private async comando(ruta: string, idempotencia: string): Promise<ResultadoComandoCuento> {
    try {
      const respuesta = await firstValueFrom(this.api.post<RespuestaComando>(ruta, { idempotencia }));
      return { estado: respuesta.estado, repetido: respuesta.repetido === true };
    } catch (error) {
      reportarError(error, { area: 'cuentos-comandos', recuperable: true });
      throw normalizarErrorCuento(error);
    }
  }

  private mapearComentario(respuesta: RespuestaComentario): ComentarioCuento {
    if (!respuesta.id || !respuesta.autor_uid || !Number.isFinite(respuesta.created_at_ms)) {
      throw new ErrorCuento('DATOS_INVALIDOS', 'El servidor devolvió un comentario inválido.', false);
    }
    return {
      id: respuesta.id,
      cuentoId: respuesta.cuento_id,
      autorUid: respuesta.autor_uid,
      cuerpo: respuesta.cuerpo,
      estado: respuesta.estado,
      creadoEn: { milisegundos: respuesta.created_at_ms },
      actualizadoEn: { milisegundos: respuesta.updated_at_ms },
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    };
  }
}
