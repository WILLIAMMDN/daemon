import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBolt,
  faBookOpenReader,
  faBullseye,
  faChevronRight,
  faFire,
  faGift,
  faRocket,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { Alumno } from '../../services/alumno';

interface UsuarioPanel {
  id: number;
  nombre_completo: string;
  usuario: string;
  nivel: string;
  tokens: number;
  rango?: string | null;
}

interface PanelAlumnoData {
  usuario: UsuarioPanel;
  posicion: number;
  misiones_pendientes: number;
  insignias: number;
  canjes_pendientes: number;
}

@Component({
  selector: 'app-panel-alumno',
  imports: [RouterLink, FontAwesomeModule, NzAlertModule, NzButtonModule, Cargando, MonedaDaemon],
  templateUrl: './panel-alumno.html',
  styleUrl: './panel-alumno.scss',
})
export class PanelAlumno {
  panel = signal<PanelAlumnoData | null>(null);
  cargando = signal(true);
  error = signal('');

  readonly iconos = {
    fuego: faFire,
    energia: faBolt,
    curso: faBookOpenReader,
    reto: faBullseye,
    regalo: faGift,
    estrella: faStar,
    flecha: faChevronRight,
    cohete: faRocket,
  };

  constructor(private alumno: Alumno) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.alumno.panel().subscribe({
      next: (panel) => {
        this.panel.set(panel as PanelAlumnoData);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar tu panel.');
        this.cargando.set(false);
      },
    });
  }

  nombreCorto(usuario: UsuarioPanel): string {
    return (usuario.nombre_completo || usuario.usuario || 'explorador').split(/\s+/).filter(Boolean)[0] ?? 'explorador';
  }

  nivel(usuario: UsuarioPanel): string {
    const nivel = usuario.nivel || 'Ruta inicial';
    return nivel.toLowerCase().startsWith('nivel') ? nivel : `Nivel ${nivel}`;
  }

  rango(usuario: UsuarioPanel): string {
    return usuario.rango || 'Explorador';
  }

  progreso(datos: PanelAlumnoData): number {
    const base = 58 + Math.min(datos.insignias * 6, 24) - Math.min(datos.misiones_pendientes * 4, 22);
    const bonusTokens = Math.min(Math.floor((datos.usuario.tokens || 0) / 250), 10);
    return Math.max(22, Math.min(94, base + bonusTokens));
  }

  progresoCurso(datos: PanelAlumnoData): number {
    return Math.max(24, Math.min(88, this.progreso(datos) - 8));
  }

  racha(datos: PanelAlumnoData): number {
    return Math.max(3, 12 - datos.misiones_pendientes + Math.min(datos.insignias, 5));
  }

  xpParaNivel(datos: PanelAlumnoData): number {
    return Math.max(80, 320 - Math.min(datos.usuario.tokens || 0, 260));
  }

  objetivoMisiones(datos: PanelAlumnoData): number {
    return Math.max(8, datos.misiones_pendientes + datos.insignias + 5);
  }

  misionesCompletadas(datos: PanelAlumnoData): number {
    return Math.max(0, this.objetivoMisiones(datos) - datos.misiones_pendientes);
  }

  xpActividad(datos: PanelAlumnoData): number {
    return Math.max(50, datos.insignias * 25);
  }
}
