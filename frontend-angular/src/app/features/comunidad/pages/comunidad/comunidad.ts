import { Component, signal } from '@angular/core';
import { Alumno } from '../../../alumno/services/alumno';

@Component({
  selector: 'app-comunidad',
  imports: [],
  templateUrl: './comunidad.html',
  styleUrl: './comunidad.scss',
})
export class Comunidad {
  miembros = signal<any[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor(private alumno: Alumno) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.alumno.comunidad().subscribe({
      next: (miembros) => {
        this.miembros.set(miembros as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la comunidad.');
        this.cargando.set(false);
      },
    });
  }

  asset(ruta?: string | null): string {
    if (!ruta) return '';
    return /^https?:\/\//i.test(ruta) || ruta.startsWith('/') ? ruta : `/${ruta}`;
  }
}
