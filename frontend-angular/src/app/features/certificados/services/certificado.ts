import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';
import { CertificadoData } from '../../../core/modelos/dto';

@Injectable({
  providedIn: 'root',
})
export class CertificadoService {
  constructor(private api: Api) {}

  actual() {
    return this.api.get<CertificadoData>('/certificados');
  }

  porUsuario(usuarioId: number | string) {
    return this.api.get<CertificadoData>(`/certificados/${usuarioId}`);
  }
}
