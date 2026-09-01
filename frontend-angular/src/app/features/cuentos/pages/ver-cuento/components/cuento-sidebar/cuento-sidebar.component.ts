import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBookmark, faClock, faCalendarDays, faHeart, faCommentDots, faRobot } from '@fortawesome/free-solid-svg-icons';
import { CuentoDetallePayload } from '../../../../models/cuento.models';

@Component({
  selector: 'app-cuento-sidebar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './cuento-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class CuentoSidebarComponent {
  faBookmark = faBookmark;
  faClock = faClock;
  faCalendarDays = faCalendarDays;
  faHeart = faHeart;
  faCommentDots = faCommentDots;
  faRobot = faRobot;

  @Input({ required: true }) datosCuento!: CuentoDetallePayload;
  @Input() modoLectura = false;
  @Input() tipAsistente = 'Cargando tip...';
  @Input() reaccionesCount: Record<string, number> = {};
  @Input() miReaccion: string | null = null;
  @Input() comentariosCount = 0;

  @Output() onReaccionar = new EventEmitter<string>();

  getReaccionesTotales(): number {
    return Object.values(this.reaccionesCount).reduce((a, b) => a + b, 0);
  }
}
