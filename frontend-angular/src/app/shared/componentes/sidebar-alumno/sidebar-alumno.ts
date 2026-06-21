import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar-alumno',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar-alumno.html',
  styleUrl: './sidebar-alumno.scss',
})
export class SidebarAlumno {
  enlaces = [
    ['Panel', '/alumno'],
    ['Misiones', '/alumno/misiones'],
    ['Chatbot', '/alumno/chatbot'],
    ['Tienda', '/alumno/tienda'],
    ['Ranking', '/alumno/ranking'],
  ];
}
