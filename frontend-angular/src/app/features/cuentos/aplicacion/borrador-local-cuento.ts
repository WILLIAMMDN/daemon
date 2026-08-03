import { Injectable } from '@angular/core';
import { DatosBorradorCuento, VERSION_ESQUEMA_CUENTO } from '../dominio/cuento.modelo';
import { PaginaCuento } from '../dominio/pagina-cuento.modelo';

interface PaginaLocal {
  id: string;
  orden: number;
  contenido: string;
  ilustracionRef: string | null;
  textoAlternativo: string;
  fondoToken: string;
}

interface BorradorLocal {
  schemaVersion: 1;
  cuentoSchemaVersion: typeof VERSION_ESQUEMA_CUENTO;
  cuentoId: string;
  versionId: string;
  revisionBase: number;
  titulo: string;
  sinopsis: string;
  categoria: string;
  rangoEdad: string;
  portadaRef: string | null;
  paginas: PaginaLocal[];
  checksum: string;
}

@Injectable({ providedIn: 'root' })
export class BorradorLocalCuento {
  private readonly prefijo = 'daemon:cuentos:borrador:v2:';

  guardar(uid: string, datos: DatosBorradorCuento): void {
    const base = this.serializar(datos);
    const documento: BorradorLocal = { ...base, checksum: this.checksum(base) };
    this.storage()?.setItem(this.clave(uid, datos.cuentoId), JSON.stringify(documento));
  }

  recuperar(uid: string, servidor: DatosBorradorCuento): DatosBorradorCuento | null {
    const storage = this.storage();
    const crudo = storage?.getItem(this.clave(uid, servidor.cuentoId));
    if (!crudo) return null;
    try {
      const documento = JSON.parse(crudo) as BorradorLocal;
      const { checksum, ...base } = documento;
      if (documento.schemaVersion !== 1
        || documento.cuentoSchemaVersion !== VERSION_ESQUEMA_CUENTO
        || documento.cuentoId !== servidor.cuentoId
        || documento.versionId !== servidor.versionId
        || documento.revisionBase !== servidor.revisionEsperada
        || checksum !== this.checksum(base)) {
        return null;
      }
      return {
        cuentoId: documento.cuentoId,
        versionId: documento.versionId,
        revisionEsperada: documento.revisionBase,
        titulo: documento.titulo,
        sinopsis: documento.sinopsis,
        categoria: documento.categoria,
        rangoEdad: documento.rangoEdad,
        portadaRef: documento.portadaRef,
        paginas: documento.paginas.map((pagina): PaginaCuento => ({
          ...pagina,
          cuentoId: documento.cuentoId,
          versionId: documento.versionId,
          sugerencia: null,
          creadoEn: null,
          actualizadoEn: null,
          schemaVersion: VERSION_ESQUEMA_CUENTO,
        })),
      };
    } catch {
      storage?.removeItem(this.clave(uid, servidor.cuentoId));
      return null;
    }
  }

  limpiar(uid: string, cuentoId: string): void {
    this.storage()?.removeItem(this.clave(uid, cuentoId));
  }

  private serializar(datos: DatosBorradorCuento): Omit<BorradorLocal, 'checksum'> {
    return {
      schemaVersion: 1,
      cuentoSchemaVersion: VERSION_ESQUEMA_CUENTO,
      cuentoId: datos.cuentoId,
      versionId: datos.versionId,
      revisionBase: datos.revisionEsperada,
      titulo: datos.titulo,
      sinopsis: datos.sinopsis,
      categoria: datos.categoria,
      rangoEdad: datos.rangoEdad,
      portadaRef: datos.portadaRef,
      paginas: datos.paginas.map((pagina) => ({
        id: pagina.id,
        orden: pagina.orden,
        contenido: pagina.contenido,
        ilustracionRef: pagina.ilustracionRef,
        textoAlternativo: pagina.textoAlternativo,
        fondoToken: pagina.fondoToken,
      })),
    };
  }

  private checksum(valor: object): string {
    const texto = JSON.stringify(valor);
    let hash = 2166136261;
    for (let indice = 0; indice < texto.length; indice += 1) {
      hash ^= texto.charCodeAt(indice);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  private clave(uid: string, cuentoId: string): string {
    return `${this.prefijo}${uid}:${cuentoId}`;
  }

  private storage(): Storage | null {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
