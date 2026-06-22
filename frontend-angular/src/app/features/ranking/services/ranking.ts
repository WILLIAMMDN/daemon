import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';

@Injectable({
  providedIn: 'root',
})
export class Ranking {
  constructor(private api: Api) {}
  listar<T = unknown>() { return this.api.get<T>('/ranking'); }
}
