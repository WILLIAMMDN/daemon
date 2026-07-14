import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CertificadoService } from '../../services/certificado';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-certificado',
  imports: [RouterLink, NzCardModule, NzStatisticModule, NzButtonModule, NzTagModule, NzAlertModule, Cargando, EstadoVacio, MonedaDaemon],
  templateUrl: './certificado.html',
  styleUrl: './certificado.scss',
})
export class Certificado {
  datos = signal<any | null>(null);
  cargando = signal(true);
  error = signal('');

  constructor(private certificado: CertificadoService) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.certificado.actual().subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar el certificado.');
        this.cargando.set(false);
      },
    });
  }
}
