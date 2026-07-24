import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faEllipsis, faStar, faQuoteLeft, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-galeria-aside',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule, NzButtonModule],
  templateUrl: './galeria-aside.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'style': 'display: contents'
  }
})
export class GaleriaAsideComponent {
  faTimes = faTimes;
  faEllipsis = faEllipsis;
  faStar = faStar;
  faQuoteLeft = faQuoteLeft;
  faChartLine = faChartLine;

  @Input({ required: true }) asideAbierto = false;
  @Input({ required: true }) progresoCreativo = 0;
  @Input({ required: true }) totalCuentos = 0;
  @Input({ required: true }) totalBorradores = 0;
  @Input({ required: true }) reaccionesRecibidas = 0;
  @Input({ required: true }) plantillasRecomendadas: { id: string; titulo: string; imagen: string }[] = [];
  @Input({ required: true }) inspiracionDiaria!: { frase: string; autor: string };

  @Output() onClose = new EventEmitter<void>();
  @Output() onTemplateClick = new EventEmitter<MouseEvent>();
}
