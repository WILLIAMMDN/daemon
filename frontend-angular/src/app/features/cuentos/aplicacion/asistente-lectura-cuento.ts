import { Injectable, inject } from '@angular/core';
import { ASISTENTE_CUENTO_GATEWAY } from '../acceso-datos/asistente-cuento.gateway';
import { AudienciaCuento } from '../dominio/cuento.modelo';

@Injectable()
export class AsistenteLecturaCuento {
  private readonly asistente = inject(ASISTENTE_CUENTO_GATEWAY);

  generarTip(titulo: string, audiencia: AudienciaCuento): Promise<string> {
    return this.asistente.ayudaGuiada({
      audiencia,
      titulo: titulo || 'Una gran aventura',
      categoria: 'Lectura',
      rangoEdad: audiencia === 'KIDS' ? '9-12' : '13-17',
      descripcion: '',
      contenidoActual: '',
      limiteLongitud: 140,
      objetivoPedagogico: 'Promover lectura atenta sin revelar la historia.',
      idioma: 'es-PE',
    });
  }
}
