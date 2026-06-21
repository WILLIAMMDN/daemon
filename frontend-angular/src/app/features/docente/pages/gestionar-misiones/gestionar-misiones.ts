import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Mision } from '../../../misiones/services/mision';

@Component({
  selector: 'app-gestionar-misiones',
  imports: [FormsModule],
  templateUrl: './gestionar-misiones.html',
  styleUrl: './gestionar-misiones.scss',
})
export class GestionarMisiones {
  misiones = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  nueva = {
    titulo: '',
    descripcion: '',
    recompensa: 0,
    tipo_evidencia: 'texto',
    nivel_requerido: 'TODOS',
    estado: 'activo',
    es_mision_nivel: false,
  };

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

  crear(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.mision.crear(this.nueva).subscribe({
      next: () => {
        this.mensaje.set('Misión creada.');
        this.nueva = { titulo: '', descripcion: '', recompensa: 0, tipo_evidencia: 'texto', nivel_requerido: 'TODOS', estado: 'activo', es_mision_nivel: false };
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo crear la misión.');
        this.guardando.set(false);
      },
    });
  }
}
