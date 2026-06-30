import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Activos } from '../../../../core/servicios/activos';
import { Sesion } from '../../../../core/servicios/sesion';
import { Alumno } from '../../services/alumno';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


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
  imports: [RouterLink, Cargando],
  templateUrl: './perfil-alumno.html',
  styleUrl: './perfil-alumno.scss',
})
export class PerfilAlumno {
  perfil = signal<PerfilData | null>(null);
  cargando = signal(true);
  error = signal('');
  perfilPropio = signal(true);

  constructor(
    private alumno: Alumno,
    private route: ActivatedRoute,
    private sesion: Sesion,
    private activos: Activos,
  ) {
    this.route.paramMap.subscribe(() => this.cargar());
  }

  cargar(): void {
    const usuarioId = this.usuarioIdActual();
    this.perfilPropio.set(!usuarioId || usuarioId === this.sesion.usuario()?.id);
    this.cargando.set(true);
    this.error.set('');
    this.alumno.perfil<PerfilData>(usuarioId).subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar el perfil.');
        this.cargando.set(false);
      },
    });
  }

  asset(ruta?: string | null): string {
    return this.activos.url(ruta);
  }

  private usuarioIdActual(): number | null {
    const valor = this.route.snapshot.paramMap.get('usuarioId');
    if (!valor) return null;

    const id = Number(valor);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
}
