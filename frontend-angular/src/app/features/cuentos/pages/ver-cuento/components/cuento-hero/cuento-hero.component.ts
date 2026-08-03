import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faShareNodes, faBookmark } from '@fortawesome/free-solid-svg-icons';
import { CuentoDetalleVista } from '../../../../presentacion/cuento-detalle-vista.modelo';

@Component({
  selector: 'app-cuento-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './cuento-hero.component.html',
  styleUrl: './cuento-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CuentoHeroComponent {
  faArrowLeft = faArrowLeft;
  faShareNodes = faShareNodes;
  faBookmark = faBookmark;

  @Input({ required: true }) datosCuento!: CuentoDetalleVista;
  @Input({ required: true }) esPropietario = false;
  @Input({ required: true }) idCuento!: string;
  @Input() guardado = false;

  @Output() onCompartir = new EventEmitter<void>();
  @Output() onGuardar = new EventEmitter<void>();
}
