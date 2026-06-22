import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { Alumno } from '../../../alumno/services/alumno';

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
  imports: [RouterLink],
  templateUrl: './comunidad.html',
  styleUrl: './comunidad.scss',
})
export class Comunidad {
  miembros = signal<PersonaComunidad[]>([]);
  cargando = signal(true);
  error = signal('');
  private readonly assetBaseUrl = environment.apiUrl.replace(/\/api\/v1\/?$/, '');

  constructor(private alumno: Alumno) {
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
    const limpia = ruta?.trim();
    if (!limpia) return '';
    if (/^(https?:|data:)/i.test(limpia)) return limpia;

    const path = limpia.startsWith('/') ? limpia : `/${limpia}`;
    if (/^\/?(uploads|img|legacy)\//i.test(limpia)) return path;

    return `${this.assetBaseUrl}${path}`;
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
