import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Api } from '../../../../core/servicios/api';
import {
  AudienciaCuento,
  Cuento,
  CuentoDetalle,
  DatosBorradorCuento,
  IdentidadBorradorCuento,
  VERSION_ESQUEMA_CUENTO,
} from '../../dominio/cuento.modelo';
import { ComentarioCuento } from '../../dominio/comentario-cuento.modelo';
import { ErrorCuento, normalizarErrorCuento } from '../../dominio/errores-cuento';
import { PaginaCuento } from '../../dominio/pagina-cuento.modelo';
import { CuentoRepositorio, CursorCuentos, PaginaResultados } from '../cuento.repositorio';

interface CuentoApiDto {
  id: string;
  autor_uid: string;
  autor_usuario_id: number | null;
  autor_perfil: { nombre: string; avatar_ref: string | null } | null;
  titulo: string;
  descripcion: string;
  portada_ref: string | null;
  categoria: string;
  rango_edad: string;
  paginas_borrador: number;
  palabras: number;
  estado: string;
  visibilidad: string;
  audiencia: string;
  moderacion: string;
  estadisticas: { comentarios: number; reacciones: number; lecturas: number };
  version_borrador_id: string;
  version_publicada_id: string | null;
  created_at_ms: number | null;
  updated_at_ms: number | null;
  published_at_ms: number | null;
  schema_version: number;
}

interface VersionApiDto {
  id: string;
  cuento_id: string;
  autor_uid: string;
  titulo: string;
  sinopsis: string;
  categoria: string;
  rango_edad: string;
  portada_ref: string | null;
  paginas: number;
  idioma: string;
  palabras: number;
  tiempo_lectura: number;
  revision: number;
  created_at_ms: number | null;
  updated_at_ms: number | null;
  schema_version: number;
}

interface PaginaApiDto {
  id: string;
  cuento_id: string;
  version_id: string;
  orden: number;
  contenido: string;
  ilustracion_ref: string | null;
  texto_alternativo: string;
  fondo_token: string;
  created_at_ms: number | null;
  updated_at_ms: number | null;
  schema_version: number;
}

interface DetalleApiDto {
  cuento: CuentoApiDto;
  version: VersionApiDto | null;
  paginas: readonly PaginaApiDto[];
}

interface ComentarioApiDto {
  id: string;
  cuento_id: string;
  autor_uid: string;
  cuerpo: string;
  estado: string;
  created_at_ms: number | null;
  updated_at_ms: number | null;
  schema_version: number;
}

interface PaginaApiDtoRespuesta {
  elementos: readonly CuentoApiDto[];
  siguiente_cursor: unknown;
}

interface CuentoLegacyDetalleApiDto {
  id: number;
  id_alumno: number | null;
  titulo: string;
  contenido: string;
  data_1: string | null;
  data_2: string | null;
  data_3: string | null;
  data_4: string | null;
  data_5: string | null;
  data_6: string | null;
  img_1: string | null;
  img_2: string | null;
  img_3: string | null;
  img_4: string | null;
  img_5: string | null;
  img_6: string | null;
  fecha_creacion: string;
}

/**
 * Forma del cuento legacy en el listado público de CuentoService::galeria().
 * La API devuelve una colección plana (no envuelta en "elementos").
 */
interface CuentoLegacyListaApiDto {
  id: number;
  id_alumno: number | null;
  titulo: string | null;
  contenido: string | null;
  autor: string | null;
  avatar: string | null;
  fecha_creacion: string | null;
  data_1: string | null;
  data_2: string | null;
  data_3: string | null;
  data_4: string | null;
  data_5: string | null;
  data_6: string | null;
  img_1: string | null;
  img_2: string | null;
  img_3: string | null;
  img_4: string | null;
  img_5: string | null;
  img_6: string | null;
  reacciones_count: number | null;
  publicado: boolean;
}

/**
 * Repositorio de cuentos v2 que NUNCA toca Firestore directamente desde
 * el navegador. Todas las lecturas pasan por el API de Laravel, que a su
 * vez consulta Firestore server-side con la cuenta de servicio. Esto evita
 * que extensiones del navegador (que bloquean firestore.googleapis.com)
 * rompan la galería, y no exige una sesión de Firebase activa para leer
 * contenido público.
 */
@Injectable({ providedIn: 'root' })
export class ApiCuentoRepositorio implements CuentoRepositorio {
  private readonly api = inject(Api);

  reservarIdentidad(): IdentidadBorradorCuento {
    // Los IDs los genera el cliente igual que Firestore: 20 caracteres
    // alfanuméricos. El backend los valida con /^[A-Za-z0-9_-]{1,128}$/.
    const cuentoId = this.idAleatorio();
    const versionId = this.idAleatorio();
    return { cuentoId, versionId };
  }

  async crearBorrador(datos: DatosBorradorCuento, audiencia: AudienciaCuento): Promise<CuentoDetalle> {
    try {
      await firstValueFrom(
        this.api.post('/cuentos-v2/borradores', {
          cuento_id: datos.cuentoId,
          version_id: datos.versionId,
        }),
      );
      return await this.guardarVersion(datos);
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async actualizarBorrador(datos: DatosBorradorCuento): Promise<CuentoDetalle> {
    try {
      return await this.guardarVersion(datos);
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  /**
   * Guarda la versión de borrador completa en el backend.
   */
  private async guardarVersion(datos: DatosBorradorCuento): Promise<CuentoDetalle> {
    const detalle = await firstValueFrom(
      this.api.put<DetalleApiDto>(`/cuentos-v2/borradores/${encodeURIComponent(datos.cuentoId)}`, {
        cuento_id: datos.cuentoId,
        version_id: datos.versionId,
        titulo: datos.titulo,
        sinopsis: datos.sinopsis,
        categoria: datos.categoria,
        rango_edad: datos.rangoEdad,
        portada_ref: datos.portadaRef,
        revision_esperada: datos.revisionEsperada,
        paginas: datos.paginas.map((pagina, indice) => ({
          id: pagina.id,
          orden: indice + 1,
          contenido: pagina.contenido,
          ilustracion_ref: pagina.ilustracionRef,
          texto_alternativo: pagina.textoAlternativo,
          fondo_token: pagina.fondoToken,
        })),
      }),
    );
    if (!detalle.cuento || !detalle.version) {
      throw new ErrorCuento('DATOS_INVALIDOS', 'El servidor devolvió un borrador inválido.', false);
    }
    return {
      cuento: this.mapearCuento(detalle.cuento),
      version: this.mapearVersion(detalle.version),
      paginas: (detalle.paginas ?? []).map((pagina) => this.mapearPagina(pagina)),
    };
  }

  async obtenerDetalle(cuentoId: string): Promise<CuentoDetalle> {
    try {
      // Cuentos legacy (v1, PostgreSQL) se sirven por el endpoint legacy.
      if (cuentoId.startsWith('legacy-')) {
        return await this.obtenerDetalleLegacy(cuentoId);
      }
      const respuesta = await firstValueFrom(
        this.api.get<DetalleApiDto>(`/cuentos-v2/${encodeURIComponent(cuentoId)}`, { fresh: true }),
      );
      if (!respuesta.cuento || !respuesta.version || !Array.isArray(respuesta.paginas)) {
        throw new ErrorCuento('DATOS_INVALIDOS', 'El servidor devolvió un cuento inválido.', false);
      }
      return {
        cuento: this.mapearCuento(respuesta.cuento),
        version: this.mapearVersion(respuesta.version),
        paginas: respuesta.paginas.map((pagina) => this.mapearPagina(pagina)),
      };
    } catch {
      // Fallback: si el ID es numérico, intentar el endpoint legacy que sí
      // está en producción.
      const idNumerico = Number(cuentoId);
      if (Number.isInteger(idNumerico) && idNumerico > 0) {
        try {
          return await this.obtenerDetalleLegacy(`legacy-${idNumerico}`);
        } catch {
          throw new ErrorCuento('NO_ENCONTRADO', 'El cuento solicitado no existe.', false);
        }
      }
      throw new ErrorCuento('NO_ENCONTRADO', 'El cuento solicitado no existe.', false);
    }
  }

  /**
   * Detalle de un cuento legacy desde PostgreSQL. El backend responde con
   * { cuento: {...}, autor: {...} } usando el contrato de CuentoService.
   */
  private async obtenerDetalleLegacy(cuentoId: string): Promise<CuentoDetalle> {
    const idNumerico = Number(cuentoId.replace(/^legacy-/, ''));
    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
      throw new ErrorCuento('NO_ENCONTRADO', 'Cuento no encontrado.', false);
    }
    const respuesta = await firstValueFrom(
      this.api.get<{
        cuento: CuentoLegacyDetalleApiDto;
        autor: { nombre_completo: string; avatar: string | null };
      }>(`/cuentos/${idNumerico}`, { fresh: true }),
    );
    const timestamp = this.legacyTimestamp(respuesta.cuento.fecha_creacion);
    const contenido = respuesta.cuento.contenido ?? '';
    const paginas = [respuesta.cuento.data_1, respuesta.cuento.data_2, respuesta.cuento.data_3,
      respuesta.cuento.data_4, respuesta.cuento.data_5, respuesta.cuento.data_6]
      .filter((valor): valor is string => typeof valor === 'string' && valor.trim().length > 0);
    const paginasModelo: PaginaCuento[] = paginas.map((contenidoPagina, indice) => ({
      id: `pagina-${indice + 1}`,
      cuentoId,
      versionId: `legacy-v1-${idNumerico}`,
      orden: indice + 1,
      contenido: contenidoPagina,
      ilustracionRef: this.campoImagenLegacy(respuesta.cuento, indice),
      textoAlternativo: '',
      fondoToken: 'var(--daemon-surface)',
      sugerencia: null,
      creadoEn: { milisegundos: timestamp },
      actualizadoEn: { milisegundos: timestamp },
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    }));
    return {
      cuento: {
        id: cuentoId,
        autorUid: `legacy-${respuesta.cuento.id_alumno ?? ''}`,
        autorUsuarioId: respuesta.cuento.id_alumno ?? null,
        autor: {
          nombre: respuesta.autor?.nombre_completo || 'Autor DAEMON',
          avatarRef: respuesta.autor?.avatar ?? null,
        },
        titulo: respuesta.cuento.titulo || 'Historia sin título',
        descripcion: contenido.substring(0, 200),
        portadaRef: this.campoImagenLegacy(respuesta.cuento, 0),
        categoria: 'Sin clasificar',
        rangoEdad: '',
        paginasBorrador: paginas.length,
        palabras: 0,
        estado: 'publicado',
        visibilidad: 'comunidad',
        audiencia: 'TEENS',
        moderacion: 'aprobado',
        estadisticas: { comentarios: 0, reacciones: 0, lecturas: 0 },
        versionBorradorId: `legacy-v1-${idNumerico}`,
        versionPublicadaId: null,
        creadoEn: { milisegundos: timestamp },
        actualizadoEn: { milisegundos: timestamp },
        publicadoEn: { milisegundos: timestamp },
        schemaVersion: VERSION_ESQUEMA_CUENTO,
      },
      version: {
        id: `legacy-v1-${idNumerico}`,
        cuentoId,
        autorUid: `legacy-${respuesta.cuento.id_alumno ?? ''}`,
        titulo: respuesta.cuento.titulo || 'Historia sin título',
        sinopsis: contenido.substring(0, 200),
        categoria: 'Sin clasificar',
        rangoEdad: '',
        portadaRef: this.campoImagenLegacy(respuesta.cuento, 0),
        paginas: paginas.length,
        idioma: 'es-PE',
        palabras: 0,
        tiempoLecturaMinutos: Math.max(1, paginas.length),
        revision: 0,
        creadoEn: { milisegundos: timestamp },
        actualizadoEn: { milisegundos: timestamp },
        schemaVersion: VERSION_ESQUEMA_CUENTO,
      },
      paginas: paginasModelo,
    };
  }

  private campoImagenLegacy(cuento: CuentoLegacyDetalleApiDto, indice: number): string | null {
    const campos = ['img_1', 'img_2', 'img_3', 'img_4', 'img_5', 'img_6'] as const;
    const valor = cuento[campos[indice] ?? 'img_1'];
    return typeof valor === 'string' && valor !== '' ? valor : null;
  }

  /**
   * Mapea un cuento legacy del listado público al modelo Cuento.
   */
  private mapearCuentoLegacy(datos: CuentoLegacyListaApiDto): Cuento {
    const timestamp = this.legacyTimestamp(datos.fecha_creacion ?? '');
    const portada = this.primerImagenLegacy(datos);
    const paginas = [datos.data_1, datos.data_2, datos.data_3, datos.data_4, datos.data_5, datos.data_6]
      .filter((valor): valor is string => typeof valor === 'string' && valor.trim().length > 0);

    return {
      id: `legacy-${datos.id}`,
      autorUid: `legacy-${datos.id_alumno ?? ''}`,
      autorUsuarioId: datos.id_alumno ?? null,
      autor: {
        nombre: datos.autor || 'Autor DAEMON',
        avatarRef: datos.avatar || null,
      },
      titulo: datos.titulo || 'Historia sin título',
      descripcion: (datos.contenido ?? '').substring(0, 200),
      portadaRef: portada,
      categoria: 'Sin clasificar',
      rangoEdad: '',
      paginasBorrador: paginas.length,
      palabras: 0,
      estado: 'publicado',
      visibilidad: 'comunidad',
      audiencia: 'TEENS',
      moderacion: 'aprobado',
      estadisticas: {
        comentarios: 0,
        reacciones: datos.reacciones_count ?? 0,
        lecturas: 0,
      },
      versionBorradorId: `legacy-v1-${datos.id}`,
      versionPublicadaId: null,
      creadoEn: { milisegundos: timestamp },
      actualizadoEn: { milisegundos: timestamp },
      publicadoEn: { milisegundos: timestamp },
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    };
  }

  private primerImagenLegacy(datos: CuentoLegacyListaApiDto): string | null {
    for (const campo of ['img_1', 'img_2', 'img_3', 'img_4', 'img_5', 'img_6'] as const) {
      const valor = datos[campo];
      if (typeof valor === 'string' && valor !== '') return valor;
    }
    return null;
  }

  async listarGaleria(_cursor?: CursorCuentos, limite = 24): Promise<PaginaResultados<Cuento>> {
    try {
      const respuesta = await firstValueFrom(
        this.api.get<PaginaApiDtoRespuesta>('/cuentos-v2/galeria', {
          fresh: true,
          freshForMs: 30_000,
        }),
      );
      return {
        elementos: respuesta.elementos.map((item) => this.mapearCuento(item)),
        siguienteCursor: null,
      };
    } catch {
      // Fallback resiliente: si el endpoint v2 aún no está desplegado (404),
      // servimos la galería legacy de PostgreSQL que sí está en producción.
      return this.listarGaleriaLegacy(limite);
    }
  }

  /**
   * Galería legacy desde GET /cuentos (CuentoService::galeria). Devuelve
   * una colección plana de cuentos v1 mapeados al modelo v2.
   */
  private async listarGaleriaLegacy(limite: number): Promise<PaginaResultados<Cuento>> {
    try {
      const respuesta = await firstValueFrom(
        this.api.get<readonly CuentoLegacyListaApiDto[]>('/cuentos', { fresh: true }),
      );
      return {
        elementos: respuesta.slice(0, Math.min(Math.max(limite, 1), 50))
          .map((cuento) => this.mapearCuentoLegacy(cuento)),
        siguienteCursor: null,
      };
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  async listarPropios(limite = 20): Promise<readonly Cuento[]> {
    try {
      const respuesta = await firstValueFrom(
        this.api.get<readonly CuentoApiDto[]>('/cuentos-v2/mios', { fresh: true }),
      );
      return respuesta.map((item) => this.mapearCuento(item));
    } catch {
      // Fallback: cuento propio legacy (la cuenta tiene a lo sumo uno).
      try {
        const cuento = await firstValueFrom(
          this.api.get<CuentoLegacyDetalleApiDto | null>('/cuentos/mio/actual', { fresh: true }),
        );
        if (!cuento) return [];
        const detalle = await this.obtenerDetalleLegacy(`legacy-${cuento.id}`);
        return [detalle.cuento];
      } catch {
        return [];
      }
    }
  }

  async listarComentarios(
    cuentoId: string,
    _cursor?: CursorCuentos,
    limite = 20,
  ): Promise<PaginaResultados<ComentarioCuento>> {
    try {
      const respuesta = await firstValueFrom(
        this.api.get<{ elementos: readonly ComentarioApiDto[]; siguiente_cursor: unknown }>(
          `/cuentos-v2/${encodeURIComponent(cuentoId)}/comentarios`,
          { fresh: true },
        ),
      );
      return {
        elementos: respuesta.elementos.map((item) => this.mapearComentario(cuentoId, item)),
        siguienteCursor: null,
      };
    } catch (error) {
      throw normalizarErrorCuento(error);
    }
  }

  /**
   * Parsea fechas legacy ("YYYY-MM-DD HH:MM:SS") de forma compatible con
   * Safari/WebKit, que rechaza ese formato en new Date().
   */
  private legacyTimestamp(fecha: string): number {
    const normalizada = fecha.includes('T')
      ? fecha
      : `${fecha.replace(' ', 'T')}${fecha.endsWith('Z') ? '' : 'Z'}`;
    const tiempo = Date.parse(normalizada);
    return Number.isFinite(tiempo) ? tiempo : Date.now();
  }

  private mapearCuento(datos: CuentoApiDto): Cuento {
    return {
      id: datos.id,
      autorUid: datos.autor_uid,
      autorUsuarioId: datos.autor_usuario_id,
      autor: datos.autor_perfil
        ? { nombre: datos.autor_perfil.nombre, avatarRef: datos.autor_perfil.avatar_ref }
        : null,
      titulo: datos.titulo || '',
      descripcion: datos.descripcion || '',
      portadaRef: datos.portada_ref,
      categoria: datos.categoria || 'Sin clasificar',
      rangoEdad: datos.rango_edad || '',
      paginasBorrador: datos.paginas_borrador,
      palabras: datos.palabras,
      estado: this.esEstado(datos.estado) ? datos.estado : 'borrador',
      visibilidad: this.esVisibilidad(datos.visibilidad) ? datos.visibilidad : 'privado',
      audiencia: datos.audiencia === 'TEENS' ? 'TEENS' : 'KIDS',
      moderacion: this.esModeracion(datos.moderacion) ? datos.moderacion : 'no_solicitada',
      estadisticas: {
        comentarios: datos.estadisticas?.comentarios ?? 0,
        reacciones: datos.estadisticas?.reacciones ?? 0,
        lecturas: datos.estadisticas?.lecturas ?? 0,
      },
      versionBorradorId: datos.version_borrador_id,
      versionPublicadaId: datos.version_publicada_id,
      creadoEn: { milisegundos: datos.created_at_ms ?? Date.now() },
      actualizadoEn: { milisegundos: datos.updated_at_ms ?? Date.now() },
      publicadoEn: datos.published_at_ms ? { milisegundos: datos.published_at_ms } : null,
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    };
  }

  private mapearVersion(datos: VersionApiDto) {
    return {
      id: datos.id,
      cuentoId: datos.cuento_id,
      autorUid: datos.autor_uid,
      titulo: datos.titulo,
      sinopsis: datos.sinopsis,
      categoria: datos.categoria,
      rangoEdad: datos.rango_edad,
      portadaRef: datos.portada_ref,
      paginas: datos.paginas,
      idioma: datos.idioma,
      palabras: datos.palabras,
      tiempoLecturaMinutos: datos.tiempo_lectura,
      revision: datos.revision,
      creadoEn: { milisegundos: datos.created_at_ms ?? Date.now() },
      actualizadoEn: { milisegundos: datos.updated_at_ms ?? Date.now() },
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    };
  }

  private mapearPagina(datos: PaginaApiDto): PaginaCuento {
    return {
      id: datos.id,
      cuentoId: datos.cuento_id,
      versionId: datos.version_id,
      orden: datos.orden,
      contenido: datos.contenido,
      ilustracionRef: datos.ilustracion_ref,
      textoAlternativo: datos.texto_alternativo ?? '',
      fondoToken: datos.fondo_token ?? 'var(--daemon-surface)',
      sugerencia: null,
      creadoEn: { milisegundos: datos.created_at_ms ?? Date.now() },
      actualizadoEn: { milisegundos: datos.updated_at_ms ?? Date.now() },
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    };
  }

  private mapearComentario(cuentoId: string, datos: ComentarioApiDto): ComentarioCuento {
    return {
      id: datos.id,
      cuentoId,
      autorUid: datos.autor_uid,
      cuerpo: datos.cuerpo,
      estado: this.esEstadoComentario(datos.estado) ? datos.estado : 'visible',
      creadoEn: { milisegundos: datos.created_at_ms ?? Date.now() },
      actualizadoEn: { milisegundos: datos.updated_at_ms ?? Date.now() },
      schemaVersion: VERSION_ESQUEMA_CUENTO,
    };
  }

  private idAleatorio(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let resultado = '';
    const valores = crypto.getRandomValues(new Uint8Array(20));
    for (const valor of valores) {
      resultado += chars[valor % chars.length];
    }
    return resultado;
  }

  private esEstado(valor: string): valor is Cuento['estado'] {
    return ['borrador', 'en_revision', 'publicado', 'rechazado', 'archivado', 'eliminado'].includes(valor);
  }

  private esVisibilidad(valor: string): valor is Cuento['visibilidad'] {
    return ['privado', 'aula', 'comunidad'].includes(valor);
  }

  private esModeracion(valor: string): valor is Cuento['moderacion'] {
    return ['no_solicitada', 'pendiente', 'aprobado', 'rechazado'].includes(valor);
  }

  private esEstadoComentario(valor: string): valor is ComentarioCuento['estado'] {
    return ['visible', 'oculto', 'eliminado', 'spam'].includes(valor);
  }
}