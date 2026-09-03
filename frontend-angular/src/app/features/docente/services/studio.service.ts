import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/servicios/api';
import {
  BorradorPayload,
  CatalogoStudio,
  CursoResponse,
  CursosResponse,
  ExperienciaPayload,
  HitoPayload,
  MetadatosVersionPayload,
  ValidacionVersion,
  VersionDetalle,
} from '../models/studio.model';

/**
 * Único punto de acceso de Studio a la API canónica de autoría.
 *
 * Es deliberadamente un cliente delgado: no valida rutas de aprendizaje, no
 * detecta ciclos, no decide si una versión puede publicarse y no reconstruye
 * el árbol del curso. Todo eso vive en el backend, que es la misma superficie
 * que consumirá un futuro adaptador MCP.
 */
@Injectable({ providedIn: 'root' })
export class Studio {
  private readonly api = inject(Api);

  catalogo(fresh = false): Observable<CatalogoStudio> {
    return this.api.get<CatalogoStudio>('/academico/studio/catalogo', { fresh });
  }

  cursos(fresh = true): Observable<CursosResponse> {
    return this.api.get<CursosResponse>('/academico/studio/cursos', { fresh });
  }

  curso(cursoId: number, fresh = true): Observable<CursoResponse> {
    return this.api.get<CursoResponse>(`/academico/studio/cursos/${cursoId}`, { fresh });
  }

  version(versionId: number, fresh = true): Observable<VersionDetalle> {
    return this.api.get<VersionDetalle>(`/academico/studio/versiones/${versionId}`, { fresh });
  }

  validacion(versionId: number): Observable<ValidacionVersion> {
    return this.api.get<ValidacionVersion>(`/academico/studio/versiones/${versionId}/validacion`, { fresh: true });
  }

  crearBorrador(versionId: number, datos: BorradorPayload = {}): Observable<VersionDetalle> {
    return this.api.post<VersionDetalle>(`/academico/studio/versiones/${versionId}/borrador`, datos);
  }

  publicar(versionId: number): Observable<VersionDetalle> {
    return this.api.post<VersionDetalle>(`/academico/studio/versiones/${versionId}/publicacion`, {});
  }

  /* --- Autoría fina sobre los contratos canónicos de /academico --- */

  actualizarMetadatos(versionId: number, datos: MetadatosVersionPayload): Observable<unknown> {
    return this.api.put(`/academico/versiones/${versionId}`, datos);
  }

  crearHito(rutaId: number, datos: HitoPayload): Observable<unknown> {
    return this.api.post(`/academico/rutas/${rutaId}/hitos`, datos);
  }

  actualizarHito(hitoId: number, datos: HitoPayload): Observable<unknown> {
    return this.api.put(`/academico/hitos/${hitoId}`, datos);
  }

  eliminarHito(hitoId: number): Observable<unknown> {
    return this.api.delete(`/academico/hitos/${hitoId}`);
  }

  prerrequisitos(hitoId: number, prerrequisitos: readonly number[]): Observable<unknown> {
    return this.api.put(`/academico/hitos/${hitoId}/prerrequisitos`, { prerrequisitos });
  }

  crearExperiencia(hitoId: number, datos: ExperienciaPayload): Observable<unknown> {
    return this.api.post(`/academico/hitos/${hitoId}/experiencias`, datos);
  }

  actualizarExperiencia(experienciaId: number, datos: ExperienciaPayload): Observable<unknown> {
    return this.api.put(`/academico/experiencias/${experienciaId}`, datos);
  }

  eliminarExperiencia(experienciaId: number): Observable<unknown> {
    return this.api.delete(`/academico/experiencias/${experienciaId}`);
  }

  objetivosDeExperiencia(experienciaId: number, objetivos: readonly number[]): Observable<unknown> {
    return this.api.put(`/academico/experiencias/${experienciaId}/objetivos`, { objetivos });
  }
}
