import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Mision } from '../../services/mision';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


@Component({
  selector: 'app-entregar-mision',
  imports: [FormsModule, RouterLink, Cargando],
  templateUrl: './entregar-mision.html',
  styleUrl: './entregar-mision.scss',
})
export class EntregarMision {
  id: number;
  detalle = signal<any | null>(null);
  cargando = signal(true);
  enviando = signal(false);
  mensaje = signal('');
  error = signal('');
  texto = '';

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
        this.error.set(e.error?.message ?? 'No se pudo cargar la misión.');
        this.cargando.set(false);
      },
    });
  }

  entregar(): void {
    this.enviando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.mision.entregar(this.id, { texto: this.texto }).subscribe({
      next: () => {
        this.mensaje.set('Entrega registrada.');
        this.texto = '';
        this.enviando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo registrar la entrega.');
        this.enviando.set(false);
      },
    });
  }
}
