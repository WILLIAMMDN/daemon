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
}
