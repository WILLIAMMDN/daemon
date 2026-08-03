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
import {
  Canje,
  ConfiguracionMascota,
  CosmeticoPremio,
  EspecieMascota,
  PremioForm,
  PremioTienda,
  RespuestaAdministracionTienda,
  SlotMascota,
} from '../../../../core/modelos/dto';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-gestionar-tienda',
  imports: [FormsModule, CommonModule, Cargando, EstadoVacio, NzTableModule, NzPopconfirmModule, NzModalModule, NzTagModule, NzButtonModule, NzAlertModule, BotonAccion, MonedaDaemon],
  templateUrl: './gestionar-tienda.html',
  styleUrl: './gestionar-tienda.scss',
})
export class GestionarTienda {
  readonly categoriasPremio = CATEGORIAS_PREMIO;
  premios = signal<PremioTienda[]>([]);
  canjes = signal<Canje[]>([]);
  configuracionMascota = signal<ConfiguracionMascota>({ especies: [], slots: [], rarezas: [] });
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  
  modalCrearVisible = signal(false);
  modalEditVisible = signal(false);
  modalEspecieVisible = signal(false);
  /**
   * Objeto en edición: `abrirEditar` garantiza que el cosmético siempre
   * exista (usa `cosmeticoVacio()` como fallback), por eso el template
   * puede acceder a `premioEditando.cosmetico.*` sin guard adicional.
   */
  premioEditando: (PremioTienda & { cosmetico: CosmeticoPremio }) | null = null;
  especieEditando: EspecieMascota | null = null;

  nuevo: PremioForm = this.premioVacio();
  nuevaEspecie: EspecieMascota = this.especieVacia();
  readonly esAdmin = computed(() => this.sesion.usuario()?.rol === 'admin');

  constructor(private tienda: Tienda, private message: NzMessageService, private sesion: Sesion, private activos: Activos) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.tienda.administrar().subscribe({
      next: (datos: RespuestaAdministracionTienda) => {
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
    const primeraEspecie = this.configuracionMascota().especies?.find((especie: EspecieMascota) => especie.activo)?.id;
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
    const datos: PremioForm | Omit<PremioForm, 'cosmetico'> = this.payloadPremio(this.nuevo);
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

  abrirEditar(p: PremioTienda): void {
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
    const datos: PremioForm | Omit<PremioForm, 'cosmetico'> = this.payloadPremio(this.premioEditando);
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

  abrirEspecie(especie?: EspecieMascota): void {
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
    const editando = this.especieEditando;
    const peticion = editando && editando.id != null
      ? this.tienda.actualizarEspecie(editando.id, this.nuevaEspecie)
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

  ordenSugerido(codigo: string, destino: CosmeticoPremio): void {
    const slot = this.configuracionMascota().slots?.find((item: SlotMascota) => item.codigo === codigo);
    if (slot) destino.orden_capa = slot.orden_sugerido;
  }

  /**
   * Envía el cosmético solo cuando el premio es de ese tipo. Evita que el
   * backend cree registros huérfanos para premios físicos o digitales.
   */
  private payloadPremio(form: PremioForm | PremioTienda): PremioForm | Omit<PremioForm, 'cosmetico'> {
    if (form.tipo_entrega !== 'cosmetico') {
      const { cosmetico: _omitido, ...base } = form;
      return base;
    }
    // PremioTienda es estructuralmente compatible con Omit<PremioForm,
    // 'cosmetico'> + cosmetico; el payload conserva id/ya_posee que el
    // backend ignora al crear/editar.
    return form as PremioForm;
  }

  private premioVacio(): PremioForm {
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

  private cosmeticoVacio(): CosmeticoPremio {
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

  private especieVacia(): EspecieMascota {
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
