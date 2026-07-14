import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CertificadoService } from '../../services/certificado';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { DatePipe, UpperCasePipe } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-imprimir-carnet',
  imports: [Cargando, NzAlertModule, NzButtonModule, NzCardModule, NzDescriptionsModule, NzDividerModule, NzTagModule, DatePipe, UpperCasePipe],
  templateUrl: './imprimir-carnet.html',
  styleUrl: './imprimir-carnet.scss',
})
export class ImprimirCarnet {
  datos = signal<any | null>(null);
  cargando = signal(true);
  error = signal('');

  constructor(private certificado: CertificadoService, private route: ActivatedRoute) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    const usuarioId = this.route.snapshot.paramMap.get('usuarioId');
    const solicitud = usuarioId ? this.certificado.porUsuario(usuarioId) : this.certificado.actual();

    solicitud.subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar el carnet.');
        this.cargando.set(false);
      },
    });
  }

  imprimir(): void {
    window.print();
  }
}
