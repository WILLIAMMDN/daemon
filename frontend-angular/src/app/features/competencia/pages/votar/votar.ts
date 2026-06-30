import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Competencia } from '../../services/competencia';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


@Component({
  selector: 'app-votar',
  imports: [FormsModule, Cargando],
  templateUrl: './votar.html',
  styleUrl: './votar.scss',
})
export class Votar {
  estado = signal<any | null>(null);
  cargando = signal(true);
  enviando = signal(false);
  mensaje = signal('');
  error = signal('');
  voto = { puntuacion: 10, comentario: '' };

  constructor(private competencia: Competencia) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.competencia.estado().subscribe({
      next: (estado) => {
        this.estado.set(estado);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la competencia.');
        this.cargando.set(false);
      },
    });
  }

  enviar(): void {
    this.enviando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.competencia.votar(this.voto).subscribe({
      next: () => {
        this.mensaje.set('Voto registrado.');
        this.enviando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo registrar el voto.');
        this.enviando.set(false);
      },
    });
  }
}
