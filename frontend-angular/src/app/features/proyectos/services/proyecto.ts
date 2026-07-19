import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/servicios/api';
import { ProyectosResponse } from '../models/proyecto.models';

@Injectable({ providedIn: 'root' })
export class Proyecto {
  private readonly api = inject(Api);

  catalogo(fresh = false) {
    return this.api.get<ProyectosResponse>('/alumno/proyectos', { fresh });
  }
}
