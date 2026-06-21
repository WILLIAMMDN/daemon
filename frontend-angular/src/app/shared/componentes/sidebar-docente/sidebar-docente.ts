import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar-docente',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar-docente.html',
  styleUrl: './sidebar-docente.scss',
})
export class SidebarDocente {
  enlaces = [
    ['Panel', '/docente'],
    ['Alumnos', '/docente/alumnos'],
    ['Misiones', '/docente/misiones'],
    ['Entregas', '/docente/entregas'],
    ['Tienda', '/docente/tienda'],
    ['Evaluaciones', '/docente/evaluaciones'],
  ];
}
