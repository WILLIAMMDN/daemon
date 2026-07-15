import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';
import { BienestarDigital, InvitacionFamiliar, LimitePantallaPayload, PanelFamiliasDto } from '../models/familias.model';

@Injectable({ providedIn: 'root' })
export class Familias {
  constructor(private readonly api: Api) {}

  panel(alumnoId?: number) {
    const query = alumnoId ? `?alumno_id=${alumnoId}` : '';
    return this.api.get<PanelFamiliasDto>(`/tutor/panel${query}`, { fresh: true });
  }

  invitaciones() {
    return this.api.get<{ invitaciones: InvitacionFamiliar[] }>('/tutor/invitaciones', { fresh: true });
  }

  aceptarInvitacion(consentimientoId: number, parentesco: 'madre' | 'padre' | 'tutor') {
    return this.api.post<{ message: string; alumno_id: number }>(
      `/tutor/invitaciones/${consentimientoId}/aceptar`,
      { parentesco },
    );
  }

  actualizarLimite(alumnoId: number, payload: LimitePantallaPayload) {
    return this.api.put<{ bienestar_digital: BienestarDigital }>(
      `/tutor/alumnos/${alumnoId}/limite-pantalla`,
      payload,
    );
  }
}
