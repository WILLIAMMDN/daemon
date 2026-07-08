import { Component, OnDestroy, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Competencia } from '../../services/competencia';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Subscription } from 'rxjs';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-votar',
  imports: [FormsModule, Cargando, NzButtonModule, NzAlertModule, NzTagModule],
  templateUrl: './votar.html',
  styleUrl: './votar.scss',
})
export class Votar implements OnInit, OnDestroy {
  estado = signal<any | null>(null);
  cargando = signal(true);
  enviando = signal(false);
  mensaje = signal('');
  error = signal('');
  voto = { puntuacion: 10, comentario: '' };
  private subscripcionPusher?: Subscription;

  constructor(private competencia: Competencia, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargar();
    this.subscripcionPusher = this.competencia.escucharActualizaciones().subscribe({
      next: () => {
        // Al recibir actualización por Pusher, recargamos para tener nuestro 'mi_voto'
        this.cargar();
      },
    });
  }

  ngOnDestroy(): void {
    this.subscripcionPusher?.unsubscribe();
  }

  cargar(): void {
    this.error.set('');
    this.competencia.estado().subscribe({
      next: (estado) => {
        this.estado.set(estado);
        this.cargando.set(false);
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la competencia.');
        this.cargando.set(false);
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      },
    });
  }
}
