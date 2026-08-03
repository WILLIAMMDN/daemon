import { InjectionToken } from '@angular/core';

export interface ContextoAsistenteCuento {
  readonly audiencia: 'KIDS' | 'TEENS';
  readonly titulo: string;
  readonly categoria: string;
  readonly rangoEdad: string;
  readonly descripcion: string;
  readonly contenidoActual: string;
  readonly imagenRef?: string | null;
  readonly limiteLongitud?: number;
  readonly objetivoPedagogico?: string;
  readonly idioma?: 'es' | 'es-PE';
}

export abstract class AsistenteCuentoGateway {
  abstract generarIdeas(contexto: ContextoAsistenteCuento): Promise<string>;
  abstract continuarHistoria(contexto: ContextoAsistenteCuento): Promise<string>;
  abstract sugerirTitulo(contexto: Omit<ContextoAsistenteCuento, 'imagenRef'>): Promise<string>;
  abstract ayudaGuiada(contexto: Omit<ContextoAsistenteCuento, 'imagenRef'>): Promise<string>;
  abstract cancelar(): void;
}

export const ASISTENTE_CUENTO_GATEWAY = new InjectionToken<AsistenteCuentoGateway>(
  'ASISTENTE_CUENTO_GATEWAY',
);
