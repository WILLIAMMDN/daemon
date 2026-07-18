import { Injectable } from '@angular/core';
import { Api } from '../../../core/servicios/api';
import { RankingDto } from '../models/ranking.model';

@Injectable({
  providedIn: 'root',
})
export class Ranking {
  constructor(private api: Api) {}
  listar(fresh = false) { return this.api.get<RankingDto>('/ranking', { fresh }); }
}
