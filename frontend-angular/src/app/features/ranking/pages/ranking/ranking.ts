import { Component } from '@angular/core';
import { PaginaApi } from '../../../../shared/componentes/pagina-api/pagina-api';

@Component({
  selector: 'app-ranking',
  imports: [PaginaApi],
  templateUrl: './ranking.html',
  styleUrl: './ranking.scss',
})
export class Ranking {}
