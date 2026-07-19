import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule, NzIconService } from 'ng-zorro-antd/icon';
import { GiftOutline, MailOutline, StarFill, UserOutline } from '@ant-design/icons-angular/icons';
import { Activos } from '../../../../core/servicios/activos';
import { Sesion } from '../../../../core/servicios/sesion';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { Alumno } from '../../services/alumno';

interface UsuarioPerfil {
  id: number;
  nombre_completo: string;
  usuario: string;
  email?: string | null;
  nivel: string;
  tokens: number;
  experiencia?: number;
  nivel_gamificacion?: number;
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
    NzEmptyModule,
    NzIconModule,
    Cargando,
    MonedaDaemon,
  ],
  templateUrl: './perfil-alumno.html',
})
export class PerfilAlumno {
  perfil = signal<PerfilData | null>(null);
  cargando = signal(true);
  error = signal('');
  perfilPropio = signal(true);
  avatarFallido = signal(false);
  private readonly imagenesPremioInvalidas = signal<Set<number>>(new Set());
  private readonly imagenesInsigniaInvalidas = signal<Set<number>>(new Set());

  constructor(
    private alumno: Alumno,
    private route: ActivatedRoute,
    private sesion: Sesion,
    private activos: Activos,
    iconos: NzIconService,
  ) {
    iconos.addIcon(MailOutline, UserOutline, GiftOutline, StarFill);
    this.route.paramMap.subscribe(() => this.cargar());
  }

  cargar(): void {
    const usuarioId = this.usuarioIdActual();
    this.perfilPropio.set(!usuarioId || usuarioId === this.sesion.usuario()?.id);
    this.cargando.set(true);
    this.error.set('');
    this.avatarFallido.set(false);
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
    return this.avatarFallido() ? '' : this.asset(usuario.avatar);
  }

  imagenPremioFallida(id: number): boolean {
    return this.imagenesPremioInvalidas().has(id);
  }

  imagenInsigniaFallida(id: number): boolean {
    return this.imagenesInsigniaInvalidas().has(id);
  }

  registrarImagenFallida(tipo: 'premio' | 'insignia', id: number): void {
    const origen = tipo === 'premio' ? this.imagenesPremioInvalidas : this.imagenesInsigniaInvalidas;
    origen.update((ids) => new Set(ids).add(id));
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
