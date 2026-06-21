import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

@Injectable({
  providedIn: 'root',
})
export class CertificadoService {
  constructor(private api: Api) {}

  actual() {
    return this.api.get('/certificados');
  }

  porUsuario(usuarioId: number | string) {
    return this.api.get(`/certificados/${usuarioId}`);
  }
}
