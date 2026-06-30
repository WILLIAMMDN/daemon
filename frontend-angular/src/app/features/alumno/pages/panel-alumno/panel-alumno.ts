import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { Alumno } from '../../services/alumno';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


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
  imports: [RouterLink, NzAlertModule, NzButtonModule, Cargando],
  templateUrl: './panel-alumno.html',
  styleUrl: './panel-alumno.scss',
})
export class PanelAlumno {
  panel = signal<PanelAlumnoData | null>(null);
  cargando = signal(true);
  error = signal('');

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
}
