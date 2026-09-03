import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/servicios/api';
import {
  CohortesResponse,
  SesionCohorteDto,
  SesionPayload,
  SesionesCohorteResponse,
} from '../models/sesiones-cohorte.model';

/**
 * Único punto de acceso a la operación de sesiones en vivo del docente.
 *
 * Toda mutación viaja a los contratos canónicos del backend; el frontend no
 * mantiene ningún estado de calendario propio.
 */
@Injectable({ providedIn: 'root' })
export class SesionesCohorte {
  private readonly api = inject(Api);

  cohortes(fresh = false): Observable<CohortesResponse> {
    return this.api.get<CohortesResponse>('/academico/cohortes', { fresh });
  }

  sesiones(aulaId: number, rango?: { start?: string; end?: string }, fresh = true): Observable<SesionesCohorteResponse> {
    const parametros = new URLSearchParams();
    if (rango?.start) {
      parametros.set('start', rango.start);
    }
    if (rango?.end) {
      parametros.set('end', rango.end);
    }
    const consulta = parametros.toString();

    return this.api.get<SesionesCohorteResponse>(
      `/academico/aulas/${aulaId}/sesiones${consulta ? `?${consulta}` : ''}`,
      { fresh },
    );
  }

  crear(aulaId: number, datos: SesionPayload): Observable<unknown> {
    return this.api.post(`/academico/aulas/${aulaId}/sesiones`, datos);
  }

  actualizar(sesionId: number, datos: SesionPayload): Observable<unknown> {
    return this.api.put(`/academico/sesiones/${sesionId}`, datos);
  }

  /**
   * Cancelación canónica: el dominio no tiene endpoint propio, el estado
   * `cancelled` del contrato PUT es la semántica real. No se inventa nada.
   */
  cancelar(sesion: SesionCohorteDto): Observable<unknown> {
    return this.actualizar(sesion.id, {
      titulo: sesion.title,
      descripcion: sesion.description,
      inicio_at: sesion.startsAt,
      fin_at: sesion.endsAt,
      acceso_url: sesion.accessUrl,
      estado: 'cancelled',
    });
  }
}
