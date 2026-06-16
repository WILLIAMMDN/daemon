import { Component } from '@angular/core';
import { PaginaApi } from '../../../../shared/componentes/pagina-api/pagina-api';

@Component({
  selector: 'app-lista-alumnos',
  imports: [PaginaApi],
  templateUrl: './lista-alumnos.html',
  styleUrl: './lista-alumnos.scss',
})
export class ListaAlumnos {}
