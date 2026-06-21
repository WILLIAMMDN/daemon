import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tienda } from '../../../tienda/services/tienda';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-gestionar-tienda',
  imports: [FormsModule, CommonModule],
  templateUrl: './gestionar-tienda.html',
  styleUrl: './gestionar-tienda.scss',
})
export class GestionarTienda {
  premios = signal<any[]>([]);
  canjes = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  nuevo = { nombre: '', descripcion: '', precio: 0, stock: 0, imagen: '', categoria: 'GENERAL', tipo_entrega: 'fisico' };

  constructor(private tienda: Tienda) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.tienda.administrar().subscribe({
      next: (datos: any) => {
        this.premios.set(datos.premios ?? []);
        this.canjes.set(datos.canjes ?? []);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la tienda.');
        this.cargando.set(false);
      },
    });
  }

  crear(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.tienda.crearPremio(this.nuevo).subscribe({
      next: () => {
        this.nuevo = { nombre: '', descripcion: '', precio: 0, stock: 0, imagen: '', categoria: 'GENERAL', tipo_entrega: 'fisico' };
        this.mensaje.set('Premio creado.');
        this.guardando.set(false);
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
        this.mensaje.set('Canje marcado como entregado.');
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo entregar el canje.');
        this.guardando.set(false);
      },
    });
  }
}
