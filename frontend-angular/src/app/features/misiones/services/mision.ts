import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

export type EstadoEntregaMision = 'pendiente' | 'aprobado' | 'rechazado';

export interface EntregaMision {
  id: number;
  id_desafio: number;
  id_alumno: number;
  archivo_url?: string | null;
  estado: EstadoEntregaMision;
  calificacion?: number | null;
  fecha_entrega?: string | null;
  fecha_revision?: string | null;
  comentario_docente?: string | null;
}

export interface MisionAlumno {
  id: number;
  titulo: string;
  descripcion?: string | null;
  recompensa: number;
  tipo_evidencia: string;
  nivel_requerido: string;
  estado: string;
  fecha_creacion?: string | null;
  es_mision_nivel?: boolean;
  entrega?: EntregaMision | null;
}

export interface DetalleMisionRespuesta {
  mision: MisionAlumno;
  entrega: EntregaMision | null;
}

@Injectable({
  providedIn: 'root',
})
export class Mision {
  constructor(private api: Api) {}
  listar() { return this.api.get<MisionAlumno[]>('/misiones'); }
  detalle(id: number) { return this.api.get<DetalleMisionRespuesta>(`/misiones/${id}`); }
  crear(datos: unknown) { return this.api.post('/misiones', datos); }
  actualizar(id: number, datos: unknown) { return this.api.put(`/misiones/${id}`, datos); }
  eliminar(id: number) { return this.api.delete(`/misiones/${id}`); }
  entregar(id: number, datos: unknown) { return this.api.post<EntregaMision>(`/misiones/${id}/entregar`, datos); }
  entregas() { return this.api.get('/misiones/entregas'); }
  revisar(id: number, datos: unknown) { return this.api.post(`/misiones/entregas/${id}/revisar`, datos); }
}
