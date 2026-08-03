import { Injectable, inject } from '@angular/core';
import { firstValueFrom, retry, Subject, takeUntil } from 'rxjs';
import { Api } from '../../../../core/servicios/api';
import { normalizarErrorCuento } from '../../dominio/errores-cuento';
import { AsistenteCuentoGateway, ContextoAsistenteCuento } from '../asistente-cuento.gateway';

type ModoAsistente = 'ideas' | 'continuar' | 'titulo' | 'ayuda_guiada';

interface RespuestaAsistente {
  readonly texto: string;
}

@Injectable({ providedIn: 'root' })
export class CuentosIaAdapter implements AsistenteCuentoGateway {
  private readonly api = inject(Api);
  private readonly cancelaciones = new Subject<void>();

  generarIdeas(contexto: ContextoAsistenteCuento): Promise<string> {
    return this.solicitar('ideas', contexto);
  }

  continuarHistoria(contexto: ContextoAsistenteCuento): Promise<string> {
    return this.solicitar('continuar', contexto);
  }

  sugerirTitulo(contexto: Omit<ContextoAsistenteCuento, 'imagenRef'>): Promise<string> {
    return this.solicitar('titulo', contexto);
  }

  ayudaGuiada(contexto: Omit<ContextoAsistenteCuento, 'imagenRef'>): Promise<string> {
    return this.solicitar('ayuda_guiada', contexto);
  }

  cancelar(): void {
    this.cancelaciones.next();
  }

  private async solicitar(
    modo: ModoAsistente,
    contexto: Omit<ContextoAsistenteCuento, 'imagenRef'>,
  ): Promise<string> {
    this.cancelar();
    try {
      const respuesta = await firstValueFrom(
        this.api.post<RespuestaAsistente>('/cuentos-v2/ia/asistencia', {
          audiencia: contexto.audiencia,
          modo,
          titulo: contexto.titulo,
          categoria: contexto.categoria,
          banda_edad: contexto.rangoEdad,
          descripcion: contexto.descripcion,
          contenido_previo: contexto.contenidoActual,
          limite_longitud: contexto.limiteLongitud ?? (modo === 'titulo' ? 80 : 900),
          objetivo_pedagogico: contexto.objetivoPedagogico ?? 'Fortalecer escritura creativa y voz propia.',
          idioma: contexto.idioma ?? 'es-PE',
        }).pipe(
          retry({ count: 1, delay: 400 }),
          takeUntil(this.cancelaciones),
        ),
      );
      if (typeof respuesta.texto !== 'string' || !respuesta.texto.trim()) {
        throw new Error('Respuesta de IA vacÃ­a.');
      }
      return respuesta.texto.trim();
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }
}
