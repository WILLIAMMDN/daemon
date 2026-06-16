import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Autenticacion } from '../../servicios/autenticacion';
import { Sesion } from '../../servicios/sesion';

@Component({
  selector: 'app-layout-docente',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout-docente.html',
  styleUrl: './layout-docente.scss',
})
export class LayoutDocente {
  readonly enlaces = [
    ['Panel', '/docente'], ['Perfil', '/docente/perfil'], ['Alumnos y tokens', '/docente/alumnos'], ['Misiones', '/docente/misiones'],
    ['Entregas', '/docente/entregas'], ['Insignias', '/docente/insignias'], ['Tienda', '/docente/tienda'], ['Evaluaciones', '/docente/evaluaciones'],
    ['Resultados', '/docente/evaluaciones/resultados'], ['Competencia', '/docente/competencia'], ['Historial de rondas', '/docente/rondas'], ['Historial de tokens', '/docente/tokens'],
  ];
  constructor(public sesion: Sesion, private auth: Autenticacion, private router: Router) {}
  salir(): void { this.auth.logout().subscribe({ next: () => this.router.navigateByUrl('/login'), error: () => { this.sesion.limpiar(); this.router.navigateByUrl('/login'); } }); }
}
