import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

export interface PreguntaEvaluacion {
  id: number;
  examen_id: number;
  enunciado: string;
  tipo: string;
  opciones?: string[] | null;
  orden?: number;
}

export interface EvaluacionActiva {
  id: number;
  titulo: string;
  nivel: string;
  estado: string;
  fecha_creacion?: string | null;
  preguntas: PreguntaEvaluacion[];
}

export interface ResultadoRespuestaEvaluacion {
  resultado: ResultadoEvaluacion;
  correctas: number;
  total: number;
}

export interface ResultadoEvaluacion {
  id: number;
  alumno_id: number;
  examen_id: number;
  nivel: string;
  respuestas: string | Record<string, string>;
  puntaje: number;
  fecha_envio: string;
  titulo: string;
  alumno?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Evaluacion {
  constructor(private api: Api) {}
  activas() { return this.api.get<EvaluacionActiva[]>('/evaluaciones/activas'); }
  responder(id: number, respuestas: Record<string, string>) { return this.api.post<ResultadoRespuestaEvaluacion>(`/evaluaciones/${id}/responder`, { respuestas }); }
  resultados() { return this.api.get<ResultadoEvaluacion[]>('/evaluaciones/resultados'); }
  listarDocente() { return this.api.get('/evaluaciones'); }
  crear(datos: unknown) { return this.api.post('/evaluaciones', datos); }
  actualizar(id: number, datos: unknown) { return this.api.put(`/evaluaciones/${id}`, datos); }
  eliminar(id: number) { return this.api.delete(`/evaluaciones/${id}`); }
  guardarPreguntas(id: number, preguntas: unknown[]) { return this.api.post(`/evaluaciones/${id}/preguntas`, { preguntas }); }
  publicar(id: number) { return this.api.post(`/evaluaciones/${id}/publicar`, {}); }
  despublicar(id: number) { return this.api.post(`/evaluaciones/${id}/despublicar`, {}); }
}
