import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Activos } from '../../../../core/servicios/activos';
import { Tienda } from '../../services/tienda';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tienda-alumno',
  imports: [RouterLink, NzAlertModule, NzButtonModule, NzTagModule, Cargando, EstadoVacio, MonedaDaemon],
  templateUrl: './tienda-alumno.html',
  styleUrl: './tienda-alumno.scss',
})
export class TiendaAlumno {
  saldo = signal(0);
  premios = signal<any[]>([]);
  cargando = signal(true);
  procesando = signal<number | null>(null);
  mensaje = signal('');
  error = signal('');

  constructor(private tienda: Tienda, private activos: Activos) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.tienda.premios().subscribe({
      next: (datos: any) => {
        this.saldo.set(datos.saldo ?? 0);
        this.premios.set(datos.premios ?? []);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la tienda.');
        this.cargando.set(false);
      },
    });
  }

  canjear(id: number): void {
    this.procesando.set(id);
    this.mensaje.set('');
    this.error.set('');
    this.tienda.canjear(id).subscribe({
      next: (respuesta: any) => {
        this.saldo.set(respuesta.saldo ?? this.saldo());
        this.mensaje.set(respuesta.codigo ? `Canje realizado. Código: ${respuesta.codigo}` : 'Canje registrado.');
        this.procesando.set(null);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo realizar el canje.');
        this.procesando.set(null);
      },
    });
  }

  asset(ruta?: string | null): string {
    return this.activos.url(ruta);
  }
}
