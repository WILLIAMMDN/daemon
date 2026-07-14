import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faBolt, faCheck, faClock, faRocket, faRotateRight, faStar } from '@fortawesome/free-solid-svg-icons';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { Mision } from '../../services/mision';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lista-misiones',
  imports: [RouterLink, FontAwesomeModule, NzAlertModule, NzButtonModule, NzCardModule, Cargando, EstadoVacio, MonedaDaemon],
  templateUrl: './lista-misiones.html',
  styleUrl: './lista-misiones.scss',
})
export class ListaMisiones {
  readonly misiones = signal<any[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly iconos = { flecha: faArrowRight, energia: faBolt, check: faCheck, reloj: faClock, cohete: faRocket, actualizar: faRotateRight, estrella: faStar };

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

  estado(mision: any): 'approved' | 'pending' | 'available' {
    if (mision.entrega?.estado === 'aprobado') return 'approved';
    if (mision.entrega?.estado === 'pendiente') return 'pending';
    return 'available';
  }

  estadoLabel(mision: any): string {
    return this.estado(mision) === 'approved' ? 'Completada' : this.estado(mision) === 'pending' ? 'En revisión' : 'Disponible';
  }
}
