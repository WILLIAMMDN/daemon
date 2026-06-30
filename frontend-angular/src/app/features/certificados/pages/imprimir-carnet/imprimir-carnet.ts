import { Component, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CertificadoService } from '../../services/certificado';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


@Component({
  selector: 'app-imprimir-carnet',
  imports: [Cargando],
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
