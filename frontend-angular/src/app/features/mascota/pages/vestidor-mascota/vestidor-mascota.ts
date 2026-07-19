import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NzButtonModule } from 'ng-zorro-antd/button';
import {
  faArrowRight,
  faBagShopping,
  faCheck,
  faCoins,
  faDragon,
  faRotateRight,
  faShirt,
  faStar,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { Sesion } from '../../../../core/servicios/sesion';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { MascotaCapa, MascotaCosmetico, MascotaEstado, MascotaSlotCodigo } from '../../models/mascota.models';
import { MascotaService } from '../../services/mascota.service';

type FiltroSlot = 'todos' | MascotaSlotCodigo;

@Component({
  selector: 'app-vestidor-mascota',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, FontAwesomeModule, NzButtonModule, Cargando, EstadoVacio, MonedaDaemon],
  templateUrl: './vestidor-mascota.html',
  styleUrl: './vestidor-mascota.scss',
})
export class VestidorMascota {
  private readonly mascotas = inject(MascotaService);
  private readonly sesion = inject(Sesion);

  readonly estado = signal<MascotaEstado | null>(null);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly slotActivo = signal<FiltroSlot>('todos');
  readonly seleccionId = signal<number | null>(null);
  readonly capasInvalidas = signal<Set<string | number>>(new Set());
  nombreBorrador = '';

  readonly iconos = {
    criatura: faDragon,
    brillo: faStar,
    varita: faWandMagicSparkles,
    ropa: faShirt,
    tienda: faBagShopping,
    moneda: faCoins,
    check: faCheck,
    actualizar: faRotateRight,
    flecha: faArrowRight,
  };

  readonly cosmeticosPoseidos = computed(() => {
    const filtro = this.slotActivo();
    return (this.estado()?.cosmeticos ?? []).filter(
      (item) => item.poseido && (filtro === 'todos' || item.slot === filtro),
    );
  });

  readonly cosmeticosTienda = computed(() =>
    (this.estado()?.cosmeticos ?? []).filter((item) => !item.poseido && item.tienda),
  );

  readonly seleccionado = computed(() => {
    const id = this.seleccionId();
    return this.estado()?.cosmeticos.find((item) => item.id === id) ?? null;
  });

  readonly capasVista = computed<MascotaCapa[]>(() => {
    const estado = this.estado();
    const seleccionado = this.seleccionado();
    if (!estado || !seleccionado || seleccionado.equipado) return estado?.mascota.capas ?? [];

    return [
      ...estado.mascota.capas.filter((capa) => capa.slot !== seleccionado.slot),
      {
        id: `preview-${seleccionado.id}`,
        tipo: 'cosmetico' as const,
        slot: seleccionado.slot,
        orden: seleccionado.orden_capa,
        asset: seleccionado.asset_capa,
        alt: seleccionado.nombre,
      },
    ].sort((a, b) => a.orden - b.orden);
  });

  constructor() {
    this.cargar();
  }

  cargar(fresh = false): void {
    this.cargando.set(true);
    this.error.set('');
    this.mascotas.estado(fresh).subscribe({
      next: (estado) => this.aplicarEstado(estado),
      error: (error) => {
        this.error.set(error.error?.message ?? 'No pudimos abrir el vestidor. Intenta nuevamente.');
        this.cargando.set(false);
      },
    });
  }

  filtrar(slot: FiltroSlot): void {
    this.slotActivo.set(slot);
    const seleccionado = this.seleccionado();
    if (seleccionado && slot !== 'todos' && seleccionado.slot !== slot) this.seleccionId.set(null);
  }

  seleccionar(cosmetico: MascotaCosmetico): void {
    if (!cosmetico.poseido || !cosmetico.compatible || this.guardando()) return;
    this.seleccionId.set(cosmetico.id);
    this.mensaje.set('Vista previa lista. Confirma para guardar el cambio.');
  }

  equiparSeleccion(): void {
    const seleccionado = this.seleccionado();
    if (!seleccionado || seleccionado.equipado) return;
    this.ejecutarCambio(
      this.mascotas.equipar(seleccionado.id),
      `${seleccionado.nombre} ya forma parte de tu look.`,
    );
  }

  quitarSeleccion(): void {
    const seleccionado = this.seleccionado();
    if (!seleccionado?.equipado) return;
    this.seleccionId.set(null);
    this.ejecutarCambio(this.mascotas.quitar(seleccionado.slot), 'Accesorio retirado. Puedes volver a usarlo cuando quieras.');
  }

  guardarNombre(): void {
    const nombre = this.nombreBorrador.trim();
    if (!nombre || nombre === this.estado()?.mascota.nombre || this.guardando()) return;
    this.ejecutarCambio(this.mascotas.actualizar({ nombre }), 'Nombre guardado.');
  }

  cambiarEspecie(id: number): void {
    if (!id || id === this.estado()?.mascota.especie.id || this.guardando()) return;
    this.seleccionId.set(null);
    this.ejecutarCambio(
      this.mascotas.actualizar({ id_especie: id }),
      'Criatura seleccionada. Quitamos automáticamente las capas incompatibles.',
    );
  }

  marcarCapaInvalida(id: string | number): void {
    this.capasInvalidas.update((actuales) => new Set(actuales).add(id));
  }

  private ejecutarCambio(peticion: ReturnType<MascotaService['actualizar']>, mensaje: string): void {
    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');
    peticion.subscribe({
      next: (estado) => {
        this.aplicarEstado(estado);
        this.mensaje.set(mensaje);
        this.guardando.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message ?? 'No se pudo guardar el cambio.');
        this.guardando.set(false);
      },
    });
  }

  private aplicarEstado(estado: MascotaEstado): void {
    this.estado.set(estado);
    this.nombreBorrador = estado.mascota.nombre;
    const seleccionado = this.seleccionId();
    if (seleccionado && !estado.cosmeticos.some((item) => item.id === seleccionado)) this.seleccionId.set(null);
    this.capasInvalidas.set(new Set());
    this.sincronizarSaldo(estado.saldo);
    this.cargando.set(false);
  }

  private sincronizarSaldo(tokens: number): void {
    const usuario = this.sesion.usuario();
    if (usuario) this.sesion.actualizarUsuario({ ...usuario, tokens });
  }
}
