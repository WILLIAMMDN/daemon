import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alumno } from '../../services/alumno';

interface UsuarioPerfil {
  id: number;
  nombre_completo: string;
  usuario: string;
  email?: string | null;
  nivel: string;
  tokens: number;
  rango?: string | null;
  biografia?: string | null;
  avatar?: string | null;
}

interface PerfilData {
  usuario: UsuarioPerfil;
  insignias: any[];
  mochila: any[];
}

@Component({
  selector: 'app-perfil-alumno',
  imports: [RouterLink],
  templateUrl: './perfil-alumno.html',
  styleUrl: './perfil-alumno.scss',
})
export class PerfilAlumno {
  perfil = signal<PerfilData | null>(null);
  cargando = signal(true);
  error = signal('');

  constructor(private alumno: Alumno) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.alumno.perfil().subscribe({
      next: (perfil) => {
        this.perfil.set(perfil as PerfilData);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar el perfil.');
        this.cargando.set(false);
      },
    });
  }

  asset(ruta?: string | null): string {
    if (!ruta) return '';
    return /^https?:\/\//i.test(ruta) || ruta.startsWith('/') ? ruta : `/${ruta}`;
  }
}
