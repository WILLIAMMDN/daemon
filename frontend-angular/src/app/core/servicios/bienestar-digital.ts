import { Injectable } from '@angular/core';
import { Api } from './api';

export interface EstadoBienestarDigital {
  activo: boolean;
  bloqueado: boolean;
  motivo: 'horario_silencio' | 'limite_diario' | null;
  mensaje?: string | null;
  minutos_usados: number;
  max_minutos_diarios: number | null;
  minutos_restantes: number | null;
}

@Injectable({ providedIn: 'root' })
export class BienestarDigital {
  constructor(private readonly api: Api) {}

  estado() {
    return this.api.get<{ bienestar_digital: EstadoBienestarDigital }>('/alumno/bienestar-digital', { fresh: true });
  }

  latido(segundos = 60) {
    return this.api.post<{ bienestar_digital: EstadoBienestarDigital }>('/alumno/bienestar-digital/latido', { segundos });
  }
}
