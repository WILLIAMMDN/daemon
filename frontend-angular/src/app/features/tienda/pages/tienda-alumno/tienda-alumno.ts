import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faBagShopping, faCheck, faDragon, faLock, faRotateRight, faShieldHeart, faShirt, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { Activos } from '../../../../core/servicios/activos';
import { PulseService } from '../../../../core/servicios/pulse.service';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { Tienda } from '../../services/tienda';
import { PremioTienda, RespuestaTienda, RespuestaCanje } from '../../../../core/modelos/dto';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tienda-alumno',
  imports: [DatePipe, RouterLink, FontAwesomeModule, NzAlertModule, NzButtonModule, NzCardModule, NzListModule, NzSkeletonModule, Cargando, EstadoVacio, MonedaDaemon],
  templateUrl: './tienda-alumno.html',
  styleUrl: './tienda-alumno.scss',
})
export class TiendaAlumno {
  private readonly tienda = inject(Tienda);
  private readonly activos = inject(Activos);
  readonly pulse = inject(PulseService);

  private readonly saldoTienda = signal<number | null>(null);
  readonly saldo = computed(() => this.pulse.snapshot()?.daemsBalance ?? this.saldoTienda());
  readonly premios = signal<PremioTienda[]>([]);
  readonly imagenesInvalidas = signal<Set<number>>(new Set());
  readonly cargando = signal(true);
  readonly procesando = signal<number | null>(null);
  readonly mensaje = signal('');
  readonly error = signal('');
  readonly iconos = { bolsa: faBagShopping, criatura: faDragon, ropa: faShirt, flecha: faArrowRight, check: faCheck, candado: faLock, actualizar: faRotateRight, escudo: faShieldHeart, brillo: faWandMagicSparkles };

  constructor() {
    this.pulse.ensureSnapshot();
    this.pulse.ensureTransactions();
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.tienda.premios().subscribe({
      next: (datos: RespuestaTienda) => {
        const saldo = Number(datos.saldo ?? 0);
        this.saldoTienda.set(saldo);
        this.premios.set(datos.premios ?? []);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la tienda.');
        this.cargando.set(false);
      },
    });
  }

  canjear(id: number): void {
    this.procesando.set(id);
    this.mensaje.set('');
    this.error.set('');
    this.tienda.canjear(id).subscribe({
      next: (respuesta: RespuestaCanje) => {
        this.mensaje.set(
          respuesta.cosmetico
            ? `${respuesta.cosmetico.nombre} ya está en tu vestidor.`
            : respuesta.codigo
              ? `Premio desbloqueado. Código: ${respuesta.codigo}`
              : 'Premio canjeado. Ya aparece en Mis canjes.',
        );
        this.procesando.set(null);
        this.pulse.refreshAll();
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo realizar el canje.');
        this.procesando.set(null);
      },
    });
  }

  puedeCanjear(premio: PremioTienda): boolean {
    const saldo = this.saldo();
    return saldo !== null && !premio.ya_posee && saldo >= Number(premio.precio ?? 0) && Number(premio.stock ?? 0) > 0;
  }

  asset(ruta?: string | null): string {
    return this.activos.url(ruta);
  }

  marcarImagenInvalida(id: number): void {
    this.imagenesInvalidas.update((actuales) => new Set(actuales).add(id));
  }

  actualizar(): void {
    this.pulse.refreshAll();
    this.cargar();
  }

  etiquetaMoneda(currency: string): string {
    return currency.toLowerCase() === 'xp' ? 'XP' : 'Daems';
  }
}
