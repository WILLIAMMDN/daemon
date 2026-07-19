import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { Api } from '../../../../core/servicios/api';

interface Institucion { id: number; nombre: string; }
interface Leccion { id: number; titulo: string; estado: string; orden: number; }
interface Unidad { id: number; titulo: string; estado: string; orden: number; lecciones: Leccion[]; }
interface Curso { id: number; id_institucion: number; titulo: string; codigo?: string; descripcion?: string; nivel?: string; estado: string; version: number; unidades: Unidad[]; }
interface Periodo { id: number; id_institucion: number; titulo: string; tipo: string; fecha_inicio: string; fecha_fin: string; estado: string; }

@Component({
  selector: 'app-gestionar-curriculo',
  imports: [FormsModule],
  templateUrl: './gestionar-curriculo.html',
  styleUrl: './gestionar-curriculo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionarCurriculo {
  private readonly api = inject(Api);

  readonly cursos = signal<Curso[]>([]);
  readonly periodos = signal<Periodo[]>([]);
  readonly instituciones = signal<Institucion[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly panel = signal<'curso' | 'periodo' | 'unidad' | 'leccion' | null>(null);
  readonly cursoSeleccionado = signal<number | null>(null);
  readonly unidadSeleccionada = signal<number | null>(null);

  curso = { id_institucion: 0, titulo: '', codigo: '', descripcion: '', nivel: 'TEENS', estado: 'draft' };
  periodo = { id_institucion: 0, titulo: '', tipo: 'schoolYear', fecha_inicio: '', fecha_fin: '', estado: 'active' };
  unidad = { titulo: '', descripcion: '', orden: 1, estado: 'draft' };
  leccion = { titulo: '', resumen: '', orden: 1, duracion_minutos: 20, estado: 'draft', contenido: [] as unknown[] };

  constructor() { this.cargar(); }

  cargar(): void {
    this.cargando.set(true); this.error.set('');
    forkJoin({
      academico: this.api.get<{ cursos: Curso[]; periodos: Periodo[] }>('/academico', { fresh: true }),
      instituciones: this.api.get<{ data: Institucion[] }>('/instituciones?per_page=100', { fresh: true }),
    }).pipe(finalize(() => this.cargando.set(false))).subscribe({
      next: ({ academico, instituciones }) => {
        this.cursos.set(academico.cursos ?? []); this.periodos.set(academico.periodos ?? []); this.instituciones.set(instituciones.data ?? []);
        const id = this.instituciones()[0]?.id ?? 0;
        if (!this.curso.id_institucion) this.curso.id_institucion = id;
        if (!this.periodo.id_institucion) this.periodo.id_institucion = id;
      },
      error: () => this.error.set('No pudimos cargar el currículo. Revisa tu conexión e inténtalo nuevamente.'),
    });
  }

  abrir(panel: 'curso' | 'periodo' | 'unidad' | 'leccion', id?: number): void {
    this.mensaje.set(''); this.error.set(''); this.panel.set(panel);
    if (panel === 'unidad') this.cursoSeleccionado.set(id ?? null);
    if (panel === 'leccion') this.unidadSeleccionada.set(id ?? null);
  }

  cerrar(): void { this.panel.set(null); }

  crearCurso(): void {
    if (!this.curso.id_institucion || !this.curso.titulo.trim()) return;
    this.mutar(this.api.post('/academico/cursos', this.curso), 'Curso creado como borrador.');
  }

  crearPeriodo(): void {
    if (!this.periodo.id_institucion || !this.periodo.titulo.trim() || !this.periodo.fecha_inicio || !this.periodo.fecha_fin) return;
    this.mutar(this.api.post('/academico/periodos', this.periodo), 'Período académico creado.');
  }

  crearUnidad(): void {
    const id = this.cursoSeleccionado(); if (!id || !this.unidad.titulo.trim()) return;
    this.mutar(this.api.post(`/academico/cursos/${id}/unidades`, this.unidad), 'Unidad añadida al curso.');
  }

  crearLeccion(): void {
    const id = this.unidadSeleccionada(); if (!id || !this.leccion.titulo.trim()) return;
    this.mutar(this.api.post(`/academico/unidades/${id}/lecciones`, this.leccion), 'Lección añadida a la unidad.');
  }

  publicar(curso: Curso): void {
    this.mutar(this.api.put(`/academico/cursos/${curso.id}`, {
      id_institucion: curso.id_institucion, titulo: curso.titulo, codigo: curso.codigo || null,
      descripcion: curso.descripcion || null, nivel: curso.nivel || null, estado: 'published',
    }), 'Curso publicado para las aulas asignadas.');
  }

  private mutar(peticion: ReturnType<Api['post']>, mensaje: string): void {
    this.guardando.set(true); this.error.set('');
    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => { this.mensaje.set(mensaje); this.cerrar(); this.reiniciarFormularios(); this.cargar(); },
      error: (error: any) => this.error.set(error?.error?.message ?? 'No se pudo guardar el cambio.'),
    });
  }

  private reiniciarFormularios(): void {
    const id = this.instituciones()[0]?.id ?? 0;
    this.curso = { id_institucion: id, titulo: '', codigo: '', descripcion: '', nivel: 'TEENS', estado: 'draft' };
    this.periodo = { id_institucion: id, titulo: '', tipo: 'schoolYear', fecha_inicio: '', fecha_fin: '', estado: 'active' };
    this.unidad = { titulo: '', descripcion: '', orden: 1, estado: 'draft' };
    this.leccion = { titulo: '', resumen: '', orden: 1, duracion_minutos: 20, estado: 'draft', contenido: [] };
  }
}
