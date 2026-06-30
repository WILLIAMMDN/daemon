import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Activos } from '../../../../core/servicios/activos';
import { Alumno } from '../../../alumno/services/alumno';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


interface PersonaComunidad {
  id: number;
  nombre_completo: string;
  usuario: string;
  nivel?: string | null;
  tokens: number;
  rango?: string | null;
  avatar?: string | null;
  rol: string;
}

interface ComunidadRespuesta {
  data?: PersonaComunidad[];
}

@Component({
  selector: 'app-comunidad',
  imports: [RouterLink, Cargando],
  templateUrl: './comunidad.html',
  styleUrl: './comunidad.scss',
})
export class Comunidad {
  miembros = signal<PersonaComunidad[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor(private alumno: Alumno, private activos: Activos) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.alumno.comunidad().subscribe({
      next: (respuesta) => {
        this.miembros.set(this.normalizar(respuesta));
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la comunidad.');
        this.cargando.set(false);
      },
    });
  }

  asset(ruta?: string | null): string {
    return this.activos.url(ruta);
  }

  private normalizar(respuesta: unknown): PersonaComunidad[] {
    const lista = Array.isArray(respuesta)
      ? respuesta
      : Array.isArray((respuesta as ComunidadRespuesta | null)?.data)
        ? (respuesta as ComunidadRespuesta).data ?? []
        : [];

    return lista
      .filter((persona): persona is PersonaComunidad => Boolean(persona?.id))
      .map((persona) => ({
        ...persona,
        tokens: Number(persona.tokens ?? 0),
      }));
  }
}
