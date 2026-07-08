import { JsonPipe } from '@angular/common';
import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Chatbot } from '../../../chatbot/services/chatbot';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { CommonModule } from '@angular/common';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lab-ia',
  imports: [CommonModule, FormsModule, JsonPipe, RouterLink, Cargando, NzAlertModule, BotonAccion],
  templateUrl: './lab-ia.html',
  styleUrl: './lab-ia.scss',
})
export class LabIa {
  cerebro = signal<any | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  matrizTexto = '{}';

  constructor(private chatbot: Chatbot) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.chatbot.cerebro().subscribe({
      next: (cerebro: any) => {
        this.cerebro.set(cerebro);
        this.matrizTexto = JSON.stringify(cerebro?.matriz_neural ?? {}, null, 2);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar el cerebro.');
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    let matriz: unknown;
    try {
      matriz = JSON.parse(this.matrizTexto || '{}');
    } catch {
      this.error.set('El JSON no es valido.');
      this.guardando.set(false);
      return;
    }

    this.chatbot.guardarCerebro(matriz).subscribe({
      next: () => {
        this.mensaje.set('Cerebro guardado.');
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo guardar el cerebro.');
        this.guardando.set(false);
      },
    });
  }
}
