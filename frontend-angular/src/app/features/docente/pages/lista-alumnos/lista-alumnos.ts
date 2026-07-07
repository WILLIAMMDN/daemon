import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { Docente } from '../../services/docente';

interface AulaResumen {
  id: number;
  nombre: string;
  nivel?: string | null;
  codigo?: string | null;
  alumnos_count?: number;
  docentes_count?: number;
}

interface AlcanceAcademico {
  tipo: 'global' | 'aula' | 'sin_aula' | string;
  titulo: string;
  descripcion: string;
  aula?: AulaResumen | null;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lista-alumnos',
  imports: [FormsModule, RouterLink, NzAlertModule, NzButtonModule, NzTagModule, Cargando, EstadoVacio],
  templateUrl: './lista-alumnos.html',
  styleUrl: './lista-alumnos.scss',
})
export class ListaAlumnos {
  alumnos = signal<any[]>([]);
  docentes = signal<any[]>([]);
  aulas = signal<AulaResumen[]>([]);
  alcance = signal<AlcanceAcademico | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  asignando = signal<number | null>(null);
  mensaje = signal('');
  error = signal('');
  ajuste = { id_alumno: null as number | null, cantidad: 0, motivo: '' };
  nuevaAula = { nombre: '', nivel: '', codigo: '' };

  constructor(private docente: Docente) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.docente.alumnos().subscribe({
      next: (respuesta: any) => {
        this.alumnos.set(this.extraerLista(respuesta, 'alumnos'));
        if (respuesta?.alcance) {
          this.alcance.set(respuesta.alcance);
        }

        this.cargando.set(false);
        this.cargarAulas();
        this.cargarDocentes();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar los alumnos.');
        this.alumnos.set([]);
        this.cargando.set(false);
      },
    });
  }

  cargarAulas(): void {
    this.docente.aulas().subscribe({
      next: (respuesta: any) => {
        this.aulas.set(this.extraerLista(respuesta, 'aulas'));
        if (respuesta?.alcance) {
          this.alcance.set(respuesta.alcance);
        }
      },
      error: () => this.aulas.set([]),
    });
  }

  cargarDocentes(): void {
    this.docente.docentes().subscribe({
      next: (respuesta: any) => this.docentes.set(this.extraerLista(respuesta, 'docentes')),
      error: () => this.docentes.set([]),
    });
  }

  asignarTokens(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');

    this.docente.asignarTokens(this.ajuste).subscribe({
      next: () => {
        this.mensaje.set('Tokens actualizados.');
        this.ajuste = { id_alumno: null, cantidad: 0, motivo: '' };
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron actualizar los tokens.');
        this.guardando.set(false);
      },
    });
  }

  crearAula(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');

    const datos = {
      nombre: this.nuevaAula.nombre.trim(),
      nivel: this.nuevaAula.nivel.trim() || null,
      codigo: this.nuevaAula.codigo.trim() || null,
    };

    this.docente.crearAula(datos).subscribe({
      next: () => {
        this.mensaje.set('Aula creada.');
        this.nuevaAula = { nombre: '', nivel: '', codigo: '' };
        this.guardando.set(false);
        this.cargarAulas();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo crear el aula.');
        this.guardando.set(false);
      },
    });
  }

  asignarAula(usuario: any, idAula: string | number | null): void {
    const valor = idAula ? Number(idAula) : null;
    this.asignando.set(usuario.id);
    this.mensaje.set('');
    this.error.set('');

    this.docente.asignarAulaUsuario(usuario.id, { id_aula: valor }).subscribe({
      next: () => {
        this.mensaje.set('Asignacion de aula actualizada.');
        this.asignando.set(null);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo asignar el aula.');
        this.asignando.set(null);
      },
    });
  }

  puedeCrearAula(): boolean {
    return this.nuevaAula.nombre.trim().length > 0;
  }

  esAdmin(): boolean {
    return this.alcance()?.tipo === 'global';
  }

  aulaNombre(usuario: any): string {
    return usuario.aula?.nombre || 'Sin aula';
  }

  private extraerLista(respuesta: any, campo: string): any[] {
    if (Array.isArray(respuesta)) return respuesta;
    if (respuesta && Array.isArray(respuesta.data)) return respuesta.data;
    if (respuesta && Array.isArray(respuesta[campo])) return respuesta[campo];
    return [];
  }
}
