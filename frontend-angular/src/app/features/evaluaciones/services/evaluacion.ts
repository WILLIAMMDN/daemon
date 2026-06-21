import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

@Injectable({
  providedIn: 'root',
})
export class Evaluacion {
  constructor(private api: Api) {}
  activas() { return this.api.get('/evaluaciones/activas'); }
  responder(id: number, respuestas: unknown) { return this.api.post(`/evaluaciones/${id}/responder`, { respuestas }); }
  resultados() { return this.api.get('/evaluaciones/resultados'); }
  listarDocente() { return this.api.get('/evaluaciones'); }
  crear(datos: unknown) { return this.api.post('/evaluaciones', datos); }
  actualizar(id: number, datos: unknown) { return this.api.put(`/evaluaciones/${id}`, datos); }
  eliminar(id: number) { return this.api.delete(`/evaluaciones/${id}`); }
  guardarPreguntas(id: number, preguntas: unknown[]) { return this.api.post(`/evaluaciones/${id}/preguntas`, { preguntas }); }
}
