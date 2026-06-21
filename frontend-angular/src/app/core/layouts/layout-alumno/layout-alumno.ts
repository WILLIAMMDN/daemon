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
  enlaces: EnlacePortal[];
}

@Component({
  selector: 'app-layout-alumno',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout-alumno.html',
  styleUrl: './layout-alumno.scss',
})
export class LayoutAlumno {
  readonly grupos: GrupoPortal[] = [
    {
      titulo: 'Inicio',
      enlaces: [
        { etiqueta: 'Panel', ruta: '/alumno', detalle: 'Resumen de progreso' },
        { etiqueta: 'Mi perfil', ruta: '/alumno/perfil', detalle: 'Datos, rango e insignias' },
        { etiqueta: 'Recursos', ruta: '/alumno/recursos', detalle: 'Accesos de aprendizaje' },
      ],
    },
    {
      titulo: 'Aprendizaje',
      enlaces: [
        { etiqueta: 'Mis desafíos', ruta: '/alumno/desafios', detalle: 'Misiones y evidencias' },
        { etiqueta: 'Evaluaciones', ruta: '/alumno/evaluaciones', detalle: 'Exámenes activos' },
        { etiqueta: 'Resultados', ruta: '/alumno/resultados', detalle: 'Historial académico' },
        { etiqueta: 'Certificado', ruta: '/alumno/certificado', detalle: 'Carnet y constancia' },
      ],
    },
    {
      titulo: 'IA y creatividad',
      enlaces: [
        { etiqueta: 'Chatbot', ruta: '/alumno/chatbot', detalle: 'Bot tutor conectado' },
        { etiqueta: 'Configurar bot', ruta: '/alumno/crear-bot', detalle: 'Personalidad y base' },
        { etiqueta: 'Cuentos', ruta: '/alumno/cuentos', detalle: 'Galería y creación' },
        { etiqueta: 'Laboratorio IA', ruta: '/alumno/laboratorio', detalle: 'Cerebro y motores' },
      ],
    },
    {
      titulo: 'Comunidad',
      enlaces: [
        { etiqueta: 'Competencia', ruta: '/alumno/competencia', detalle: 'Votación en vivo' },
        { etiqueta: 'Ranking', ruta: '/alumno/ranking', detalle: 'Clasificación por nivel' },
        { etiqueta: 'Comunidad', ruta: '/alumno/comunidad', detalle: 'Perfiles del aula' },
      ],
    },
    {
      titulo: 'Economía',
      enlaces: [
        { etiqueta: 'Tienda', ruta: '/alumno/tienda', detalle: 'Premios disponibles' },
        { etiqueta: 'Mis canjes', ruta: '/alumno/canjes', detalle: 'Historial de premios' },
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
