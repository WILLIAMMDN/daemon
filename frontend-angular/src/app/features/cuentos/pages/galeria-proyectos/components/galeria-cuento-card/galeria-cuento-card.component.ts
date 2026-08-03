import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBookOpen, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { CuentoVista } from '../../../../presentacion/cuento-vista.modelo';

@Component({
  selector: 'app-galeria-cuento-card',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './galeria-cuento-card.component.html',
  styleUrl: './galeria-cuento-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GaleriaCuentoCardComponent {
  faBookOpen = faBookOpen;
  faPen = faPen;
  faTrash = faTrash;

  @Input({ required: true }) cuento!: CuentoVista;
  @Input({ required: true }) portadaDisponible = true;

  @Output() onEliminar = new EventEmitter<string>();
  @Output() onPortadaFallida = new EventEmitter<string>();
}
