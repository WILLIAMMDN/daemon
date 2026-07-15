import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { ApiError } from '../../../../core/servicios/api';
import { Activos } from '../../../../core/servicios/activos';
import { Sesion } from '../../../../core/servicios/sesion';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import {
  ActividadDia,
  EstadoPanelAlumno,
  MotivoErrorPanel,
  PanelAlumnoDto,
  ProgresoNivel,
  UsuarioPanel,
} from '../../models/panel-alumno.model';
import { Alumno } from '../../services/alumno';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-panel-alumno',
  imports: [RouterLink, FontAwesomeModule, NzAlertModule, NzAvatarModule, NzButtonModule, NzProgressModule, Cargando, MonedaDaemon],
  templateUrl: './panel-alumno.html',
  styleUrl: './panel-alumno.scss',
})
export class PanelAlumno {
  private readonly alumno = inject(Alumno);
  private readonly sesion = inject(Sesion);
  private readonly activos = inject(Activos);

  readonly estado = signal<EstadoPanelAlumno>({ kind: 'loading' });
  readonly panel = computed(() => {
    const estado = this.estado();
    return estado.kind === 'ready' ? estado.data : null;
  });
  readonly cargando = computed(() => this.estado().kind === 'loading');
  readonly error = computed(() => {
    const estado = this.estado();
    return estado.kind === 'error' ? estado.message : '';
  });
  readonly actualizando = signal(false);
  readonly celebracion = signal<{ xp: number } | null>(null);

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
    cerrar: faXmark,
  };

  constructor() {
    this.cargar();
  }

  cargar(): void {
    const datosAnteriores = this.panel();
    if (!datosAnteriores) {
      this.estado.set({ kind: 'loading' });
    }
    this.actualizando.set(true);

    this.alumno.panel().subscribe({
      next: (datos) => {
        this.estado.set({ kind: 'ready', data: datos, stale: false });
        const usuarioActual = this.sesion.usuario();
        if (usuarioActual) this.sesion.actualizarUsuario({ ...usuarioActual, ...datos.usuario });
        this.detectarCelebracion(datos);
        this.actualizando.set(false);
      },
      error: (e: unknown) => {
        const error = this.normalizarError(e);
        if (datosAnteriores) {
          this.estado.set({
            kind: 'ready',
            data: datosAnteriores,
            stale: true,
            message: error.reason === 'offline'
              ? 'Perdimos internet, pero tu progreso sigue aquí.'
              : 'No pudimos actualizar los datos. Conservamos tu último progreso.',
          });
        } else {
          this.estado.set({ kind: 'error', ...error });
        }
        this.actualizando.set(false);
      },
    });
  }

  nombreCorto(usuario: UsuarioPanel): string {
    return (usuario.nombre_completo || usuario.usuario || 'explorador').split(/\s+/).filter(Boolean)[0] ?? 'explorador';
  }

  avatarUrl(usuario: UsuarioPanel): string {
    return this.activos.url(usuario.avatar);
  }

  iniciales(usuario: UsuarioPanel): string {
    const base = usuario.nombre_completo || usuario.usuario || 'DAEMON';
    return base.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join('') || 'D';
  }

  progreso(datos: PanelAlumnoDto): ProgresoNivel {
    return datos.progreso_nivel ?? datos.usuario.progreso_nivel;
  }

  formatoNivel = (): string => `${this.panel()?.progreso_nivel?.nivel ?? 1}`;

  mensajeRacha(datos: PanelAlumnoDto): string {
    if (datos.racha === 0) return 'Tu primera misión aprobada enciende la racha.';

    const hoy = datos.actividad_semana.at(-1)?.activo ?? false;
    if (hoy) return 'Hoy ya alimentaste tu Núcleo DAEMON. Buen trabajo.';

    return `Tu racha de ${datos.racha} días sigue viva. Completa una misión hoy para extenderla.`;
  }

  descripcionDia(dia: ActividadDia): string {
    return `${dia.etiqueta}, ${dia.fecha}: ${dia.activo ? 'misión aprobada' : 'sin actividad registrada'}`;
  }

  cerrarCelebracion(): void {
    this.celebracion.set(null);
  }

  private detectarCelebracion(datos: PanelAlumnoDto): void {
    const clave = `daemon_xp_confirmada_${datos.usuario.id}`;
    const xpActual = datos.progreso_nivel.experiencia_total;

    try {
      const anteriorGuardada = localStorage.getItem(clave);
      const xpAnterior = anteriorGuardada === null ? null : Number(anteriorGuardada);
      if (xpAnterior !== null && Number.isFinite(xpAnterior) && xpActual > xpAnterior) {
        this.celebracion.set({ xp: xpActual - xpAnterior });
      }
      localStorage.setItem(clave, String(xpActual));
    } catch {
      // La celebración es progresiva; el panel funciona aunque storage esté bloqueado.
    }
  }

  private normalizarError(error: unknown): { reason: MotivoErrorPanel; message: string } {
    if (error instanceof ApiError) {
      return {
        reason: error.kind,
        message: error.kind === 'timeout'
          ? 'DAEMON está tardando en responder. Tu progreso está seguro; prueba otra vez.'
          : 'Parece que no hay conexión. Revisa tu internet y vuelve a intentarlo.',
      };
    }

    if (error instanceof HttpErrorResponse && error.status === 401) {
      return { reason: 'unauthorized', message: 'Tu sesión terminó. Inicia sesión nuevamente para continuar.' };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { reason: 'offline', message: 'Parece que no hay conexión. Revisa tu internet y vuelve a intentarlo.' };
    }

    return { reason: 'server', message: 'DAEMON tuvo un tropiezo al cargar tu campus. Inténtalo nuevamente.' };
  }
}
