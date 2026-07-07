import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Evaluacion } from '../../services/evaluacion';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';

@Component({
  selector: 'app-gestionar-evaluacion',
  imports: [
    FormsModule, 
    CommonModule,
    Cargando,
    EstadoVacio,
    NzAlertModule,
    NzButtonModule,
    NzModalModule,
    NzTableModule,
    NzTagModule,
    NzPopconfirmModule
  ],
  templateUrl: './gestionar-evaluacion.html',
  styleUrl: './gestionar-evaluacion.scss',
})
export class GestionarEvaluacion {
  evaluaciones = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  
  nueva = { titulo: '', nivel: 'TEENS', estado: 'borrador' };
  pregunta = { examen_id: null as number | null, enunciado: '', tipo: 'opcion_multiple', opciones: '', respuesta_correcta: '' };

  modalVisible = signal(false);
  evaluacionEditando: any = null;

  constructor(private evaluacion: Evaluacion, private message: NzMessageService) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.evaluacion.listarDocente().subscribe({
      next: (evaluaciones) => {
        this.evaluaciones.set(evaluaciones as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar las evaluaciones.');
        this.cargando.set(false);
      },
    });
  }

  crear(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.evaluacion.crear(this.nueva).subscribe({
      next: () => {
        this.nueva = { titulo: '', nivel: 'TEENS', estado: 'borrador' };
        this.mensaje.set('Evaluación creada exitosamente.');
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo crear la evaluación.');
        this.guardando.set(false);
      },
    });
  }

  agregarPregunta(): void {
    const examen = this.evaluaciones().find((item) => Number(item.id) === Number(this.pregunta.examen_id));
    if (!examen) return;
    const nuevaPregunta = {
      enunciado: this.pregunta.enunciado,
      tipo: this.pregunta.tipo,
      opciones: this.pregunta.opciones.split(',').map((opcion) => opcion.trim()).filter(Boolean),
      respuesta_correcta: this.pregunta.respuesta_correcta,
    };
    const preguntas = [...(examen.preguntas ?? []).map((item: any) => ({
      enunciado: item.enunciado,
      tipo: item.tipo,
      opciones: item.opciones ?? [],
      respuesta_correcta: item.respuesta_correcta,
    })), nuevaPregunta];

    this.guardando.set(true);
    this.evaluacion.guardarPreguntas(examen.id, preguntas).subscribe({
      next: () => {
        this.pregunta = { examen_id: examen.id, enunciado: '', tipo: 'opcion_multiple', opciones: '', respuesta_correcta: '' };
        this.mensaje.set('Pregunta agregada.');
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo guardar la pregunta.');
        this.guardando.set(false);
      },
    });
  }

  abrirEditar(ev: any): void {
    this.evaluacionEditando = { ...ev };
    this.modalVisible.set(true);
  }

  cerrarEditar(): void {
    this.modalVisible.set(false);
    this.evaluacionEditando = null;
  }

  guardarEdicion(): void {
    if (!this.evaluacionEditando) return;
    this.guardando.set(true);
    this.evaluacion.actualizar(this.evaluacionEditando.id, this.evaluacionEditando).subscribe({
      next: () => {
        this.message.success('Evaluación actualizada correctamente.');
        this.guardando.set(false);
        this.cerrarEditar();
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'Error al actualizar la evaluación.');
        this.guardando.set(false);
      }
    });
  }

  eliminar(id: number): void {
    this.evaluacion.eliminar(id).subscribe({
      next: () => {
        this.message.success('Evaluación eliminada correctamente.');
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'Error al eliminar la evaluación.');
      }
    });
  }

  alternarPublicacion(ev: any): void {
    const solicitud = ev.estado === 'activo' ? this.evaluacion.despublicar(ev.id) : this.evaluacion.publicar(ev.id);
    solicitud.subscribe({
      next: () => {
        this.message.success(`Evaluación ${ev.estado === 'activo' ? 'despublicada' : 'publicada'} correctamente.`);
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'Error al cambiar estado.');
      }
    });
  }
}
