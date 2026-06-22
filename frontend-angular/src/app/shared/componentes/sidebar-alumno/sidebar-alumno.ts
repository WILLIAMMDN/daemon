import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-sidebar-alumno',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ...HlmCardImports, ...HlmButtonImports],
  templateUrl: './sidebar-alumno.html',
  styleUrl: './sidebar-alumno.scss',
})
export class SidebarAlumno {
  enlaces = [
    ['Panel', '/alumno'],
    ['Misiones', '/alumno/misiones'],
    ['Herramientas', '/alumno/herramientas'],
    ['Tienda', '/alumno/tienda'],
    ['Ranking', '/alumno/ranking'],
  ];
}
