import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Autenticacion } from '../../servicios/autenticacion';
import { Sesion } from '../../servicios/sesion';

@Component({
  selector: 'app-layout-alumno',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout-alumno.html',
  styleUrl: './layout-alumno.scss',
})
export class LayoutAlumno {
  readonly enlaces = [
    ['Panel', '/alumno'], ['Mi perfil', '/alumno/perfil'], ['Desafios', '/alumno/desafios'],
    ['Chatbot', '/alumno/chatbot'], ['Tienda', '/alumno/tienda'], ['Mis canjes', '/alumno/canjes'], ['Evaluaciones', '/alumno/evaluaciones'],
    ['Competencia', '/alumno/competencia'], ['Cuentos', '/alumno/cuentos'], ['Ranking', '/alumno/ranking'], ['Comunidad', '/alumno/comunidad'],
    ['Laboratorio IA', '/alumno/laboratorio'], ['Recursos', '/alumno/recursos'], ['Certificado', '/alumno/certificado'],
  ];
  constructor(public sesion: Sesion, private auth: Autenticacion, private router: Router) {}
  salir(): void { this.auth.logout().subscribe({ next: () => this.router.navigateByUrl('/login'), error: () => { this.sesion.limpiar(); this.router.navigateByUrl('/login'); } }); }
}
