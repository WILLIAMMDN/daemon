import { Component, signal } from '@angular/core';
import { CertificadoService } from '../../services/certificado';

@Component({
  selector: 'app-imprimir-carnet',
  imports: [],
  templateUrl: './imprimir-carnet.html',
  styleUrl: './imprimir-carnet.scss',
})
export class ImprimirCarnet {
  datos = signal<any | null>(null);
  cargando = signal(true);
  error = signal('');

  constructor(private certificado: CertificadoService) {
    this.certificado.actual().subscribe({
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
