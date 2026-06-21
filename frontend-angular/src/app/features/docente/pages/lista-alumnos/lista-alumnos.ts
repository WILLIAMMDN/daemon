import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Docente } from '../../services/docente';

@Component({
  selector: 'app-lista-alumnos',
  imports: [FormsModule],
  templateUrl: './lista-alumnos.html',
  styleUrl: './lista-alumnos.scss',
})
export class ListaAlumnos {
  alumnos = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  ajuste = { id_alumno: null as number | null, cantidad: 0, motivo: '' };

  constructor(private docente: Docente) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    
    this.docente.alumnos().subscribe({
      next: (respuesta: any) => {
        // --- VALIDACIÓN DEFENSIVA DE LA RESPUESTA ---
        if (Array.isArray(respuesta)) {
          // Caso 1: La API devuelve el array directo [...]
          this.alumnos.set(respuesta);
        } else if (respuesta && Array.isArray(respuesta.data)) {
          // Caso 2: Venía envuelto en un objeto común de API { data: [...] }
          this.alumnos.set(respuesta.data);
        } else if (respuesta && Array.isArray(respuesta.alumnos)) {
          // Caso 3: Venía envuelto en { alumnos: [...] }
          this.alumnos.set(respuesta.alumnos);
        } else {
          // Caso extremo: No es un array ni contiene propiedades conocidas
          this.alumnos.set([]);
          this.error.set('El servidor no devolvió un formato de lista válido.');
        }
        
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar los alumnos.');
        this.alumnos.set([]); // Evita que se quede el estado anterior si falla
        this.cargando.set(false);
      },
    });
  }

  asignarTokens(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.docente.asignarTokens(this.ajuste).subscribe({
      next: () => {
        this.mensaje.set('Tokens actualizados.');
        this.ajuste = { id_alumno: null, cantidad: 0, motivo: '' };
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron actualizar los tokens.');
        this.guardando.set(false);
      },
    });
  }
}