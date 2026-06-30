import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cuento } from '../../services/cuento';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


@Component({
  selector: 'app-galeria-proyectos',
  imports: [RouterLink, Cargando],
  templateUrl: './galeria-proyectos.html',
  styleUrl: './galeria-proyectos.scss',
})
export class GaleriaProyectos {
  cuentos = signal<any[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor(private cuento: Cuento) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.cuento.listar().subscribe({
      next: (cuentos) => {
        this.cuentos.set(cuentos as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la galería.');
        this.cargando.set(false);
      },
    });
  }

  portada(cuento: any): string {
    const ruta = cuento.img_1 || cuento.img_2 || '';
    if (!ruta) return '';
    return /^https?:\/\//i.test(ruta) || ruta.startsWith('/') ? ruta : `/${ruta}`;
  }
}
