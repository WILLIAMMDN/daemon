import { Component } from '@angular/core';
import { PaginaApi } from '../../../../shared/componentes/pagina-api/pagina-api';

@Component({
  selector: 'app-historial-tokens',
  imports: [PaginaApi],
  templateUrl: './historial-tokens.html',
  styleUrl: './historial-tokens.scss',
})
export class HistorialTokens {}
