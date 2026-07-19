import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowRight,
  faBolt,
  faCircleCheck,
  faClock,
  faFlag,
  faGrip,
  faRotateRight,
  faRocket,
  faTriangleExclamation,
  faWrench,
} from '@fortawesome/free-solid-svg-icons';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { IllustrationSlot } from '../../../../shared/componentes/illustration-slot/illustration-slot';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { Mision, MisionAlumno } from '../../services/mision';

type EstadoMisionVista = 'approved' | 'pending' | 'rejected' | 'available';
type FiltroMision = 'all' | EstadoMisionVista;

interface OpcionMision {
  value: FiltroMision;
  label: string;
  count: number;
  icon: IconDefinition;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lista-misiones',
  imports: [RouterLink, FontAwesomeModule, NzButtonModule, EstadoVacio, IllustrationSlot, MonedaDaemon],
  templateUrl: './lista-misiones.html',
  styleUrl: './lista-misiones.scss',
})
export class ListaMisiones {
  readonly misiones = signal<MisionAlumno[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly filtro = signal<FiltroMision>('all');

  readonly iconos = {
    actualizar: faRotateRight,
    check: faCircleCheck,
    energia: faBolt,
    error: faTriangleExclamation,
    flecha: faArrowRight,
    lista: faGrip,
    pendiente: faClock,
    reparar: faWrench,
    ruta: faFlag,
    cohete: faRocket,
  };

  readonly filtros = computed<OpcionMision[]>(() => {
    const misiones = this.misiones();
    return [
      { value: 'all', label: 'Todas', count: misiones.length, icon: this.iconos.lista },
      { value: 'available', label: 'Disponibles', count: this.contar('available'), icon: this.iconos.ruta },
      { value: 'pending', label: 'En revisión', count: this.contar('pending'), icon: this.iconos.pendiente },
      { value: 'approved', label: 'Completadas', count: this.contar('approved'), icon: this.iconos.check },
      { value: 'rejected', label: 'Por corregir', count: this.contar('rejected'), icon: this.iconos.reparar },
    ];
  });

  readonly misionesFiltradas = computed(() => {
    const filtro = this.filtro();
    return filtro === 'all'
      ? this.misiones()
      : this.misiones().filter((mision) => this.estado(mision) === filtro);
  });

  constructor(private readonly mision: Mision) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.mision.listar().subscribe({
      next: (misiones) => {
        this.misiones.set(misiones);
        this.cargando.set(false);
      },
      error: (problema: unknown) => {
        this.error.set(this.mensajeError(problema));
        this.cargando.set(false);
      },
    });
  }

  seleccionarFiltro(filtro: FiltroMision): void {
    this.filtro.set(filtro);
  }

  estado(mision: MisionAlumno): EstadoMisionVista {
    if (mision.entrega?.estado === 'aprobado') return 'approved';
    if (mision.entrega?.estado === 'pendiente') return 'pending';
    if (mision.entrega?.estado === 'rechazado') return 'rejected';
    return 'available';
  }

  estadoLabel(mision: MisionAlumno): string {
    const estado = this.estado(mision);
    if (estado === 'approved') return 'Completada';
    if (estado === 'pending') return 'En revisión';
    if (estado === 'rejected') return 'Por corregir';
    return 'Disponible';
  }

  etiquetaAccion(mision: MisionAlumno): string {
    return this.estado(mision) === 'rejected' ? 'Corregir entrega' : 'Comenzar misión';
  }

  private contar(estado: EstadoMisionVista): number {
    return this.misiones().filter((mision) => this.estado(mision) === estado).length;
  }

  private mensajeError(problema: unknown): string {
    if (problema instanceof HttpErrorResponse) {
      return problema.error?.message ?? 'No pudimos cargar tus misiones. Revisa tu conexión e inténtalo nuevamente.';
    }
    return 'No pudimos cargar tus misiones. Revisa tu conexión e inténtalo nuevamente.';
  }
}
