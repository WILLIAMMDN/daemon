import { CommonModule } from '@angular/common';
import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { Docente } from '../../services/docente';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { GraficoRendimiento } from '../../componentes/grafico-rendimiento/grafico-rendimiento';

interface AlumnoRanking {
  id: number;
  nombre_completo: string;
  usuario: string;
  nivel: string;
  tokens: number;
  experiencia: number;
  nivel_gamificacion?: number;
  rango?: string | null;
}

interface PanelDocenteData {
  alumnos: number;
  tokens_circulacion: number;
  entregas_pendientes: number;
  canjes_pendientes: number;
  ranking: AlumnoRanking[];
  alcance: {
    tipo: 'global' | 'aula' | 'sin_aula' | string;
    titulo: string;
    descripcion: string;
    aula?: { id: number; nombre: string; nivel?: string | null; codigo?: string | null } | null;
    institucion?: { id: number; nombre: string; slug: string } | null;
  };
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-panel-docente',
  imports: [CommonModule, RouterLink, NzAlertModule, NzButtonModule, NzTagModule, EstadoVacio, MonedaDaemon, GraficoRendimiento],
  templateUrl: './panel-docente.html',
  styleUrl: './panel-docente.scss',
})
export class PanelDocente {
  panel = signal<PanelDocenteData | null>(null);
  cargando = signal(true);
  error = signal('');

  constructor(private docente: Docente) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.docente.panel().subscribe({
      next: (panel) => {
        this.panel.set(panel as PanelDocenteData);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar el panel docente.');
        this.cargando.set(false);
      },
    });
  }
}
