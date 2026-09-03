import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';
import {
  AlumnoDocente,
  Aula,
  DocenteUsuario,
  Insignia,
  MovimientoToken,
  RespuestaLista,
} from '../../../core/modelos/dto';

@Injectable({
  providedIn: 'root',
})
export class Docente {
  constructor(private api: Api) {}
  panel() { return this.api.get('/docente/panel'); }
  alumnos() { return this.api.get<RespuestaLista<AlumnoDocente>>('/docente/alumnos'); }
  docentes() { return this.api.get<RespuestaLista<DocenteUsuario>>('/docente/docentes'); }
  aulas() { return this.api.get<RespuestaLista<Aula>>('/docente/aulas'); }
  crearAula(datos: unknown) { return this.api.post('/docente/aulas', datos); }
  actualizarAula(id: number, datos: unknown) { return this.api.put(`/docente/aulas/${id}`, datos); }
  eliminarAula(id: number) { return this.api.delete(`/docente/aulas/${id}`); }
  asignarAulaUsuario(idUsuario: number, datos: unknown) { return this.api.patch(`/docente/usuarios/${idUsuario}/aula`, datos); }
  asignarTokens(datos: unknown) { return this.api.post('/docente/tokens', datos); }
  historialTokens() { return this.api.get<MovimientoToken[]>('/docente/historial-tokens'); }
  insignias() { return this.api.get<RespuestaLista<Insignia>>('/docente/insignias'); }
  crearInsignia(datos: unknown) { return this.api.post('/docente/insignias', datos); }
  actualizarInsignia(id: number, datos: unknown) { 
    if (datos instanceof FormData) {
      datos.append('_method', 'PUT');
      return this.api.post(`/docente/insignias/${id}`, datos);
    }
    return this.api.put(`/docente/insignias/${id}`, datos); 
  }
  eliminarInsignia(id: number) { return this.api.delete(`/docente/insignias/${id}`); }
  asignarInsignia(datos: unknown) { return this.api.post('/docente/insignias/asignar', datos); }
  revisiones(filtros?: { estado?: string; id_curso?: number; id_aula?: number }) {
    const params: Record<string, string | number> = {};
    if (filtros?.estado) params['estado'] = filtros.estado;
    if (filtros?.id_curso) params['id_curso'] = filtros.id_curso;
    if (filtros?.id_aula) params['id_aula'] = filtros.id_aula;
    return this.api.get<{ data: any[] }>('/academico/revisiones', params);
  }
  detalleRevision(intentoId: number) {
    return this.api.get<{ data: any }>(`/academico/revisiones/${intentoId}`);
  }
  evaluarIntento(intentoId: number, datos: { aprobado: boolean; puntaje?: number | null; comentario?: string | null; criterios?: Record<string, string> | null }) {
    return this.api.post<{ data: any }>(`/academico/intentos/${intentoId}/evaluar`, datos);
  }
}
