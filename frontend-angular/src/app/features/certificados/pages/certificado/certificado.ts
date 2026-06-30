import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CertificadoService } from '../../services/certificado';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


@Component({
  selector: 'app-certificado',
  imports: [RouterLink, Cargando],
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
