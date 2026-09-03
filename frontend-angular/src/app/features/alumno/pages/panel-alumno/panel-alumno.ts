import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faCheck,
  faCode,
  faFire,
  faGamepad,
  faGift,
  faHammer,
  faMedal,
  faRankingStar,
  faRobot,
  faRocket,
  faWandMagicSparkles,
  faXmark,
  faFlag,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ApiError } from '../../../../core/servicios/api';
import { Activos } from '../../../../core/servicios/activos';
import { Sesion } from '../../../../core/servicios/sesion';
import { PremioTienda } from '../../../../core/modelos/dto';
import { NivelPulse, PulseSnapshot } from '../../../../core/modelos/pulse';
import { PulseService } from '../../../../core/servicios/pulse.service';
import { Tienda } from '../../../tienda/services/tienda';
import {
  experienciaDashboard,
  CreatorClassCard,
  StudentDashboardHeroAsset,
} from './panel-alumno.experience';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import {
  ActividadDia,
  EstadoPanelAlumno,
  MotivoErrorPanel,
  PanelAlumnoDto,
  UsuarioPanel,
} from '../../models/panel-alumno.model';
import { Alumno } from '../../services/alumno';
import {
  canonizarTipoExperiencia,
  HomeContextResponse,
  SesionAprendizajeDto,
  SiguienteAccionDto,
} from '../../models/contexto-alumno.model';

export interface AccionVista {
  titulo: string;
  descripcion: string;
  meta: string;
  tipoEtiqueta: string;
  ruta: string | unknown[];
  ctaTexto: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-panel-alumno',
  imports: [RouterLink, FontAwesomeModule, NzAlertModule, NzAvatarModule, NzButtonModule, NzProgressModule, NzIconModule, Cargando],
  templateUrl: './panel-alumno.html',
  styleUrl: './panel-alumno.scss',
})
export class PanelAlumno {
  private readonly alumno = inject(Alumno);
  private readonly sesion = inject(Sesion);
  private readonly activos = inject(Activos);
  private readonly tienda = inject(Tienda);
  readonly pulse = inject(PulseService);

  readonly estado = signal<EstadoPanelAlumno>({ kind: 'loading' });
  readonly homeContext = signal<HomeContextResponse | null>(null);
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
  readonly logroCount = computed(() => this.pulse.achievements().length);
  readonly rachaActual = computed(() => this.pulse.snapshot()?.streak.current ?? null);
  readonly rachaMaxima = computed(() => this.pulse.snapshot()?.streak.longest ?? null);

  readonly nextLiveSession = computed<SesionAprendizajeDto | null>(() => this.homeContext()?.nextLiveSession ?? null);
  readonly currentCourse = computed(() => this.homeContext()?.currentCourse ?? null);
  readonly cohort = computed(() => this.homeContext()?.cohort ?? null);

  /** Premios destacados de la tienda (hasta 4, orden real). Presentacional: no modifica la tienda. */
  readonly premiosDestacados = signal<PremioTienda[]>([]);
  readonly premiosInvalidos = signal<Set<number>>(new Set());

  /**
   * Variante de experiencia del dashboard (KIDS · Explore / TEENS · Creator),
   * derivada del nivel runtime del estudiante vía tema-portal-alumno.
   * Presentacional: no altera datos, rutas ni comportamiento.
   */
  readonly experiencia = computed(() => experienciaDashboard(this.sesion.usuario()?.nivel));
  readonly esKids = computed(() => this.experiencia().experience === 'kids');
  readonly esTeens = computed(() => this.experiencia().experience === 'teens');

  /**
   * Rutas de los assets aprobados del hero (solo KIDS tiene dirección
   * artística; TEENS devuelve cadenas vacías y conserva su stage base).
   */
  readonly heroAssets = computed(() => {
    const lista = this.experiencia().heroAssets ?? [];
    const ruta = (nombre: StudentDashboardHeroAsset['nombre']): string =>
      lista.find((asset) => asset.nombre === nombre)?.ruta ?? '';
    const clouds = lista.filter((asset) => asset.nombre === 'cloud').map((asset) => asset.ruta);
    return {
      background: ruta('background'),
      ground: ruta('ground'),
      flag: ruta('flag'),
      monster: ruta('monster'),
      clouds,
    };
  });

  /**
   * Creator Classes editoriales (TEENS · DESCUBRE). Disciplinas para
   * explorar; NO representan pertenencia del estudiante.
   */
  readonly creatorClasses = computed<readonly CreatorClassCard[]>(() => this.experiencia().creatorClasses ?? []);

  /** Icono de disciplina por clase (sistema de iconos, no assets). */
  readonly iconosClase: Record<CreatorClassCard['id'], IconDefinition> = {
    code: faCode,
    ai: faRobot,
    games: faGamepad,
    maker: faHammer,
  };

  readonly iconos = {
    flecha: faArrowRight,
    check: faCheck,
    fuego: faFire,
    regalo: faGift,
    medalla: faMedal,
    ranking: faRankingStar,
    cohete: faRocket,
    brillo: faWandMagicSparkles,
    cerrar: faXmark,
    bandera: faFlag,
    play: faPlay,
  };

  constructor() {
    this.pulse.ensureSnapshot();
    this.pulse.ensureAchievements();
    effect(() => {
      const snapshot = this.pulse.snapshot();
      if (snapshot) this.detectarCelebracion(snapshot);
    });
    this.cargar(false);
    this.cargarPremiosDestacados();
  }

  /** Lee los primeros 4 premios reales de la tienda; ante cualquier fallo el dashboard queda intacto. */
  private cargarPremiosDestacados(): void {
    this.tienda.premios().subscribe({
      next: (datos) => this.premiosDestacados.set((datos.premios ?? []).slice(0, 4)),
      error: () => this.premiosDestacados.set([]),
    });
  }

  activosUrl(ruta?: string | null): string {
    return this.activos.url(ruta);
  }

  marcarPremioInvalido(id: number): void {
    this.premiosInvalidos.update((actuales) => new Set(actuales).add(id));
  }

  cargar(forzar = true): void {
    const datosAnteriores = this.panel();
    if (!datosAnteriores) {
      this.estado.set({ kind: 'loading' });
    }
    this.actualizando.set(true);

    this.alumno.panel(forzar).subscribe({
      next: (datos) => {
        this.estado.set({ kind: 'ready', data: datos, stale: false });
        const usuarioActual = this.sesion.usuario();
        if (usuarioActual) this.sesion.actualizarUsuario({ ...usuarioActual, ...datos.usuario });
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

    this.alumno.homeContext(forzar).subscribe({
      next: (contexto) => this.homeContext.set(contexto),
      error: () => this.homeContext.set(null),
    });
  }

  accionActual(datos: PanelAlumnoDto): AccionVista | null {
    const next = this.homeContext()?.nextAction;
    if (next) {
      const tipo = next.type;
      let ruta: string | unknown[] = '/alumno/aprender';
      let ctaTexto = 'Continuar';
      let tipoEtiqueta = 'SIGUIENTE ACCIÓN';

      const cursoId = this.currentCourse()?.id ?? next.course?.id;
      const expId = next.experience?.id || next.experience?.sourceId;

      // `nextAction.type` solo canoniza `leccion` → `lesson`; el resto llega con
      // el valor del enum del backend (`mision`, `laboratorio`, …).
      switch (tipo === 'live_session' ? tipo : canonizarTipoExperiencia(tipo)) {
        case 'live_session':
          ruta = '/alumno/agenda';
          ctaTexto = 'Ir a la sesión en vivo';
          tipoEtiqueta = 'SESIÓN EN VIVO';
          break;
        case 'lesson':
          ruta = cursoId && expId
            ? ['/alumno/aprender/curso', cursoId, 'experiencia', expId]
            : (cursoId ? ['/alumno/aprender/curso', cursoId] : '/alumno/aprender');
          ctaTexto = 'Continuar lección';
          tipoEtiqueta = 'LECCIÓN';
          break;
        case 'mission':
          ruta = cursoId && expId
            ? ['/alumno/aprender/curso', cursoId, 'experiencia', expId]
            : (cursoId ? ['/alumno/aprender/curso', cursoId] : '/alumno/aprender');
          ctaTexto = 'Continuar misión';
          tipoEtiqueta = 'MISIÓN';
          break;
        case 'assessment':
          ruta = cursoId && expId
            ? ['/alumno/aprender/curso', cursoId, 'experiencia', expId]
            : (cursoId ? ['/alumno/aprender/curso', cursoId] : '/alumno/aprender');
          ctaTexto = 'Comenzar evaluación';
          tipoEtiqueta = 'EVALUACIÓN';
          break;
        case 'project':
          ruta = cursoId && expId
            ? ['/alumno/aprender/curso', cursoId, 'experiencia', expId]
            : (cursoId ? ['/alumno/aprender/curso', cursoId] : '/alumno/aprender');
          ctaTexto = 'Continuar proyecto';
          tipoEtiqueta = 'PROYECTO';
          break;
        case 'challenge':
          ruta = cursoId && expId
            ? ['/alumno/aprender/curso', cursoId, 'experiencia', expId]
            : (cursoId ? ['/alumno/aprender/curso', cursoId, 'ruta'] : '/alumno/aprender');
          ctaTexto = 'Aceptar reto';
          tipoEtiqueta = 'DESAFÍO';
          break;
        case 'lab':
          ruta = cursoId && expId
            ? ['/alumno/aprender/curso', cursoId, 'experiencia', expId]
            : (cursoId ? ['/alumno/aprender/curso', cursoId] : '/alumno/aprender');
          ctaTexto = 'Entrar al laboratorio';
          tipoEtiqueta = 'LABORATORIO';
          break;
        default:
          ruta = cursoId ? ['/alumno/aprender/curso', cursoId] : '/alumno/aprender';
          ctaTexto = 'Continuar aprendizaje';
          tipoEtiqueta = 'ACTIVIDAD';
      }

      return {
        titulo: next.title,
        descripcion: datos.proxima_mision?.descripcion || 'Continúa con el siguiente paso en tu ruta de aprendizaje.',
        meta: this.metaAccion(next, datos),
        tipoEtiqueta,
        ruta,
        ctaTexto,
      };
    }

    if (datos.proxima_mision) {
      const mision = datos.proxima_mision;
      const cursoId = this.currentCourse()?.id;
      return {
        titulo: mision.titulo,
        descripcion: mision.descripcion || 'Tu docente preparó un nuevo reto para seguir avanzando.',
        meta: `${mision.nivel_requerido} · ${mision.tipo_evidencia}`,
        tipoEtiqueta: this.esKids() ? 'PRÓXIMA MISIÓN' : 'CREA · EN PROGRESO',
        ruta: cursoId ? ['/alumno/aprender/curso', cursoId] : '/alumno/aprender',
        ctaTexto: this.esKids() ? 'Continuar misión' : 'Continuar proyecto',
      };
    }

    return null;
  }

  /**
   * Contexto mostrado bajo la siguiente acción: curso real, si no aula real.
   * No inventa texto: si el backend no da curso ni aula, cae al dato de la
   * próxima misión y, en último término, a una etiqueta genérica de ruta.
   */
  private metaAccion(next: SiguienteAccionDto, datos: PanelAlumnoDto): string {
    const curso = this.currentCourse() ?? next.course ?? null;
    const aula = this.cohort() ?? next.cohort ?? null;
    return curso?.title || aula?.name || datos.proxima_mision?.nivel_requerido || 'Ruta académica';
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

  progreso(): NivelPulse | null {
    return this.pulse.snapshot()?.level ?? null;
  }

  mensajeBienvenida(datos: PanelAlumnoDto): string {
    if (datos.misiones_pendientes > 0) {
      const pendientes = datos.misiones_pendientes;
      return `Tienes ${pendientes} ${pendientes === 1 ? 'misión pendiente' : 'misiones pendientes'} en tu ruta. Continúa donde lo dejaste.`;
    }
    if (datos.proxima_mision) {
      return 'Tu próxima misión ya está lista.';
    }
    return 'Estás al día con tus misiones. Explora un nuevo reto o revisa tu progreso.';
  }

  eyebrowBienvenida(datos: PanelAlumnoDto, tono: 'explore' | 'creator'): string {
    if (datos.misiones_pendientes > 0) {
      return tono === 'creator' ? 'CONTINÚA CREANDO' : 'CONTINÚA APRENDIENDO';
    }
    return 'TODO AL DÍA';
  }

  mensajeRacha(datos: PanelAlumnoDto): string {
    const racha = this.rachaActual();
    if (racha === null) return 'La constancia de Pulse no está disponible en este momento.';
    if (racha === 0) return 'Una actividad válida para Pulse iniciará tu próxima racha.';

    const hoy = datos.actividad_semana.at(-1)?.activo ?? false;
    if (hoy) return 'Hoy ya alimentaste tu Núcleo DAEMON. Buen trabajo.';

    return `Tu racha de ${racha} días sigue viva. Completa una actividad válida hoy para extenderla.`;
  }

  descripcionDia(dia: ActividadDia): string {
    return `${dia.etiqueta}, ${dia.fecha}: ${dia.activo ? 'misión aprobada' : 'sin actividad registrada'}`;
  }

  diasActivos(datos: PanelAlumnoDto): number {
    return datos.actividad_semana.filter((dia) => dia.activo).length;
  }

  cerrarCelebracion(): void {
    this.celebracion.set(null);
  }

  private detectarCelebracion(snapshot: PulseSnapshot): void {
    const usuarioId = this.sesion.usuario()?.id;
    if (!usuarioId) return;

    const clave = `daemon_xp_confirmada_${usuarioId}`;
    const xpActual = snapshot.xpTotal;

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
