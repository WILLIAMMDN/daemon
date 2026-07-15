import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faBolt, faClock, faCreditCard, faEnvelopeOpenText, faRankingStar, faRotate, faShieldHeart } from '@fortawesome/free-solid-svg-icons';
import { Sesion } from '../../../../core/servicios/sesion';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { InvitacionFamiliar, LimitePantallaPayload, PanelFamiliasDto } from '../../models/familias.model';
import { Familias } from '../../services/familias';

type EstadoPanel =
  | { kind: 'verification' }
  | { kind: 'loading' }
  | { kind: 'ready'; data: PanelFamiliasDto }
  | { kind: 'error'; message: string };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-panel-familias',
  imports: [FormsModule, FontAwesomeModule, Cargando],
  templateUrl: './panel-familias.html',
  styleUrl: './panel-familias.scss',
})
export class PanelFamilias implements OnInit {
  readonly estado = signal<EstadoPanel>({ kind: 'loading' });
  readonly panel = computed(() => this.estado().kind === 'ready' ? (this.estado() as { kind: 'ready'; data: PanelFamiliasDto }).data : null);
  readonly invitaciones = signal<InvitacionFamiliar[]>([]);
  readonly guardando = signal(false);
  readonly aceptando = signal<number | null>(null);
  readonly mensaje = signal('');
  readonly iconos = {
    actualizar: faRotate, carta: faEnvelopeOpenText, xp: faBolt, ranking: faRankingStar,
    reloj: faClock, pago: faCreditCard, escudo: faShieldHeart, flecha: faArrowRight,
  };
  parentesco: Record<number, 'madre' | 'padre' | 'tutor'> = {};
  limite: LimitePantallaPayload = {
    activo: false,
    max_minutos_diarios: 90,
    hora_silencio_inicio: null,
    hora_silencio_fin: null,
    zona_horaria: 'America/Lima',
  };

  constructor(
    private readonly familias: Familias,
    readonly sesion: Sesion,
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(alumnoId?: number): void {
    this.mensaje.set('');
    if (this.sesion.usuario()?.email_verificado !== true) {
      this.estado.set({ kind: 'verification' });
      return;
    }

    this.estado.set({ kind: 'loading' });
    this.familias.panel(alumnoId).subscribe({
      next: (data) => {
        this.estado.set({ kind: 'ready', data });
        this.sincronizarLimite(data);
        this.cargarInvitaciones();
      },
      error: (error) => this.estado.set({ kind: 'error', message: error?.error?.message ?? 'No pudimos cargar el reporte familiar.' }),
    });
  }

  seleccionarHijo(valor: string): void {
    const id = Number(valor);
    if (Number.isInteger(id) && id > 0) this.cargar(id);
  }

  aceptar(invitacion: InvitacionFamiliar): void {
    this.aceptando.set(invitacion.id);
    this.mensaje.set('');
    this.familias.aceptarInvitacion(invitacion.id, this.parentesco[invitacion.id] ?? 'tutor').subscribe({
      next: (respuesta) => {
        this.aceptando.set(null);
        this.mensaje.set('Vínculo familiar confirmado. Ya puedes ver el reporte de aprendizaje.');
        this.cargar(respuesta.alumno_id);
      },
      error: (error) => {
        this.aceptando.set(null);
        this.mensaje.set(error?.error?.message ?? 'No pudimos confirmar el vínculo.');
      },
    });
  }

  guardarLimite(): void {
    const alumno = this.panel()?.seleccionado?.alumno;
    if (!alumno) return;
    this.guardando.set(true);
    this.mensaje.set('');
    this.familias.actualizarLimite(alumno.id, this.limite).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mensaje.set('Límite de bienestar actualizado. El portal del estudiante ya lo aplicará.');
        this.cargar(alumno.id);
      },
      error: (error) => {
        this.guardando.set(false);
        this.mensaje.set(error?.error?.message ?? 'No pudimos guardar el límite.');
      },
    });
  }

  importe(centimos?: number | null, moneda = 'PEN'): string {
    if (centimos == null) return 'Por definir';
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(centimos / 100);
  }

  fecha(valor?: string | null): string {
    if (!valor) return 'Sin fecha registrada';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return 'Sin fecha registrada';
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(fecha);
  }

  private cargarInvitaciones(): void {
    this.familias.invitaciones().subscribe({
      next: ({ invitaciones }) => {
        this.invitaciones.set(invitaciones);
        invitaciones.forEach((item) => { this.parentesco[item.id] ??= 'tutor'; });
      },
      error: () => this.invitaciones.set([]),
    });
  }

  private sincronizarLimite(data: PanelFamiliasDto): void {
    const bienestar = data.seleccionado?.bienestar_digital;
    if (!bienestar) return;
    this.limite = {
      activo: bienestar.activo,
      max_minutos_diarios: bienestar.max_minutos_diarios ?? 90,
      hora_silencio_inicio: bienestar.hora_silencio_inicio?.slice(0, 5) ?? null,
      hora_silencio_fin: bienestar.hora_silencio_fin?.slice(0, 5) ?? null,
      zona_horaria: bienestar.zona_horaria || 'America/Lima',
    };
  }
}
