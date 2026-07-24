import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Resultado de una subida. La `rutaRelativa` se persiste en Firestore
 * (con prefijo `uploads/`) y `Activos.url()` la resuelve a la URL pública.
 */
export interface ResultadoSubida {
  /** Ruta dentro del bucket, sin slash inicial. Ej: `cuentos/portadas/abc.jpg`. */
  rutaBucket: string;
  /** Ruta con el prefijo `uploads/`. Ej: `uploads/cuentos/portadas/abc.jpg`. */
  rutaRelativa: string;
  /** URL pública (la que verá el navegador). */
  urlPublica: string;
  /** Tamaño en bytes del archivo subido. */
  tamano: number;
  /** Content-Type que se le envió a Supabase. */
  contentType: string;
}

/**
 * Servicio de almacenamiento de archivos en Supabase Storage.
 *
 * Estructura de carpetas dentro del bucket `daemon-assets`:
 *   uploads/cuentos/portadas/{cuentoId}.{ext}
 *   uploads/cuentos/ilustraciones/{cuentoId}/{pageId}.{ext}
 *
 * Los archivos se suben con `x-upsert: true`, así que reemplazar la portada
 * o la ilustración de una página SOBREESCRIBE el archivo anterior (mismo
 * nombre). Esto evita acumular basura en el bucket.
 *
 * Seguridad:
 *   - Sólo usa la `anon` key (pública). NUNCA la `service_role`.
 *   - Asume que el bucket `daemon-assets` permite INSERT a usuarios
 *     anónimos. Si Supabase tiene RLS estricto, hay que añadir una policy
 *     `bucket_authenticated_insert` o similar.
 */
@Injectable({ providedIn: 'root' })
export class AlmacenamientoArchivos {
  private readonly cfg = environment.supabase;
  /** Endpoint base del bucket (sin slash final). */
  private readonly baseBucket = `${this.cfg.url}/storage/v1/object/${this.cfg.bucket}`;

  /**
   * Convierte una ruta relativa (`uploads/...`) en la URL pública que
   * sirve Supabase. Si la entrada ya es una URL absoluta, la devuelve tal cual.
   */
  urlPublica(ruta: string | null | undefined): string {
    if (!ruta) return '';
    if (/^https?:\/\//i.test(ruta)) return ruta;
    if (/^(data:|blob:)/i.test(ruta)) return ruta; // legacy: base64 en Firestore
    const limpia = ruta.replace(/^\/+/, '');
    return `${this.cfg.url}/storage/v1/object/public/${this.cfg.bucket}/${limpia}`;
  }

  /**
   * Sube la portada de un cuento. La ruta final dentro del bucket es
   * `cuentos/portadas/{cuentoId}.{ext}`. Si vuelves a llamar con el
   * mismo `cuentoId`, sobreescribe.
   */
  async subirPortada(cuentoId: string, archivo: File | Blob): Promise<ResultadoSubida> {
    const ext = this.extensionDe(archivo);
    return this.subir(`cuentos/portadas/${cuentoId}.${ext}`, archivo);
  }

  /**
   * Sube la ilustración de UNA página de un cuento.
   * Ruta: `cuentos/ilustraciones/{cuentoId}/{pageId}.{ext}`.
   */
  async subirIlustracion(
    cuentoId: string,
    pageId: string,
    archivo: File | Blob,
  ): Promise<ResultadoSubida> {
    const ext = this.extensionDe(archivo);
    return this.subir(`cuentos/ilustraciones/${cuentoId}/${pageId}.${ext}`, archivo);
  }

  /**
   * Elimina un archivo a partir de su ruta relativa (`uploads/...`) o URL
   * absoluta. Es best-effort: si falla (p.ej. 404), no lanza error —
   * simplemente lo registra. El llamador decide si importa.
   */
  async eliminar(ruta: string | null | undefined): Promise<void> {
    if (!ruta) return;
    // Por seguridad, sólo borramos rutas de NUESTRO bucket. Si la URL es
    // externa, la ignoramos para no borrar nada por accidente.
    if (/^https?:\/\//i.test(ruta)) {
      if (!ruta.startsWith(this.cfg.url)) return;
    }
    const limpia = ruta
      .replace(/^\/+/, '')
      .replace(new RegExp(`^${this.cfg.uploadsPath}/`), '');
    const url = `${this.baseBucket}/${limpia}`;
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this.headers(),
      });
      if (!res.ok && res.status !== 404) {
        console.warn(`[Almacenamiento] No se pudo eliminar ${ruta} (${res.status})`);
      }
    } catch (e) {
      console.warn('[Almacenamiento] Error eliminando archivo', ruta, e);
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  Privados
  // ──────────────────────────────────────────────────────────────

  private async subir(rutaBucket: string, archivo: File | Blob): Promise<ResultadoSubida> {
    if (!this.cfg.anonKey || this.cfg.anonKey.endsWith('not-configured')) {
      throw new Error(
        'Falta configurar environment.supabase.anonKey. Revisa src/environments/environment*.ts',
      );
    }

    const contentType = archivo.type || 'application/octet-stream';
    const url = `${this.baseBucket}/${rutaBucket}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.headers(),
        'Content-Type': contentType,
        // x-upsert permite SOBREESCRIBIR si ya existe. Crítico para que
        // reemplazar la portada o la ilustración no acumule archivos.
        'x-upsert': 'true',
      },
      body: archivo,
    });

    if (!res.ok) {
      const detalle = await res.text().catch(() => res.statusText);
      throw new Error(
        `Supabase Storage rechazó la subida (${res.status} ${res.statusText}): ${detalle}`,
      );
    }

    const rutaRelativa = `${this.cfg.uploadsPath}/${rutaBucket}`;
    return {
      rutaBucket,
      rutaRelativa,
      urlPublica: this.urlPublica(rutaRelativa),
      tamano: archivo.size,
      contentType,
    };
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.cfg.anonKey}`,
      apikey: this.cfg.anonKey,
    };
  }

  /** Devuelve la extensión del archivo en minúsculas, sin el punto. */
  private extensionDe(archivo: File | Blob): string {
    const tipo = archivo.type || '';
    const mapa: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    if (mapa[tipo]) return mapa[tipo];
    // Fallback: intentamos sacar la extensión del nombre (si es File)
    if ('name' in archivo && typeof archivo.name === 'string') {
      const match = archivo.name.match(/\.([a-z0-9]+)$/i);
      if (match) return match[1].toLowerCase();
    }
    return 'jpg';
  }
}
