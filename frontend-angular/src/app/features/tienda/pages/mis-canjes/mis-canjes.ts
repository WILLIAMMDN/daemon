import { Component, signal } from '@angular/core';
import { Tienda } from '../../services/tienda';

@Component({
  selector: 'app-mis-canjes',
  imports: [],
  templateUrl: './mis-canjes.html',
  styleUrl: './mis-canjes.scss',
})
export class MisCanjes {
  canjes = signal<any[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor(private tienda: Tienda) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.tienda.canjes().subscribe({
      next: (canjes) => {
        this.canjes.set(canjes as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar los canjes.');
        this.cargando.set(false);
      },
    });
  }
}
