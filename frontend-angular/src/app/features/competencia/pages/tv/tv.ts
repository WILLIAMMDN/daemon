import { Component, OnDestroy, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Competencia } from '../../services/competencia';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tv',
  imports: [CommonModule, Cargando, NzButtonModule, NzAlertModule, NzTagModule],
  templateUrl: './tv.html',
  styleUrl: './tv.scss',
})
export class Tv implements OnInit, OnDestroy {
  estado = signal<any | null>(null);
  error = signal('');
  private subscripcionPusher?: Subscription;

  constructor(private competencia: Competencia, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargar();
    this.subscripcionPusher = this.competencia.escucharActualizaciones().subscribe({
      next: (estadoActualizado) => {
        this.estado.set(estadoActualizado);
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    this.subscripcionPusher?.unsubscribe();
  }

  cargar(): void {
    this.competencia.estado().subscribe({
      next: (estado) => {
        this.estado.set(estado);
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la competencia.');
        this.cdr.detectChanges();
      },
    });
  }
}
