import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Mision } from '../../services/mision';

@Component({
  selector: 'app-detalle-mision',
  imports: [RouterLink],
  templateUrl: './detalle-mision.html',
  styleUrl: './detalle-mision.scss',
})
export class DetalleMision {
  detalle = signal<any | null>(null);
  cargando = signal(true);
  error = signal('');
  id: number;

  constructor(private route: ActivatedRoute, private mision: Mision) {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.mision.detalle(this.id).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la mision.');
        this.cargando.set(false);
      },
    });
  }
}
