import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Docente } from '../../services/docente';

interface AlumnoRanking {
  id: number;
  nombre_completo: string;
  usuario: string;
  nivel: string;
  tokens: number;
  rango?: string | null;
}

interface PanelDocenteData {
  alumnos: number;
  tokens_circulacion: number;
  entregas_pendientes: number;
  canjes_pendientes: number;
  ranking: AlumnoRanking[];
}

@Component({
  selector: 'app-panel-docente',
  imports: [RouterLink],
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
