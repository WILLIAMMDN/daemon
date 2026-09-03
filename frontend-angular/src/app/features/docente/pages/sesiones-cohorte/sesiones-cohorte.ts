import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ApiError } from '../../../../core/servicios/api';
import {
  CohorteDto,
  SesionCohorteDto,
  SesionPayload,
  SesionesCohorteResponse,
} from '../../models/sesiones-cohorte.model';
import { SesionesCohorte as SesionesCohorteApi } from '../../services/sesiones-cohorte.service';

interface ErrorPagina {
  tipo: 'autorizacion' | 'api';
  mensaje: string;
}

/** El intervalo debe cerrar después de abrir. */
function ventanaValida(control: AbstractControl): ValidationErrors | null {
  const inicio = control.get('inicio')?.value as Date | null;
  const fin = control.get('fin')?.value as Date | null;

  if (!inicio || !fin) {
    return null;
  }

  return fin.getTime() > inicio.getTime() ? null : { ventana: true };
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sesiones-cohorte',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    NzAlertModule,
    NzButtonModule,
    NzDatePickerModule,
    NzDrawerModule,
    NzEmptyModule,
    NzFormModule,
    NzInputModule,
    NzPopconfirmModule,
    NzResultModule,
    NzSelectModule,
    NzSkeletonModule,
    NzTagModule,
  ],
  templateUrl: './sesiones-cohorte.html',
  styleUrl: './sesiones-cohorte.scss',
})
export class SesionesCohorteDocente {
  private readonly sesionesApi = inject(SesionesCohorteApi);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  readonly cohortes = signal<CohorteDto[]>([]);
  readonly cohorteSeleccionada = signal<number | null>(null);
  readonly detalle = signal<SesionesCohorteResponse | null>(null);
  readonly cargandoCohortes = signal(true);
  readonly cargandoSesiones = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<ErrorPagina | null>(null);

  readonly drawerAbierto = signal(false);
  readonly sesionEditando = signal<SesionCohorteDto | null>(null);

  readonly cohorte = computed(() => this.detalle()?.cohort ?? null);
  readonly proxima = computed(() => this.detalle()?.nextSession ?? null);
  readonly siguientes = computed(() => this.detalle()?.upcoming.slice(1) ?? []);
  readonly pasadas = computed(() => this.detalle()?.past ?? []);
  readonly canceladas = computed(() => this.detalle()?.cancelled ?? []);
  readonly semanas = computed(() => this.detalle()?.delivery.weeks ?? []);
  readonly sinSesiones = computed(() => {
    const detalle = this.detalle();
    return !!detalle && !detalle.upcoming.length && !detalle.past.length && !detalle.cancelled.length;
  });

  readonly formulario = this.fb.nonNullable.group(
    {
      titulo: ['', [Validators.required, Validators.maxLength(150)]],
      inicio: this.fb.control<Date | null>(null, Validators.required),
      fin: this.fb.control<Date | null>(null),
      accesoUrl: ['', Validators.pattern(/^https?:\/\/\S+$/)],
      descripcion: ['', Validators.maxLength(4000)],
    },
    { validators: ventanaValida },
  );

  constructor() {
    this.cargarCohortes();
  }

  cargarCohortes(): void {
    this.cargandoCohortes.set(true);
    this.error.set(null);

    this.sesionesApi.cohortes(true).subscribe({
      next: (respuesta) => {
        this.cohortes.set(respuesta.cohorts);
        this.cargandoCohortes.set(false);
        const primera = respuesta.cohorts[0];
        if (primera) {
          this.seleccionarCohorte(primera.id);
        }
      },
      error: (fallo) => {
        this.cargandoCohortes.set(false);
        this.error.set(this.clasificar(fallo, 'No pudimos cargar tus cohortes.'));
      },
    });
  }

  seleccionarCohorte(aulaId: number): void {
    this.cohorteSeleccionada.set(aulaId);
    this.cargarSesiones();
  }

  cargarSesiones(): void {
    const aulaId = this.cohorteSeleccionada();
    if (!aulaId) {
      return;
    }

    this.cargandoSesiones.set(true);
    this.error.set(null);

    this.sesionesApi.sesiones(aulaId).subscribe({
      next: (respuesta) => {
        this.detalle.set(respuesta);
        this.cargandoSesiones.set(false);
      },
      error: (fallo) => {
        this.detalle.set(null);
        this.cargandoSesiones.set(false);
        this.error.set(this.clasificar(fallo, 'No pudimos cargar las sesiones de esta cohorte.'));
      },
    });
  }

  abrirCreacion(): void {
    this.sesionEditando.set(null);
    this.formulario.reset({ titulo: '', inicio: null, fin: null, accesoUrl: '', descripcion: '' });
    this.drawerAbierto.set(true);
  }

  abrirEdicion(sesion: SesionCohorteDto): void {
    this.sesionEditando.set(sesion);
    this.formulario.reset({
      titulo: sesion.title,
      inicio: new Date(sesion.startsAt),
      fin: sesion.endsAt ? new Date(sesion.endsAt) : null,
      accesoUrl: sesion.accessUrl ?? '',
      descripcion: sesion.description ?? '',
    });
    this.drawerAbierto.set(true);
  }

  cerrarDrawer(): void {
    this.drawerAbierto.set(false);
    this.sesionEditando.set(null);
  }

  guardar(): void {
    const aulaId = this.cohorteSeleccionada();
    if (!aulaId) {
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.formulario.updateValueAndValidity();
      return;
    }

    const valores = this.formulario.getRawValue();
    const payload: SesionPayload = {
      titulo: valores.titulo.trim(),
      descripcion: valores.descripcion.trim() || null,
      // El backend guarda en UTC; enviamos ISO para no perder el desfase local.
      inicio_at: valores.inicio!.toISOString(),
      fin_at: valores.fin ? valores.fin.toISOString() : null,
      acceso_url: valores.accesoUrl.trim() || null,
    };

    const editando = this.sesionEditando();
    const peticion = editando
      ? this.sesionesApi.actualizar(editando.id, { ...payload, estado: editando.status as SesionPayload['estado'] })
      : this.sesionesApi.crear(aulaId, payload);

    this.guardando.set(true);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.message.success(editando ? 'Sesión actualizada.' : 'Sesión creada.');
        this.cerrarDrawer();
        this.cargarSesiones();
      },
      error: (fallo) => {
        this.guardando.set(false);
        this.message.error(this.mensajeDeError(fallo, 'No se pudo guardar la sesión.'));
      },
    });
  }

  cancelarSesion(sesion: SesionCohorteDto): void {
    this.sesionesApi.cancelar(sesion).subscribe({
      next: () => {
        this.message.success('Sesión cancelada.');
        this.cargarSesiones();
      },
      error: (fallo) => {
        this.message.error(this.mensajeDeError(fallo, 'No se pudo cancelar la sesión.'));
      },
    });
  }

  etiquetaEstado(sesion: SesionCohorteDto): string {
    switch (sesion.status) {
      case 'scheduled':
        return 'Programada';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Finalizada';
      default:
        return sesion.status;
    }
  }

  colorEstado(sesion: SesionCohorteDto): string {
    switch (sesion.status) {
      case 'scheduled':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  }

  private clasificar(fallo: unknown, porDefecto: string): ErrorPagina {
    const estado = (fallo as { status?: number })?.status;
    if (estado === 401 || estado === 403) {
      return {
        tipo: 'autorizacion',
        mensaje: 'No tienes permisos para operar las sesiones de esta cohorte.',
      };
    }

    return { tipo: 'api', mensaje: this.mensajeDeError(fallo, porDefecto) };
  }

  private mensajeDeError(fallo: unknown, porDefecto: string): string {
    if (fallo instanceof ApiError) {
      return fallo.kind === 'offline'
        ? 'Sin conexión con el servidor.'
        : 'El servidor tardó demasiado en responder.';
    }

    const cuerpo = (fallo as { error?: { message?: string } })?.error;
    return cuerpo?.message ?? porDefecto;
  }
}
