import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faShareNodes, faBookmark, faImage } from '@fortawesome/free-solid-svg-icons';
import { Activos } from '../../../../../../core/servicios/activos';
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
  private readonly activos = inject(Activos);

  faArrowLeft = faArrowLeft;
  faShareNodes = faShareNodes;
  faBookmark = faBookmark;
  faImage = faImage;

  get portadaUrl(): string | null {
    const portada = this.datosCuento?.cuento?.portada;
    return portada ? this.activos.url(portada) : null;
  }

  @Input({ required: true }) datosCuento!: CuentoDetalleVista;
  @Input({ required: true }) esPropietario = false;
  @Input({ required: true }) idCuento!: string;
  @Input() guardado = false;

  @Output() onCompartir = new EventEmitter<void>();
  @Output() onGuardar = new EventEmitter<void>();
}
