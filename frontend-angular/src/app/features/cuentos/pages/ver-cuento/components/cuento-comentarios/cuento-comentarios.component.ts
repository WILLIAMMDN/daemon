import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCommentDots, faEllipsisVertical, faTrash, faPenToSquare, faXmark, faCheck } from '@fortawesome/free-solid-svg-icons';
import { CuentoComentario } from '../../../../models/cuento.models';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

@Component({
  selector: 'app-cuento-comentarios',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, NzDropDownModule],
  templateUrl: './cuento-comentarios.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class CuentoComentariosComponent {
  faCommentDots = faCommentDots;
  faEllipsisVertical = faEllipsisVertical;
  faTrash = faTrash;
  faPenToSquare = faPenToSquare;
  faXmark = faXmark;
  faCheck = faCheck;

  @Input({ required: true }) comentarios: CuentoComentario[] = [];
  @Input({ required: true }) miAvatar = '/img/avatars/default.png';
  @Input() miId: string | number | null = null;
  @Input() enviandoComentario = false;

  @Output() onEnviarComentario = new EventEmitter<string>();
  @Output() onEditarComentario = new EventEmitter<{id: string, contenido: string}>();
  @Output() onEliminarComentario = new EventEmitter<string>();

  nuevoComentario = '';
  
  // Estado de edición
  editandoId: string | null = null;
  contenidoEdicion = '';
  menuAbiertoId: string | null = null;

  enviar() {
    const contenido = this.nuevoComentario.trim();
    if (!contenido || this.enviandoComentario) return;
    this.onEnviarComentario.emit(contenido);
    this.nuevoComentario = '';
  }

  toggleMenu(id: string) {
    this.menuAbiertoId = this.menuAbiertoId === id ? null : id;
  }

  iniciarEdicion(comentario: CuentoComentario) {
    this.editandoId = comentario.id || null;
    this.contenidoEdicion = comentario.contenido;
    this.menuAbiertoId = null;
  }

  cancelarEdicion() {
    this.editandoId = null;
    this.contenidoEdicion = '';
  }

  guardarEdicion() {
    const contenido = this.contenidoEdicion.trim();
    if (!contenido || !this.editandoId) return;
    this.onEditarComentario.emit({ id: this.editandoId, contenido });
    this.editandoId = null;
  }

  eliminar(id: string) {
    if (confirm('¿Estás seguro de eliminar este comentario?')) {
      this.onEliminarComentario.emit(id);
      this.menuAbiertoId = null;
    }
  }
}
