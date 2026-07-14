import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Activos } from '../../../../core/servicios/activos';
import { Sesion } from '../../../../core/servicios/sesion';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-perfil-alumno',
  imports: [
    RouterLink,
    NzAlertModule,
    NzAvatarModule,
    NzButtonModule,
    NzCardModule,
    NzDescriptionsModule,
    NzProgressModule,
    NzStatisticModule,
    NzTagModule,
    Cargando,
    EstadoVacio,
    MonedaDaemon,
  ],
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

  avatar(usuario: UsuarioPerfil): string {
    return this.asset(usuario.avatar);
  }

  iniciales(usuario: UsuarioPerfil): string {
    const base = usuario.nombre_completo || usuario.usuario || 'DAEMON';
    return base
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('') || 'D';
  }

  progresoPerfil(usuario: UsuarioPerfil): number {
    const puntos = [
      usuario.nombre_completo,
      usuario.usuario,
      usuario.email,
      usuario.biografia,
      usuario.avatar,
      usuario.rango,
    ].filter(Boolean).length;

    return Math.round((puntos / 6) * 100);
  }

  estadoProgreso(usuario: UsuarioPerfil): 'active' | 'success' {
    return this.progresoPerfil(usuario) >= 80 ? 'success' : 'active';
  }

  private usuarioIdActual(): number | null {
    const valor = this.route.snapshot.paramMap.get('usuarioId');
    if (!valor) return null;

    const id = Number(valor);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
}
