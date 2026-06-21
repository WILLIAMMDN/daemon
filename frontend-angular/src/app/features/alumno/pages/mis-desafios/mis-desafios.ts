import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Mision } from '../../../misiones/services/mision';

@Component({
  selector: 'app-mis-desafios',
  imports: [RouterLink],
  templateUrl: './mis-desafios.html',
  styleUrl: './mis-desafios.scss',
})
export class MisDesafios {
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
        this.error.set(e.error?.message ?? 'No se pudieron cargar los desafios.');
        this.cargando.set(false);
      },
    });
  }
}
