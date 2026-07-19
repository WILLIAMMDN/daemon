import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/servicios/api';
import { MascotaEstado } from '../models/mascota.models';

@Injectable({ providedIn: 'root' })
export class MascotaService {
  private readonly api = inject(Api);

  estado(fresh = false) {
    return this.api.get<MascotaEstado>('/mascota', { fresh });
  }

  actualizar(datos: { nombre?: string; id_especie?: number }) {
    return this.api.patch<MascotaEstado>('/mascota', datos);
  }

  equipar(idCosmetico: number) {
    return this.api.post<MascotaEstado>('/mascota/equipar', { id_cosmetico: idCosmetico });
  }

  quitar(slot: string) {
    return this.api.delete<MascotaEstado>(`/mascota/equipamiento/${slot}`);
  }
}
