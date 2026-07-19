import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faBagShopping, faCheck, faDragon, faLock, faRotateRight, faShieldHeart, faShirt, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { Activos } from '../../../../core/servicios/activos';
import { Sesion } from '../../../../core/servicios/sesion';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { Tienda } from '../../services/tienda';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tienda-alumno',
  imports: [RouterLink, FontAwesomeModule, NzButtonModule, NzCardModule, Cargando, EstadoVacio, MonedaDaemon],
  templateUrl: './tienda-alumno.html',
  styleUrl: './tienda-alumno.scss',
})
export class TiendaAlumno {
  private readonly tienda = inject(Tienda);
  private readonly activos = inject(Activos);
  private readonly sesion = inject(Sesion);

  readonly saldo = signal(0);
  readonly premios = signal<any[]>([]);
  readonly imagenesInvalidas = signal<Set<number>>(new Set());
  readonly cargando = signal(true);
  readonly procesando = signal<number | null>(null);
  readonly mensaje = signal('');
  readonly error = signal('');
  readonly iconos = { bolsa: faBagShopping, criatura: faDragon, ropa: faShirt, flecha: faArrowRight, check: faCheck, candado: faLock, actualizar: faRotateRight, escudo: faShieldHeart, brillo: faWandMagicSparkles };

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.tienda.premios().subscribe({
      next: (datos: any) => {
        const saldo = Number(datos.saldo ?? 0);
        this.saldo.set(saldo);
        this.premios.set(datos.premios ?? []);
        this.sincronizarSaldo(saldo);
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
      next: (respuesta: any) => {
        const saldo = Number(respuesta.saldo ?? this.saldo());
        this.saldo.set(saldo);
        this.sincronizarSaldo(saldo);
        this.mensaje.set(
          respuesta.cosmetico
            ? `${respuesta.cosmetico.nombre} ya está en tu vestidor.`
            : respuesta.codigo
              ? `Premio desbloqueado. Código: ${respuesta.codigo}`
              : 'Premio canjeado. Ya aparece en Mis canjes.',
        );
        this.procesando.set(null);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo realizar el canje.');
        this.procesando.set(null);
      },
    });
  }

  puedeCanjear(premio: any): boolean {
    return !premio.ya_posee && this.saldo() >= Number(premio.precio ?? 0) && Number(premio.stock ?? 0) > 0;
  }

  asset(ruta?: string | null): string {
    return this.activos.url(ruta);
  }

  marcarImagenInvalida(id: number): void {
    this.imagenesInvalidas.update((actuales) => new Set(actuales).add(id));
  }

  private sincronizarSaldo(tokens: number): void {
    const usuario = this.sesion.usuario();
    if (usuario) this.sesion.actualizarUsuario({ ...usuario, tokens });
  }
}
