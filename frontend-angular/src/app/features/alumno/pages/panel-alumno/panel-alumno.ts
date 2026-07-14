import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faBolt,
  faCheck,
  faFire,
  faGift,
  faMedal,
  faRankingStar,
  faRocket,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { Sesion } from '../../../../core/servicios/sesion';
import { Alumno } from '../../services/alumno';

interface ProgresoNivel {
  nivel: number;
  nivel_maximo: number;
  experiencia_total: number;
  experiencia_nivel: number;
  experiencia_meta: number;
  experiencia_restante: number;
  progreso_porcentaje: number;
}

interface UsuarioPanel {
  id: number;
  nombre_completo: string;
  usuario: string;
  nivel: string;
  tokens: number;
  experiencia: number;
  nivel_gamificacion: number;
  progreso_nivel: ProgresoNivel;
  rango?: string | null;
}

interface ProximaMision {
  id: number;
  titulo: string;
  descripcion?: string | null;
  recompensa: number;
  tipo_evidencia: string;
  nivel_requerido: string;
}

interface PanelAlumnoData {
  usuario: UsuarioPanel;
  posicion: number;
  misiones_pendientes: number;
  misiones_completadas: number;
  insignias: number;
  canjes_pendientes: number;
  racha: number;
  proxima_mision?: ProximaMision | null;
  progreso_nivel: ProgresoNivel;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-panel-alumno',
  imports: [RouterLink, FontAwesomeModule, NzAlertModule, NzButtonModule, NzCardModule, NzProgressModule, Cargando, MonedaDaemon],
  templateUrl: './panel-alumno.html',
  styleUrl: './panel-alumno.scss',
})
export class PanelAlumno {
  private readonly alumno = inject(Alumno);
  private readonly sesion = inject(Sesion);

  readonly panel = signal<PanelAlumnoData | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');

  readonly iconos = {
    flecha: faArrowRight,
    energia: faBolt,
    check: faCheck,
    fuego: faFire,
    regalo: faGift,
    medalla: faMedal,
    ranking: faRankingStar,
    cohete: faRocket,
    brillo: faWandMagicSparkles,
  };

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.alumno.panel().subscribe({
      next: (panel) => {
        const datos = panel as PanelAlumnoData;
        this.panel.set(datos);
        const usuarioActual = this.sesion.usuario();
        if (usuarioActual) this.sesion.actualizarUsuario({ ...usuarioActual, ...datos.usuario });
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar tu panel.');
        this.cargando.set(false);
      },
    });
  }

  nombreCorto(usuario: UsuarioPanel): string {
    return (usuario.nombre_completo || usuario.usuario || 'explorador').split(/\s+/).filter(Boolean)[0] ?? 'explorador';
  }

  progreso(datos: PanelAlumnoData): ProgresoNivel {
    return datos.progreso_nivel ?? datos.usuario.progreso_nivel;
  }

  formatoNivel = (): string => `${this.panel()?.progreso_nivel?.nivel ?? 1}`;

  mensajeRacha(racha: number): string {
    if (racha === 0) return 'Tu primera misión enciende la racha.';
    if (racha === 1) return 'Ya empezaste. Vuelve mañana para mantenerla.';
    return `${racha} días seguidos construyendo algo increíble.`;
  }
}
