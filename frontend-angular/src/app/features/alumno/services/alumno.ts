import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Api } from '../../../core/servicios/api';
import { UsuarioSesion } from '../../../core/servicios/sesion';
import { PanelAlumnoDto } from '../models/panel-alumno.model';
import {
  AgendaResponse,
  HomeContextResponse,
  LearningContextResponse,
  LearningMapResponse,
  RutaAprendizajeItemDto,
} from '../models/contexto-alumno.model';

type UsuarioResourceRespuesta = UsuarioSesion | { data?: UsuarioSesion; usuario?: UsuarioSesion };

@Injectable({
  providedIn: 'root',
})
export class Alumno {
  constructor(private api: Api) {}

  panel(fresh = false): Observable<PanelAlumnoDto> {
    return this.api.get<PanelAlumnoDto>('/alumno/panel', { fresh });
  }

  homeContext(fresh = false): Observable<HomeContextResponse> {
    return this.api.get<HomeContextResponse>('/alumno/home-context', { fresh });
  }

  learningContext(fresh = false): Observable<LearningContextResponse> {
    return this.api.get<LearningContextResponse>('/alumno/learning-context', { fresh });
  }

  agenda(start: string, end: string, fresh = false): Observable<AgendaResponse> {
    return this.api.get<AgendaResponse>(`/alumno/agenda?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, { fresh });
  }

  mapa(fresh = false): Observable<LearningMapResponse> {
    return this.api.get<LearningMapResponse>('/alumno/aprender/mapa', { fresh });
  }

  rutas(fresh = false): Observable<RutaAprendizajeItemDto[]> {
    return this.api.get<RutaAprendizajeItemDto[]>('/alumno/rutas', { fresh });
  }

  ruta(idOrSlug: number | string, fresh = false): Observable<unknown> {
    return this.api.get<unknown>(`/alumno/rutas/${idOrSlug}`, { fresh });
  }

  siguiente(fresh = false): Observable<unknown> {
    return this.api.get<unknown>('/alumno/aprender/siguiente', { fresh });
  }

  perfil<T = unknown>(usuarioId?: number | string | null) {
    return this.api.get<T>(usuarioId ? `/alumno/perfil/${usuarioId}` : '/alumno/perfil');
  }

  actualizarPerfil(datos: unknown) {
    return this.api.post<UsuarioResourceRespuesta>('/alumno/perfil', datos).pipe(
      map((respuesta) => {
        const posible = respuesta as { data?: UsuarioSesion; usuario?: UsuarioSesion };
        return posible.usuario ?? posible.data ?? (respuesta as UsuarioSesion);
      }),
    );
  }

  comunidad<T = unknown>() {
    return this.api.get<T>('/comunidad');
  }
}
