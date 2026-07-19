import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tienda } from '../../../tienda/services/tienda';
import { CommonModule } from '@angular/common';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';

import { NzAlertModule } from 'ng-zorro-antd/alert';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { CATEGORIAS_PREMIO } from '../../../../core/dominio/nivel-alumno';
import { Activos } from '../../../../core/servicios/activos';
import { Sesion } from '../../../../core/servicios/sesion';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-gestionar-tienda',
  imports: [FormsModule, CommonModule, Cargando, EstadoVacio, NzTableModule, NzPopconfirmModule, NzModalModule, NzTagModule, NzButtonModule, NzAlertModule, BotonAccion, MonedaDaemon],
  templateUrl: './gestionar-tienda.html',
  styleUrl: './gestionar-tienda.scss',
})
export class GestionarTienda {
  readonly categoriasPremio = CATEGORIAS_PREMIO;
  premios = signal<any[]>([]);
  canjes = signal<any[]>([]);
  configuracionMascota = signal<any>({ especies: [], slots: [], rarezas: [] });
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  
  modalCrearVisible = signal(false);
  modalEditVisible = signal(false);
  modalEspecieVisible = signal(false);
  premioEditando: any = null;
  especieEditando: any = null;

  nuevo: any = this.premioVacio();
  nuevaEspecie: any = this.especieVacia();
  readonly esAdmin = computed(() => this.sesion.usuario()?.rol === 'admin');

  constructor(private tienda: Tienda, private message: NzMessageService, private sesion: Sesion, private activos: Activos) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.tienda.administrar().subscribe({
      next: (datos: any) => {
        this.premios.set(datos.premios ?? []);
        this.canjes.set(datos.canjes ?? []);
        this.configuracionMascota.set(datos.mascota ?? { especies: [], slots: [], rarezas: [] });
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la tienda.');
        this.cargando.set(false);
      },
    });
  }

  abrirCrear(): void {
    this.nuevo = this.premioVacio();
    const primeraEspecie = this.configuracionMascota().especies?.find((especie: any) => especie.activo)?.id;
    if (primeraEspecie) this.nuevo.cosmetico.especies = [primeraEspecie];
    this.modalCrearVisible.set(true);
  }

  cerrarCrear(): void {
    this.modalCrearVisible.set(false);
  }

  crear(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    const datos = { ...this.nuevo };
    if (datos.tipo_entrega !== 'cosmetico') delete datos.cosmetico;
    this.tienda.crearPremio(datos).subscribe({
      next: () => {
        this.message.success('Premio creado exitosamente.');
        this.guardando.set(false);
        this.cerrarCrear();
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo crear el premio.');
        this.guardando.set(false);
      },
    });
  }

  entregar(id: number): void {
    this.guardando.set(true);
    this.tienda.entregarCanje(id).subscribe({
      next: () => {
        this.message.success('Canje marcado como entregado.');
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'No se pudo entregar el canje.');
        this.guardando.set(false);
      },
    });
  }

  abrirEditar(p: any): void {
    this.premioEditando = {
      ...p,
      cosmetico: p.cosmetico ? { ...p.cosmetico, especies: [...(p.cosmetico.especies ?? [])] } : this.cosmeticoVacio(),
    };
    this.modalEditVisible.set(true);
  }

  cerrarEditar(): void {
    this.modalEditVisible.set(false);
    this.premioEditando = null;
  }

  guardarEdicion(): void {
    if (!this.premioEditando) return;
    this.guardando.set(true);
    const datos = { ...this.premioEditando };
    if (datos.tipo_entrega !== 'cosmetico') delete datos.cosmetico;
    this.tienda.actualizarPremio(this.premioEditando.id, datos).subscribe({
      next: () => {
        this.message.success('Premio actualizado correctamente.');
        this.guardando.set(false);
        this.cerrarEditar();
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'Error al actualizar el premio.');
        this.guardando.set(false);
      }
    });
  }

  eliminar(id: number): void {
    this.tienda.eliminarPremio(id).subscribe({
      next: () => {
        this.message.success('Premio eliminado correctamente.');
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'Error al eliminar el premio.');
      }
    });
  }

  abrirEspecie(especie?: any): void {
    this.especieEditando = especie ?? null;
    this.nuevaEspecie = especie ? { ...especie } : this.especieVacia();
    this.modalEspecieVisible.set(true);
  }

  cerrarEspecie(): void {
    this.modalEspecieVisible.set(false);
    this.especieEditando = null;
  }

  guardarEspecie(): void {
    this.guardando.set(true);
    const peticion = this.especieEditando
      ? this.tienda.actualizarEspecie(this.especieEditando.id, this.nuevaEspecie)
      : this.tienda.crearEspecie(this.nuevaEspecie);
    peticion.subscribe({
      next: () => {
        this.message.success(this.especieEditando ? 'Criatura actualizada.' : 'Criatura base creada.');
        this.guardando.set(false);
        this.cerrarEspecie();
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'No se pudo guardar la criatura.');
        this.guardando.set(false);
      },
    });
  }

  asset(ruta?: string | null): string {
    return this.activos.url(ruta);
  }

  ordenSugerido(codigo: string, destino: any): void {
    const slot = this.configuracionMascota().slots?.find((item: any) => item.codigo === codigo);
    if (slot) destino.orden_capa = slot.orden_sugerido;
  }

  private premioVacio(): any {
    return {
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      imagen: '',
      categoria: 'GENERAL',
      tipo_entrega: 'fisico',
      cosmetico: this.cosmeticoVacio(),
    };
  }

  private cosmeticoVacio(): any {
    return {
      codigo: '',
      slot: 'cabeza',
      rareza: 'comun',
      asset_capa: '',
      asset_miniatura: '',
      orden_capa: 50,
      especies: [],
      activo: true,
    };
  }

  private especieVacia(): any {
    return {
      codigo: '',
      nombre: '',
      descripcion: '',
      asset_base: '',
      asset_miniatura: '',
      lienzo_ancho: 1024,
      lienzo_alto: 1024,
      orden: 20,
      activo: true,
    };
  }
}
