import { JsonPipe } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../../../core/servicios/api';

export interface CampoAccion { nombre: string; etiqueta: string; tipo?: 'text' | 'number' | 'textarea' | 'select' | 'json' | 'boolean'; opciones?: string[]; valor?: unknown; }
export interface AccionModulo { etiqueta: string; endpoint: string; metodo?: 'post' | 'put' | 'delete'; campos: CampoAccion[]; }
export interface ConfigModulo { titulo: string; descripcion: string; endpoint?: string; accion?: AccionModulo; aviso?: string; }

@Component({
  selector: 'app-pagina-api',
  imports: [FormsModule, JsonPipe],
  templateUrl: './pagina-api.html',
  styleUrl: './pagina-api.scss',
})
export class PaginaApi implements OnInit, OnChanges {
  @Input() configEntrada?: ConfigModulo;

  config: ConfigModulo = { titulo: '', descripcion: '' };
  datos = signal<unknown>(null);
  cargando = signal(false);
  mensaje = signal('');
  error = signal('');
  formulario: Record<string, any> = {};

  constructor(private route: ActivatedRoute, private api: Api) {}

  ngOnInit(): void {
    if (this.configEntrada) {
      this.aplicarConfig(this.configEntrada);
      return;
    }

    this.route.data.subscribe((data) => {
      this.aplicarConfig(data as ConfigModulo);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['configEntrada'] && this.configEntrada) {
      this.aplicarConfig(this.configEntrada);
    }
  }

  cargar(): void {
    if (!this.config.endpoint) { this.datos.set(null); return; }
    this.cargando.set(true); this.error.set('');
    this.api.get(this.config.endpoint).subscribe({
      next: (datos) => { this.datos.set(datos); this.cargando.set(false); },
      error: (e) => { this.error.set(e.error?.message ?? 'No se pudieron cargar los datos.'); this.cargando.set(false); },
    });
  }

  ejecutar(): void {
    const accion = this.config.accion;
    if (!accion) return;
    this.error.set(''); this.mensaje.set('Procesando...');
    const endpoint = accion.endpoint.replace(/\{(\w+)\}/g, (_, clave) => encodeURIComponent(String(this.formulario[clave] ?? '')));
    const cuerpo = this.convertirCampos(accion.campos);
    const peticion = accion.metodo === 'put' ? this.api.put(endpoint, cuerpo) : accion.metodo === 'delete' ? this.api.delete(endpoint) : this.api.post(endpoint, cuerpo);
    peticion.subscribe({
      next: () => { this.mensaje.set('Operacion completada.'); this.cargar(); },
      error: (e) => { this.mensaje.set(''); this.error.set(e.error?.message ?? 'La operacion no pudo completarse.'); },
    });
  }

  lista(): unknown[] {
    const valor = this.datos();
    if (Array.isArray(valor)) return valor;
    if (valor && typeof valor === 'object') return Object.entries(valor).map(([grupo, contenido]) => ({ grupo, contenido }));
    return valor == null ? [] : [valor];
  }

  pares(item: unknown): [string, unknown][] {
    if (!item || typeof item !== 'object') return [['valor', item]];
    return Object.entries(item as Record<string, unknown>).filter(([, valor]) => valor == null || typeof valor !== 'object');
  }

  esImagen(clave: string, valor: unknown): boolean {
    if (typeof valor !== 'string' || !valor.trim()) return false;
    const nombre = clave.toLowerCase();
    const ruta = valor.toLowerCase();

    return /(avatar|imagen|img_|foto|fondo|heroe|insignia|archivo_url)/.test(nombre)
      || /\.(png|jpe?g|gif|webp|svg)$/i.test(ruta)
      || /^(img|uploads|galeria|storage)\//.test(ruta);
  }

  rutaAsset(valor: unknown): string {
    if (typeof valor !== 'string') return '';
    if (/^https?:\/\//i.test(valor) || valor.startsWith('/')) return valor;
    return `/${valor}`;
  }

  complejos(item: unknown): [string, unknown][] {
    if (!item || typeof item !== 'object') return [];
    return Object.entries(item as Record<string, unknown>).filter(([, valor]) => valor != null && typeof valor === 'object');
  }

  private convertirCampos(campos: CampoAccion[]): Record<string, unknown> {
    const salida: Record<string, unknown> = {};
    for (const campo of campos) {
      let valor = this.formulario[campo.nombre];
      if (campo.tipo === 'number' && valor !== '') valor = Number(valor);
      if (campo.tipo === 'json' && typeof valor === 'string' && valor.trim()) valor = JSON.parse(valor);
      salida[campo.nombre] = valor;
    }
    return salida;
  }

  private aplicarConfig(config: ConfigModulo): void {
    this.config = config;
    this.formulario = Object.fromEntries((this.config.accion?.campos ?? []).map((campo) => [campo.nombre, campo.valor ?? (campo.tipo === 'boolean' ? false : '')]));
    this.cargar();
  }
}
