import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Mision } from '../../services/mision';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


@Component({
  selector: 'app-lista-misiones',
  imports: [RouterLink, Cargando],
  templateUrl: './lista-misiones.html',
  styleUrl: './lista-misiones.scss',
})
export class ListaMisiones {
  misiones = signal<any[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor(private mision: Mision) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.mision.listar().subscribe({
      next: (misiones) => {
        this.misiones.set(misiones as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar las misiones.');
        this.cargando.set(false);
      },
    });
  }
}
