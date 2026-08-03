import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Sesion } from '../../../../core/servicios/sesion';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { LecturaCuentoFacade } from '../../aplicacion/lectura-cuento.facade';
import { PROVEEDORES_CUENTOS } from '../../acceso-datos/proveedores-cuentos';
import { CuentoComentariosComponent } from './components/cuento-comentarios/cuento-comentarios.component';
import { CuentoHeroComponent } from './components/cuento-hero/cuento-hero.component';
import { CuentoLecturaComponent } from './components/cuento-lectura/cuento-lectura.component';
import { CuentoSidebarComponent } from './components/cuento-sidebar/cuento-sidebar.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ver-cuento',
  imports: [
    CommonModule,
    Cargando,
    CuentoHeroComponent,
    CuentoLecturaComponent,
    CuentoSidebarComponent,
    CuentoComentariosComponent,
  ],
  providers: [...PROVEEDORES_CUENTOS, LecturaCuentoFacade],
  templateUrl: './ver-cuento.html',
  styleUrl: './ver-cuento.scss',
})
export class VerCuento implements OnInit {
  readonly lectura = inject(LecturaCuentoFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly sesion = inject(Sesion);
  private readonly toast = inject(NzMessageService);

  readonly id = this.route.snapshot.paramMap.get('id') || '';
  readonly datos = this.lectura.datos;
  readonly comentarios = this.lectura.comentarios;
  readonly cargando = this.lectura.cargando;
  readonly error = this.lectura.error;
  readonly esPropietario = this.lectura.esPropietario;
  readonly enviandoComentario = this.lectura.enviandoComentario;
  readonly hayMasComentarios = this.lectura.hayMasComentarios;
  readonly cargandoMasComentarios = this.lectura.cargandoMasComentarios;
  readonly tipAsistente = this.lectura.tipAsistente;
  readonly reaccionesCount = this.lectura.reaccionesCount;
  readonly comentariosCount = this.lectura.comentariosCount;
  readonly miReaccion = this.lectura.miReaccion;
  readonly escalaFuente = signal(1);
  readonly modoLectura = signal(false);
  readonly guardado = signal(false);
  readonly miAvatar = signal(this.sesion.usuario()?.avatar || '/img/avatars/default.png');
  readonly miId = this.lectura.miUid;

  ngOnInit(): void {
    void this.lectura.cargar(this.id);
  }

  cambiarFuente(delta: number): void {
    const nueva = this.escalaFuente() + delta;
    if (nueva >= 0.8 && nueva <= 1.5) this.escalaFuente.set(nueva);
  }

  toggleModoLectura(): void {
    this.modoLectura.update((valor) => !valor);
  }

  toggleGuardar(): void {
    this.guardado.update((valor) => !valor);
  }

  async copiarEnlace(): Promise<void> {
    try {
      await navigator.clipboard.writeText(globalThis.location.href);
      this.toast.success('Enlace copiado.');
    } catch {
      this.toast.error('No pudimos copiar el enlace.');
    }
  }

  reaccionar(tipo: string): void {
    void this.lectura.reaccionar(tipo);
  }

  enviarComentario(contenido: string): void {
    void this.lectura.enviarComentario(contenido);
  }

  editarComentario(evento: { id: string; contenido: string }): void {
    void this.lectura.editarComentario(evento.id, evento.contenido);
  }

  eliminarComentario(id: string): void {
    void this.lectura.eliminarComentario(id);
  }

  cargarMasComentarios(): void {
    void this.lectura.cargarComentarios(true);
  }
}
