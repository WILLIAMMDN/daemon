import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Autenticacion } from '../../servicios/autenticacion';
import { Sesion } from '../../servicios/sesion';

interface EnlacePortal {
  etiqueta: string;
  ruta: string;
  detalle: string;
}

interface GrupoPortal {
  titulo: string;
  soloAdmin?: boolean;
  enlaces: EnlacePortal[];
}

@Component({
  selector: 'app-layout-docente',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout-docente.html',
  styleUrl: './layout-docente.scss',
})
export class LayoutDocente {
  readonly grupos: GrupoPortal[] = [
    {
      titulo: 'Inicio',
      enlaces: [
        { etiqueta: 'Panel', ruta: '/docente', detalle: 'Resumen del aula' },
        { etiqueta: 'Perfil', ruta: '/docente/perfil', detalle: 'Cuenta docente' },
        { etiqueta: 'Alumnos y tokens', ruta: '/docente/alumnos', detalle: 'Tokens, carnets y cuentas' },
      ],
    },
    {
      titulo: 'Academia',
      enlaces: [
        { etiqueta: 'Misiones', ruta: '/docente/misiones', detalle: 'Desafíos del aula' },
        { etiqueta: 'Entregas', ruta: '/docente/entregas', detalle: 'Revisión de evidencias' },
        { etiqueta: 'Evaluaciones', ruta: '/docente/evaluaciones', detalle: 'Exámenes y preguntas' },
        { etiqueta: 'Resultados', ruta: '/docente/evaluaciones/resultados', detalle: 'Seguimiento académico' },
      ],
    },
    {
      titulo: 'Gamificación',
      enlaces: [
        { etiqueta: 'Insignias', ruta: '/docente/insignias', detalle: 'Reconocimientos' },
        { etiqueta: 'Tienda', ruta: '/docente/tienda', detalle: 'Premios y canjes' },
        { etiqueta: 'Historial de tokens', ruta: '/docente/tokens', detalle: 'Auditoría de economía' },
      ],
    },
    {
      titulo: 'En vivo',
      enlaces: [
        { etiqueta: 'Competencia', ruta: '/docente/competencia', detalle: 'Control de ronda' },
        { etiqueta: 'Pantalla TV', ruta: '/docente/competencia/tv', detalle: 'Vista publica' },
        { etiqueta: 'Historial de rondas', ruta: '/docente/rondas', detalle: 'Resultados anteriores' },
      ],
    },
    {
      titulo: 'Administración',
      soloAdmin: true,
      enlaces: [
        { etiqueta: 'Usuarios internos', ruta: '/docente/usuarios', detalle: 'Docentes y administradores' },
      ],
    },
  ];

  constructor(public sesion: Sesion, private auth: Autenticacion, private router: Router) {}

  salir(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => {
        this.sesion.limpiar();
        this.router.navigateByUrl('/login');
      },
    });
  }
}
