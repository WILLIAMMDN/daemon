import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Cuento } from '../../services/cuento';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-crear-cuento',
  imports: [FormsModule, RouterLink, Cargando],
  templateUrl: './crear-cuento.html',
  styleUrl: './crear-cuento.scss',
})
export class CrearCuento {
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  cuento: Record<string, string> = {
    titulo: '',
    data_1: '',
    data_2: '',
    data_3: '',
    data_4: '',
    data_5: '',
    data_6: '',
  };

  constructor(private cuentos: Cuento) {
    this.cuentos.mio().subscribe({
      next: (cuento: any) => {
        if (cuento) {
          this.cuento = {
            titulo: cuento.titulo ?? '',
            data_1: cuento.data_1 ?? '',
            data_2: cuento.data_2 ?? '',
            data_3: cuento.data_3 ?? '',
            data_4: cuento.data_4 ?? '',
            data_5: cuento.data_5 ?? '',
            data_6: cuento.data_6 ?? '',
          };
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  guardar(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.cuentos.guardar(this.cuento).subscribe({
      next: () => {
        this.mensaje.set('Cuento guardado.');
        this.guardando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo guardar el cuento.');
        this.guardando.set(false);
      },
    });
  }
}
