import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Cuento } from '../../services/cuento';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { QuillModule } from 'ngx-quill';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ver-cuento',
  imports: [RouterLink, Cargando, EstadoVacio, QuillModule, CommonModule],
  templateUrl: './ver-cuento.html',
  styleUrl: './ver-cuento.scss',
})
export class VerCuento {
  datos = signal<any | null>(null);
  cargando = signal(true);
  error = signal('');
  id: number;

  constructor(private route: ActivatedRoute, private cuento: Cuento) {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.cuento.detalle(this.id).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar el cuento.');
        this.cargando.set(false);
      },
    });
  }
}
