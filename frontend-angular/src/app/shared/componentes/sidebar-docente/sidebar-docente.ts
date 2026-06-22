import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-sidebar-docente',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ...HlmCardImports, ...HlmButtonImports],
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
